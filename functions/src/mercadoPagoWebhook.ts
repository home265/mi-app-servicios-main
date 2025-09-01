// functions/src/mercadoPagoWebhook.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/* ===========================
 * Tipos y constantes locales
 * =========================== */

export interface Campana {
  id: CampaignId;
  months: number;
}
type CampaignId = 'mensual' | 'trimestral' | 'semestral' | 'anual';

const CAMPANAS: Campana[] = [
  { id: 'mensual', months: 1 },
  { id: 'trimestral', months: 3 },
  { id: 'semestral', months: 6 },
  { id: 'anual', months: 12 },
];

interface MercadoPagoWebhookBody {
  action: string;
  data: { id: string };
}

interface PaginaAmarillaDoc {
  campaignId?: CampaignId;
  paymentId?: string | number;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate?: Timestamp;
  isActive?: boolean;
  updatedAt?: Timestamp;
  paymentConfirmedAt?: Timestamp;
}

type CondicionIVA = 'CF' | 'RI' | 'MT' | 'EX' | 'NR';

interface InformacionFiscalDoc {
  razonSocial: string;
  condicionImpositiva:
    | 'MONOTRIBUTO'
    | 'RESPONSABLE_INSCRIPTO'
    | 'EXENTO'
    | 'CONSUMIDOR_FINAL'
    | 'NO_CATEGORIZADO';
  estado: 'ACTIVO' | 'INACTIVO';
  cuit?: string;
  cuil?: string;
  condicionIVA?: CondicionIVA;
  emailFactura?: string;
  telefonoWhatsapp?: string;
  preferenciasEnvio?: { email: boolean };
}

interface TFCliente {
  documento_tipo: 'CUIT' | 'DNI' | 'EXT';
  documento_nro: string;
  razon_social?: string;
  email?: string;
  condicion_iva: CondicionIVA;
}

interface TFBody {
  usertoken: string;
  apikey: string;
  apitoken: string;
  cliente: TFCliente & { envia_por_mail: 'S' | 'N' };
  comprobante: {
    fecha: string; // dd/mm/yyyy
    tipo: 'FACTURA A' | 'FACTURA B' | 'FACTURA C' | 'FACTURA M' | 'FACTURA E';
    punto_venta: string;
    external_reference: string;
    operacion: 'V';
    moneda: 'PES' | 'DOL';
    detalle: Array<{
      cantidad: string;
      producto: {
        descripcion: string;
        precio_unitario_sin_iva: string;
        alicuota: string;
      };
    }>;
    bonificacion: string;
    leyenda_gral: string;
    pagos?: {
      formas_pago: { descripcion: string; importe: number }[];
      total: number;
    };
  };
}

/* ===== Reemplazo del SDK de MP por REST ===== */

interface MPPayer { email?: string }
interface MPPayment {
  id?: string | number;
  status?: string;
  external_reference?: string;
  transaction_amount?: number;
  payer?: MPPayer;
}

