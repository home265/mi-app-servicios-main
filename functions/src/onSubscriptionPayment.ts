import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// --- Tipos del payload que envía tu webhook de Next.js ---
type SubscriptionPaymentBody = {
  paymentId?: string | number;
  external_reference?: string; // esperado: "creatorId|campaignId"
  mp_status?: string;
  mp_payer_email?: string;
  tf_comprobante?: unknown;
};

// Guardas admitidas para campañas
type CampaignId = 'mensual' | 'trimestral' | 'semestral' | 'anual';

// Meses por campaña
const CAMPAIGN_MONTHS: Record<CampaignId, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

// Documento del anuncio (modelo mínimo que tocamos)
type PaginaAmarillaDoc = {
  paymentId?: string | number;
  status?: 'draft' | 'awaiting_payment' | 'active' | 'expired' | 'canceled';
  campaignId?: CampaignId;
  subscriptionStartDate?: admin.firestore.Timestamp;
  subscriptionEndDate?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  paymentConfirmedAt?: admin.firestore.Timestamp;
};

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function parseBody(x: unknown): SubscriptionPaymentBody {
  if (!isObject(x)) return {};
  const obj = x as Record<string, unknown>;
  const out: SubscriptionPaymentBody = {};
  if (typeof obj.paymentId === 'string' || typeof obj.paymentId === 'number') out.paymentId = obj.paymentId;
  if (typeof obj.external_reference === 'string') out.external_reference = obj.external_reference;
  if (typeof obj.mp_status === 'string') out.mp_status = obj.mp_status;
  if (typeof obj.mp_payer_email === 'string') out.mp_payer_email = obj.mp_payer_email;
  if ('tf_comprobante' in obj) out.tf_comprobante = obj.tf_comprobante as unknown;
  return out;
}

function parseExternalRef(ext?: string): { creatorId: string | null; campaignId: CampaignId | null } {
  if (!ext || typeof ext !== 'string') return { creatorId: null, campaignId: null };
  const [creatorIdRaw, campaignIdRaw] = ext.split('|');
  const creatorId = typeof creatorIdRaw === 'string' && creatorIdRaw.length > 0 ? creatorIdRaw : null;

  const isCampaign = (v: string): v is CampaignId =>
    v === 'mensual' || v === 'trimestral' || v === 'semestral' || v === 'anual';

  const campaignId = typeof campaignIdRaw === 'string' && isCampaign(campaignIdRaw) ? campaignIdRaw : null;
  return { creatorId, campaignId };
}

export const onSubscriptionPayment = onRequest(
  { region: 'us-central1' },
  async (req, res): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
      }

      const body = parseBody(req.body);
      const { paymentId, external_reference, mp_status, mp_payer_email } = body;

      // Solo activamos con pagos aprobados
      if (mp_status !== 'approved') {
        logger.info('Pago no aprobado; se ignora activación', { paymentId, mp_status, external_reference });
        res.status(200).json({ ok: true, skipped: true });
        return;
      }

      const { creatorId, campaignId } = parseExternalRef(external_reference);
      if (!creatorId) {
        logger.error('external_reference inválido o sin creatorId', { external_reference, paymentId });
        res.status(200).json({ ok: true, error: 'external_reference inválido' });
        return;
      }

      const docRef = db.collection('paginas_amarillas').doc(creatorId);

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);

        if (!snap.exists) {
          logger.error('Documento de anuncio inexistente', { creatorId });
          return;
        }

        const data = snap.data() as PaginaAmarillaDoc;

        // Idempotencia: si ya procesamos este paymentId, no repetir
        if (data.paymentId && paymentId && String(data.paymentId) === String(paymentId)) {
          logger.info('Pago ya procesado, se omite', { creatorId, paymentId });
          return;
        }

        // Determinar campaña: del external_reference si vino; si no, del doc actual
        const effectiveCampaign: CampaignId | null = campaignId ?? (data.campaignId ?? null);
        if (!effectiveCampaign) {
          logger.error('No hay campaignId para activar suscripción', { creatorId, paymentId });
          return;
        }

        const months = CAMPAIGN_MONTHS[effectiveCampaign];
        const now = admin.firestore.Timestamp.now();
        const endDateJs = new Date(now.toMillis());
        endDateJs.setMonth(endDateJs.getMonth() + months);
        const endTs = admin.firestore.Timestamp.fromDate(endDateJs);

        tx.update(docRef, {
          status: 'active',
          campaignId: effectiveCampaign,
          subscriptionStartDate: now,
          subscriptionEndDate: endTs,
          paymentId: paymentId ?? snap.get('paymentId') ?? null,
          paymentConfirmedAt: now,
          updatedAt: now,
          payerEmail: mp_payer_email ?? snap.get('payerEmail') ?? null,
        } as Partial<PaginaAmarillaDoc> & Record<string, unknown>); // tipos parciales permitidos en update
      });

      logger.info('Suscripción activada', { creatorId, campaignId, paymentId });
      res.status(200).json({ ok: true });
      return;
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('onSubscriptionPayment error', err);
      // 200 para evitar reintentos agresivos del emisor
      res.status(200).json({ ok: true, error: err.message ?? 'internal' });
      return;
    }
  }
);
