import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CampaignId } from './types/paginaAmarilla';


if (!admin.apps.length) {
  admin.initializeApp();
}

// --- CAMBIO: La interfaz ahora usa 'campaignId' para mayor claridad ---
interface PaymentSuccessRequestBody {
  cardId: string;
  campaignId: CampaignId;
}

interface HttpError extends Error {
  status?: number;
}

const allowedOrigins = [
  'http://localhost:3000',
  'https://mi-app-servicios-3326e.web.app',
];

export const onSubscriptionPayment = functions.https.onRequest(
  async (req, res): Promise<void> => {
    const origin = req.headers.origin as string | undefined;
    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
      res.set('Access-Control-Max-Age', '3600');
      res.status(204).send('');
      return;
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS');
      res.status(405).send({ error: 'Método no permitido. Use POST.' });
      return;
    }

    try {
      // --- CAMBIO: Se lee 'campaignId' en lugar de 'plan' ---
      const { cardId, campaignId } = req.body as PaymentSuccessRequestBody;
      if (
        !cardId ||
        typeof cardId !== 'string' ||
        !['mensual', 'trimestral', 'semestral', 'anual'].includes(campaignId)
      ) {
        res
          .status(400)
          .send({
            error:
              'Los campos "cardId" (string) y "campaignId" (mensual|trimestral|semestral|anual) son requeridos.',
          });
        return;
      }

      const db = admin.firestore();
      const docRef = db.collection('paginas_amarillas').doc(cardId);
      const now = Timestamp.now();

      await db.runTransaction(async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists) {
          const notFound = new Error(
            `Card con ID "${cardId}" no encontrada.`
          ) as HttpError;
          notFound.status = 404;
          throw notFound;
        }

        // --- CAMBIO: Se usa 'campaignId' ---
        const monthsMap: Record<CampaignId, number> = {
          mensual: 1,
          trimestral: 3,
          semestral: 6,
          anual: 12,
        };

        const addMonths = monthsMap[campaignId];
        const startDate = now;
        // Aproximación de meses. Para mayor precisión se podrían usar librerías de fechas.
        const endDate = new Date(now.toMillis());
        endDate.setMonth(endDate.getMonth() + addMonths);
        
        // --- CAMBIO: Se guarda 'campaignId' en lugar de 'subscriptionPlan' ---
        tx.update(docRef, {
          campaignId: campaignId,
          subscriptionStartDate: Timestamp.fromDate(startDate.toDate()),
          subscriptionEndDate: Timestamp.fromDate(endDate),
          isActive: true,
          updatedAt: now,
          paymentConfirmedAt: now,
        });
      });

      res
        .status(200)
        .send({
          message: `Card "${cardId}" suscripción activada/renovada (${campaignId}).`,
        });
    } catch (err: unknown) {
      const error = err as HttpError;
      const status = error.status ?? 500;
      const msg =
        error.message ||
        'Error interno al procesar el pago de suscripción.';
      res.status(status).send({ error: msg });
    }
  }
);