async function getPaymentById(id: string): Promise<MPPayment | null> {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    console.error('[MP] Falta MP_ACCESS_TOKEN en funciones.');
    return null;
  }
  const url = `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const t = await res.text();
    console.error(`[MP] Error ${res.status} al leer pago ${id}: ${t}`);
    return null;
  }
  const data: unknown = await res.json();
  if (typeof data !== 'object' || data === null) return null;

  const o = data as Record<string, unknown>;
  const payerObj = (typeof o.payer === 'object' && o.payer !== null) ? (o.payer as Record<string, unknown>) : undefined;

  const payment: MPPayment = {
    id: typeof o.id === 'number' || typeof o.id === 'string' ? o.id : undefined,
    status: typeof o.status === 'string' ? o.status : undefined,
    external_reference: typeof o.external_reference === 'string' ? o.external_reference : undefined,
    transaction_amount: typeof o.transaction_amount === 'number' ? o.transaction_amount : undefined,
    payer: payerObj ? { email: typeof payerObj.email === 'string' ? payerObj.email : undefined } : undefined,
  };
  return payment;
}

/* ===========================
 * Helpers locales
 * =========================== */

// Si en tu preferencia usás `external_reference = PA-<creatorId>-<timestamp>`
function extractCreatorIdFromExternalRef(ref: string): string {
  const m = ref.match(/^PA-([A-Za-z0-9_~-]+)-\d+$/);
  return m ? m[1] : ref; // si no matchea, devolvemos tal cual
}

const USER_COLLECTIONS = ['prestadores', 'comercios', 'usuarios_generales'] as const;

async function findUserCollection(uid: string): Promise<string | null> {
  for (const col of USER_COLLECTIONS) {
    const ref = db.collection(col).doc(uid);
    const snap = await ref.get();
    if (snap.exists) return col;
  }
  return null;
}

function mapCondicionImpositivaToIVA(ci: InformacionFiscalDoc['condicionImpositiva']): CondicionIVA {
  switch (ci) {
    case 'RESPONSABLE_INSCRIPTO': return 'RI';
    case 'MONOTRIBUTO': return 'MT';
    case 'EXENTO': return 'EX';
    case 'CONSUMIDOR_FINAL': return 'CF';
    case 'NO_CATEGORIZADO':
    default: return 'NR';
  }
}

/** RI → FACTURA A ; resto → FACTURA B */
function facturaTipoFromCondicionIVA(cond: CondicionIVA): 'FACTURA A' | 'FACTURA B' {
  return cond === 'RI' ? 'FACTURA A' : 'FACTURA B';
}

function isInformacionFiscalDoc(x: unknown): x is InformacionFiscalDoc {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.razonSocial === 'string' &&
    (o.estado === 'ACTIVO' || o.estado === 'INACTIVO') &&
    typeof o.condicionImpositiva === 'string'
  );
}

async function readFiscalProfile(uid: string): Promise<InformacionFiscalDoc | null> {
  const col = await findUserCollection(uid);
  if (!col) return null;
  const ref = db.collection(col).doc(uid).collection('informacionFiscal').doc('current');
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data();
  return isInformacionFiscalDoc(data) ? (data as InformacionFiscalDoc) : null;
}

// Emisión de factura en TusFacturas (si hay credenciales). Nunca lanza para evitar reintentos de MP.
async function tryEmitTFInvoice(args: {
  external_reference: string;
  amount: number;
  razonSocial: string;
  emailFactura?: string;
  cuit?: string;
  cuil?: string;
  condicionIVA: CondicionIVA;
  enviaPorMail: boolean;
  tipo?: 'FACTURA A' | 'FACTURA B' | 'FACTURA C' | 'FACTURA M' | 'FACTURA E';
}): Promise<{ ok: boolean; skipped?: boolean; status?: number }> {
  const { TUSFACTURAS_API_KEY, TUSFACTURAS_API_TOKEN, TUSFACTURAS_USER_TOKEN } = process.env;
  if (!TUSFACTURAS_API_KEY || !TUSFACTURAS_API_TOKEN || !TUSFACTURAS_USER_TOKEN) {
    console.log('[TF] Credenciales faltantes; se omite emisión.');
    return { ok: true, skipped: true };
  }

  // Documento: priorizar CUIT, luego CUIL (como DNI)
  const documento_tipo: 'CUIT' | 'DNI' = args.cuit ? 'CUIT' : 'DNI';
  const documento_nro = args.cuit ?? (args.cuil ?? '00000000');

  const cliente: TFCliente = {
    documento_tipo,
    documento_nro,
    razon_social: args.razonSocial,
    email: args.emailFactura,
    condicion_iva: args.condicionIVA,
  };

  const facturaTipo = args.tipo ?? facturaTipoFromCondicionIVA(args.condicionIVA);

  const body: TFBody = {
    usertoken: TUSFACTURAS_USER_TOKEN,
    apikey: TUSFACTURAS_API_KEY,
    apitoken: TUSFACTURAS_API_TOKEN,
    cliente: { ...cliente, envia_por_mail: args.enviaPorMail ? 'S' : 'N' },
    comprobante: {
      fecha: new Date().toLocaleDateString('es-AR'),
      tipo: facturaTipo,
      punto_venta: '0001',
      external_reference: args.external_reference,
      operacion: 'V',
      moneda: 'PES',
      detalle: [
        {
          cantidad: '1',
          producto: {
            descripcion: `Orden ${args.external_reference}`,
            precio_unitario_sin_iva: String(args.amount),
            alicuota: '21',
          },
        },
      ],
      bonificacion: '0',
      leyenda_gral: '',
      pagos: {
        formas_pago: [{ descripcion: 'MercadoPago', importe: args.amount }],
        total: args.amount,
      },
    },
  };

  try {
    const res = await fetch('https://www.tusfacturas.app/app/api/v2/facturacion/nuevo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[TF] Error ${res.status}: ${t}`);
      return { ok: false, status: res.status };
    }
    console.log('[TF] Comprobante emitido correctamente.');
    return { ok: true };
  } catch (err) {
    console.error('[TF] Error inesperado al emitir:', err);
    return { ok: false };
  }
}

