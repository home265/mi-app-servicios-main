// functions/src/mercadoPagoWebhook.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { CampaignId } from './types/paginaAmarilla';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

/* ===========================
 * Tipos y constantes locales
 * =========================== */

export interface Campana {
  id: CampaignId;
  months: number;
}
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
    case 'MONOTRIBUTO': return 'MT'; // si preferís 'CF', cambiá aquí
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

// ---- Nuevo: lector del PERFIL FISCAL ligero (sin números sensibles) ----
type ViaVerificacion = 'cuit_padron' | 'cuil_nombre';
type ReceptorParaFactura = 'CUIT' | 'CONSUMIDOR_FINAL';
type CondicionImpositivaMin =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL'
  | 'NO_CATEGORIZADO';

interface PerfilFiscalLigero {
  viaVerificacion: ViaVerificacion;
  receptorParaFactura: ReceptorParaFactura;
  razonSocial?: string | null;
  condicionImpositiva?: CondicionImpositivaMin | null;
  domicilio?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigopostal?: string | null;
  emailReceptor: string;
  verifiedAt: string;
  proveedor?: { tusFacturasClienteId?: string };
  cuitGuardado: 'none';
}

function isPerfilFiscalLigero(x: unknown): x is PerfilFiscalLigero {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;

  if (o.viaVerificacion !== 'cuit_padron' && o.viaVerificacion !== 'cuil_nombre') return false;
  if (o.receptorParaFactura !== 'CUIT' && o.receptorParaFactura !== 'CONSUMIDOR_FINAL') return false;
  if (typeof o.emailReceptor !== 'string') return false;
  if (typeof o.verifiedAt !== 'string') return false;
  if (o.cuitGuardado !== 'none') return false;

  // opcionales coherentes: strings o null o undefined
  const opt = (v: unknown) => typeof v === 'string' || v === null || typeof v === 'undefined';
  if (!opt(o.razonSocial)) return false;
  if (!(typeof o.condicionImpositiva === 'undefined'
    || o.condicionImpositiva === null
    || ['RESPONSABLE_INSCRIPTO','MONOTRIBUTO','EXENTO','CONSUMIDOR_FINAL','NO_CATEGORIZADO'].includes(String(o.condicionImpositiva))
  )) return false;
  if (!opt(o.domicilio)) return false;
  if (!opt(o.localidad)) return false;
  if (!opt(o.provincia)) return false;
  if (!opt(o.codigopostal)) return false;

  if (typeof o.proveedor !== 'undefined') {
    if (!o.proveedor || typeof o.proveedor !== 'object') return false;
    const p = o.proveedor as Record<string, unknown>;
    if (typeof p.tusFacturasClienteId !== 'undefined' && typeof p.tusFacturasClienteId !== 'string') {
      return false;
    }
  }
  return true;
}

/** Lee el campo 'perfil' en .../informacionFiscal/current (si existe). */
async function readPerfilLigero(uid: string): Promise<PerfilFiscalLigero | null> {
  const col = await findUserCollection(uid);
  if (!col) return null;
  const ref = db.collection(col).doc(uid).collection('informacionFiscal').doc('current');
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown>;
  const perfil = data?.perfil;
  return isPerfilFiscalLigero(perfil) ? (perfil as PerfilFiscalLigero) : null;
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

      // Obtener el pago desde MP
      const payment = await new Payment(mpClient).get({ id: notification.data.id });

      if (!payment || payment.status !== 'approved' || !payment.external_reference) {
        console.log(
          `Pago ${String(payment?.id ?? notification.data.id)} no aprobado (estado: ${String(
            payment?.status ?? 'desconocido'
          )}) o sin external_reference. Omitiendo.`
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
        if (data.paymentId && String(data.paymentId) === String(payment.id)) {
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

        // (OPCIONAL) Leer PERFIL (nuevo) y, si no está, caer al esquema legacy
try {
  const perfil = await readPerfilLigero(creatorId);
  const legacy = await readFiscalProfile(creatorId); // fallback

  if (!perfil && !legacy) {
    console.log(`[TF] Perfil fiscal ausente para ${creatorId}. Se omite emisión.`);
  } else {
    // ¿A quién facturamos?
    const receptor: ReceptorParaFactura =
      (perfil?.receptorParaFactura ?? 'CONSUMIDOR_FINAL');

    // Mail: desde perfil.emailReceptor si está; si no, desde MP payer.email si existe.
    const enviaPorMail = true; // si luego agregás preferencias, respetalas acá
    const emailFactura =
      perfil?.emailReceptor ?? (payment.payer?.email ?? undefined);

    // Condición IVA: preferir la del PERFIL; si no, mapear legacy
    const condIVA: CondicionIVA = perfil?.condicionImpositiva
      ? mapCondicionImpositivaToIVA(perfil.condicionImpositiva)
      : (legacy ? mapCondicionImpositivaToIVA(legacy.condicionImpositiva) : 'NR');

    // Razón social: preferir la del PERFIL; si no, la legacy
    const razonSocial = perfil?.razonSocial ?? legacy?.razonSocial ?? 'Consumidor Final';

    // Monto (SDK no tipa bien transaction_amount)
    const amount =
      typeof (payment as unknown as { transaction_amount?: number }).transaction_amount === 'number'
        ? (payment as unknown as { transaction_amount: number }).transaction_amount
        : 0;

    if (receptor === 'CUIT') {
      // Emisión a CUIT: si no guardás el número, el proveedor lo resuelve por clienteId (si lo usás)
      await tryEmitTFInvoice({
        external_reference: externalRefRaw,
        amount,
        razonSocial,
        emailFactura,
        // cuit/cuil opcional: si no los guardás, dejalos undefined
        cuit: legacy?.cuit,
        cuil: legacy?.cuil,
        condicionIVA: condIVA,
        enviaPorMail,
        // tipo: facturaTipoFromCondicionIVA(condIVA),
      });
    } else {
      // Consumidor Final
      await tryEmitTFInvoice({
        external_reference: externalRefRaw,
        amount,
        razonSocial: 'Consumidor Final',
        emailFactura,
        cuit: undefined,
        cuil: undefined,
        condicionIVA: 'CF',
        enviaPorMail,
        // tipo: 'FACTURA B', // opcional
      });
    }
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
      // Si preferís evitar reintentos de MP aún con errores internos, devolvé 200.
      res.status(500).send('Internal Server Error');
    }
  }
);
