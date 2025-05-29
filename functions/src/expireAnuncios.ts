import { onSchedule, ScheduledEvent, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Inicializa la app de Firebase Admin si no está inicializada
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Opciones de configuración para la función programada expireAnuncios.
 * Nota: La configuración de 'retry' para la ejecución de la función de 2ª gen
 * gatillada por scheduler/pubsub se maneja a nivel de GCP, no directamente aquí.
 */
const expireAnunciosOptions: ScheduleOptions = {
  schedule: '0 0 * * *', // Todos los días a las 00:00
  timeZone: 'America/Argentina/Mendoza',
  region: 'southamerica-west1', // Especifica la región o regiones
  // memory: '512MiB', // Opcional: configura memoria
  // timeoutSeconds: 300, // Opcional: configura timeout (numérico)
};

/**
 * Función programada: cada día a medianoche (según timeZone especificada).
 * Marca como 'expired' los anuncios cuyo 'status' es 'active' y cuya 'endDate' ya pasó.
 */
export const expireAnuncios = onSchedule(
  expireAnunciosOptions,
  async (event: ScheduledEvent) => {
    const db = admin.firestore();
    const now = Timestamp.now();

    console.log(
      `Función expireAnuncios (v2.2 corregida) ejecutada a las: ${now.toDate().toISOString()} para el job: ${event.jobName}`
    );
    console.log(`Hora programada de ejecución (UTC): ${event.scheduleTime}`);

    try {
      const anunciosAExpirarQuery = db
        .collection('anuncios')
        .where('status', '==', 'active')
        .where('endDate', '<=', now);

      const snapshot = await anunciosAExpirarQuery.get();

      if (snapshot.empty) {
        console.log('No hay anuncios activos para expirar en esta ejecución.');
        return;
      }

      console.log(`Se encontraron ${snapshot.size} anuncios para expirar.`);

      const MAX_WRITES_PER_BATCH = 490;
      const batches: admin.firestore.WriteBatch[] = [];
      let currentBatch = db.batch();
      let operationsInCurrentBatch = 0;

      for (const doc of snapshot.docs) {
        const docData = doc.data();
        console.log(
          `Preparando para expirar anuncio: ${doc.id}. ` +
          `endDate: ${docData.endDate?.toDate()?.toISOString() || 'Fecha inválida en doc'}, ` +
          `now: ${now.toDate().toISOString()}`
        );
        currentBatch.update(doc.ref, { status: 'expired', updatedAt: now });
        operationsInCurrentBatch++;

        if (operationsInCurrentBatch === MAX_WRITES_PER_BATCH) {
          batches.push(currentBatch);
          currentBatch = db.batch();
          operationsInCurrentBatch = 0;
        }
      }

      if (operationsInCurrentBatch > 0) {
        batches.push(currentBatch);
      }

      if (batches.length > 0) {
        console.log(`Se procesarán ${snapshot.size} anuncios en ${batches.length} lote(s).`);
        await Promise.all(batches.map((batch, index) => {
          console.log(`Comprometiendo lote #${index + 1}...`);
          return batch.commit();
        }));
        console.log(
          `Todos los lotes comprometidos. Se marcaron como expirados un total de ${snapshot.size} anuncios.`
        );
      } else if (snapshot.size > 0) {
          console.warn("Se encontraron anuncios para expirar, pero no se generaron lotes. Revisar lógica de creación de lotes.");
      }

    } catch (error) {
      console.error('Error severo al expirar anuncios:', error);
      // Relanzar el error es importante para que la plataforma de Cloud Functions
      // sepa que la ejecución falló y aplique políticas de reintento configuradas en GCP.
      throw error;
    }
  }
);