/* ==============
 *  HANDLER
 * ============== */
export const mercadoPagoWebhook = functions.https.onRequest(
  async (req, res): Promise<void> => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      res.status(405).send('Method Not Allowed');
      return;
    }

    try {
      const notification = req.body as MercadoPagoWebhookBody;

      if (notification.action !== 'payment.updated' || !notification.data.id) {
        res.status(200).send('Notification ignored');
        return;
      }

      // Obtener el pago desde MP (vía REST, sin SDK)
      const payment = await getPaymentById(notification.data.id);

      if (!payment || payment.status !== 'approved' || !payment.external_reference) {
        console.log(
          `Pago ${String(notification.data.id)} no aprobado o sin external_reference. Omitiendo.`
        );
        res.status(200).send('Webhook processed (ignored).');
        return;
      }

      // Extraer creatorId desde external_reference
      const externalRefRaw = payment.external_reference;
      const creatorId = extractCreatorIdFromExternalRef(externalRefRaw);

      const docRef = db.collection('paginas_amarillas').doc(creatorId);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) {
          console.error(`No existe doc paginas_amarillas/${creatorId}`);
          return;
        }

        const data = snap.data() as PaginaAmarillaDoc;

        // Evitar reprocesar el mismo pago
        if (data.paymentId && payment.id && String(data.paymentId) === String(payment.id)) {
          return;
        }

        // Tomar la campaña desde Firestore (ya elegida antes del pago)
        const campaignId = data.campaignId;
        if (!campaignId) {
          console.error('campaignId ausente en el documento; no se puede activar la suscripción.');
          return;
        }

        const campanaDetails = CAMPANAS.find((c) => c.id === campaignId);
        if (!campanaDetails) {
          console.error(`Campaña no encontrada para el ID: "${campaignId}"`);
          return;
        }

        // (OPCIONAL) Leer perfil fiscal y emitir factura si hay credenciales
        try {
          const fiscal = await readFiscalProfile(creatorId);
          if (!fiscal) {
            console.log(`[TF] Perfil fiscal ausente para ${creatorId}. Se omite emisión.`);
          } else {
            // Determinar email destino según preferencias (si el usuario desactiva email, no se envía)
            const enviaPorMail = fiscal.preferenciasEnvio?.email !== false;
            const emailFactura =
              enviaPorMail ? (fiscal.emailFactura ?? payment.payer?.email) : undefined;

            const condicionIVA = fiscal.condicionIVA ?? mapCondicionImpositivaToIVA(fiscal.condicionImpositiva);

            const amount = typeof payment.transaction_amount === 'number' ? payment.transaction_amount : 0;

            await tryEmitTFInvoice({
              external_reference: externalRefRaw,
              amount,
              razonSocial: fiscal.razonSocial,
              emailFactura,
              cuit: fiscal.cuit,
              cuil: fiscal.cuil,
              condicionIVA,
              enviaPorMail,
            });
          }
        } catch (err) {
          console.error('[TF] Error al preparar/emisión de factura (no bloquea activación):', err);
        }

        // Activar la suscripción
        const now = Timestamp.now();
        const endDate = new Date(now.toMillis());
        endDate.setMonth(endDate.getMonth() + campanaDetails.months);

        tx.update(docRef, {
          campaignId: campanaDetails.id,
          subscriptionStartDate: now,
          subscriptionEndDate: Timestamp.fromDate(endDate),
          isActive: true,
          updatedAt: now,
          paymentConfirmedAt: now,
          paymentId: payment.id,
        });

        console.log(`Suscripción activada para "${creatorId}" con la campaña "${campanaDetails.id}".`);
      });

      res.status(200).send('Webhook processed successfully.');
    } catch (e) {
      const error = e instanceof Error ? e : new Error('unknown');
      console.error('Error en el webhook de Mercado Pago:', error);
      // 200 para evitar reintentos agresivos del emisor
      res.status(200).send('Internal processing error (ignored).');
    }
  }
);
