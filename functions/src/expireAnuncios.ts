import { onSchedule, ScheduledEvent, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Inicializa la app de Firebase Admin si no está inicializada
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Opciones de configuración para la función programada expireSubscriptions.
 */
const expireSubscriptionsOptions: ScheduleOptions = {
  schedule: '0 0 * * *',                 // Todos los días a las 00:00
  timeZone: 'America/Argentina/Mendoza',
  region: 'southamerica-west1',
};

/**
 * Función programada: cada día a medianoche (según timeZone especificada).
 * Desactiva (“isActive = false”) las cards cuya suscripción ha expirado.
 */
export const expireSubscriptions = onSchedule(
  expireSubscriptionsOptions,
  async (event: ScheduledEvent) => {
    const db = admin.firestore();
    const now = Timestamp.now();

    console.log(
      `expireSubscriptions ejecutada a: ${now.toDate().toISOString()} (job=${event.jobName})`
    );
    console.log(`Programada para: ${event.scheduleTime}`);

    try {
      // Busca cards activas cuya subscriptionEndDate ya pasó
      const toExpireQuery = db
        .collection('paginas_amarillas')
        .where('isActive', '==', true)
        .where('subscriptionEndDate', '<=', now);

      const snapshot = await toExpireQuery.get();

      if (snapshot.empty) {
        console.log('No hay suscripciones expiradas para procesar.');
        return;
      }

      console.log(`Encontradas ${snapshot.size} suscripción(es) para expirar.`);

      const MAX_WRITES_PER_BATCH = 490;
      const batches: admin.firestore.WriteBatch[] = [];
      let batch = db.batch();
      let opsInBatch = 0;

      for (const doc of snapshot.docs) {
        console.log(
          `Expirando card ${doc.id}: end=${doc.data().subscriptionEndDate.toDate().toISOString()}`
        );
        batch.update(doc.ref, {
          isActive: false,
          updatedAt: now,
        });
        opsInBatch++;

        if (opsInBatch >= MAX_WRITES_PER_BATCH) {
          batches.push(batch);
          batch = db.batch();
          opsInBatch = 0;
        }
      }

      if (opsInBatch > 0) {
        batches.push(batch);
      }

      console.log(`Comprometiendo ${batches.length} lote(s) de expiración...`);
      await Promise.all(
        batches.map((b, i) => {
          console.log(`  - Lote ${i + 1}`);
          return b.commit();
        })
      );
      console.log(`Todas las suscripciones expiradas han sido marcadas como inactivas.`);

    } catch (error) {
      console.error('Error al expirar suscripciones:', error);
      // Relanza para que GCP aplique lógica de reintento
      throw error;
    }
  }
);
