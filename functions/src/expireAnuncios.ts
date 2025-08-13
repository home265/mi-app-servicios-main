import { onSchedule, ScheduledEvent, ScheduleOptions } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Inicializa la app de Firebase Admin si no está inicializada
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

type NotificationType = 'warning-5-days' | 'warning-final-day';

/**
 * Crea una notificación en la subcolección de un usuario.
 * Busca al usuario en las colecciones de perfiles conocidas.
 * @param userId El UID del usuario a notificar.
 * @param type El tipo de notificación ('warning-5-days' o 'warning-final-day').
 * @param message El mensaje de la notificación.
 */
const createNotification = async (
  userId: string,
  type: NotificationType,
  message: string
): Promise<void> => {
  const userCollections = ['prestadores', 'comercios', 'usuarios_generales'];
  let userProfileRef: admin.firestore.DocumentReference | null = null;

  // Intenta encontrar el documento del usuario en las posibles colecciones
  for (const collectionName of userCollections) {
    const ref = db.collection(collectionName).doc(userId);
    const doc = await ref.get();
    if (doc.exists) {
      userProfileRef = ref;
      break;
    }
  }

  if (userProfileRef) {
    // Si encontramos al usuario, creamos la notificación en su subcolección
    await userProfileRef.collection('notifications').add({
      type,
      message,
      createdAt: Timestamp.now(),
      read: false, // Se marca como no leída
    });
    console.log(`Notificación '${type}' creada para el usuario ${userId}.`);
  } else {
    console.warn(`No se pudo encontrar el perfil del usuario ${userId} para crear la notificación.`);
  }
};

/**
 * Opciones de configuración para la función programada.
 */
const scheduleOptions: ScheduleOptions = {
  schedule: '0 0 * * *', // Todos los días a las 00:00
  timeZone: 'America/Argentina/Mendoza',
  region: 'us-central1',
};

/**
 * Helper: realiza updates en lotes de hasta 500 escrituras.
 */
async function commitInBatches(
  updates: Array<{ ref: admin.firestore.DocumentReference; data: Record<string, unknown> }>
): Promise<void> {
  const BATCH_LIMIT = 500;
  for (let i = 0; i < updates.length; i += BATCH_LIMIT) {
    const slice = updates.slice(i, i + BATCH_LIMIT);
    const batch = db.batch();
    for (const u of slice) {
      batch.update(u.ref, u.data);
    }
    await batch.commit();
  }
}

/**
 * Función programada que se ejecuta diariamente para gestionar suscripciones.
 * 1. Envía avisos a suscripciones que vencen en 5 días.
 * 2. Envía avisos a suscripciones que vencen en las próximas 24 horas.
 * 3. Desactiva las suscripciones que ya han expirado.
 */
export const manageSubscriptionsLifecycle = onSchedule(
  scheduleOptions,
  async (event: ScheduledEvent) => {
    const now = Timestamp.now();
    console.log(`Función manageSubscriptionsLifecycle ejecutada a: ${now.toDate().toISOString()}`);

    try {
      // --- TAREA 1: AVISO DE 5 DÍAS ---
      const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000;
      const warningStartDate = Timestamp.fromMillis(now.toMillis() + fiveDaysInMillis);
      const warningEndDate = Timestamp.fromMillis(warningStartDate.toMillis() + 24 * 60 * 60 * 1000);

      const warning5DaysQuery = db.collection('paginas_amarillas')
        .where('isActive', '==', true)
        .where('subscriptionEndDate', '>=', warningStartDate)
        .where('subscriptionEndDate', '<', warningEndDate);
      
      const warningSnapshot = await warning5DaysQuery.get();
      if (!warningSnapshot.empty) {
        console.log(`Encontradas ${warningSnapshot.size} suscripciones que vencen en 5 días.`);
        for (const doc of warningSnapshot.docs) {
          await createNotification(
            doc.id,
            'warning-5-days',
            'Tu suscripción a la Guía Local expirará en 5 días. ¡No pierdas tu visibilidad!'
          );
        }
      }

      // --- TAREA 2: AVISO DEL ÚLTIMO DÍA ---
      const finalDayEndDate = Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000);
      const finalDayQuery = db.collection('paginas_amarillas')
        .where('isActive', '==', true)
        .where('subscriptionEndDate', '>', now)
        .where('subscriptionEndDate', '<=', finalDayEndDate);
      
      const finalDaySnapshot = await finalDayQuery.get();
      if (!finalDaySnapshot.empty) {
        console.log(`Encontradas ${finalDaySnapshot.size} suscripciones que vencen hoy.`);
        for (const doc of finalDaySnapshot.docs) {
          await createNotification(
            doc.id,
            'warning-final-day',
            'Tu suscripción expira hoy. ¡Renuévala ahora para no perder los beneficios!'
          );
        }
      }

      // --- TAREA 3: DESACTIVAR SUSCRIPCIONES VENCIDAS ---
      const toExpireQuery = db.collection('paginas_amarillas')
        .where('isActive', '==', true)
        .where('subscriptionEndDate', '<=', now);

      const expiredSnapshot = await toExpireQuery.get();
      if (expiredSnapshot.empty) {
        console.log('No hay suscripciones expiradas para procesar.');
        return;
      }

      console.log(`Encontradas ${expiredSnapshot.size} suscripción(es) para expirar.`);
      const updates: Array<{ ref: admin.firestore.DocumentReference; data: Record<string, unknown> }> = [];

      expiredSnapshot.docs.forEach((docSnap) => {
        console.log(`Expirando card ${docSnap.id}`);
        updates.push({
          ref: docSnap.ref,
          data: {
            isActive: false,
            status: 'expired',              // ← NUEVO estado
            subscriptionExpiredAt: now,     // ← NUEVO timestamp de expiración
            updatedAt: now,
          },
        });
      });

      await commitInBatches(updates);
      console.log(`Todas las suscripciones expiradas han sido marcadas como inactivas.`);

    } catch (error) {
      console.error('Error al gestionar el ciclo de vida de las suscripciones:', error);
      throw error; // Relanza para que GCP aplique la lógica de reintento
    }
  }
);

// --- INICIO: NUEVA FUNCIÓN DE LIMPIEZA ---

/**
 * Opciones de configuración para la función de limpieza mensual.
 */
const cleanupInactivePublicationsOptions: ScheduleOptions = {
  schedule: '0 2 1 * *', // El primer día de cada mes a las 02:00
  timeZone: 'America/Argentina/Mendoza',
  region: 'us-central1',
};

/**
 * Función programada que se ejecuta mensualmente para borrar publicaciones inactivas antiguas.
 * Elimina las publicaciones que han estado inactivas por más de 90 días.
 */
export const cleanupInactivePublications = onSchedule(
  cleanupInactivePublicationsOptions,
  async (event: ScheduledEvent) => {
    const now = Timestamp.now();
    console.log(`Función cleanupInactivePublications ejecutada a: ${now.toDate().toISOString()}`);

    // 1. Calcula la fecha de hace 90 días
    const ninetyDaysInMillis = 90 * 24 * 60 * 60 * 1000;
    const cutoffDate = Timestamp.fromMillis(now.toMillis() - ninetyDaysInMillis);

    try {
      // 2. Busca publicaciones inactivas cuya fecha de vencimiento sea anterior al límite
      const toDeleteQuery = db.collection('paginas_amarillas')
        .where('isActive', '==', false)
        .where('subscriptionEndDate', '<=', cutoffDate);

      const snapshot = await toDeleteQuery.get();

      if (snapshot.empty) {
        console.log('No hay publicaciones inactivas antiguas para eliminar.');
        return;
      }

      console.log(`Encontradas ${snapshot.size} publicación(es) para eliminar permanentemente.`);

      // 3. Borra los documentos encontrados en lotes seguros
      const BATCH_LIMIT = 500;
      for (let i = 0; i < snapshot.docs.length; i += BATCH_LIMIT) {
        const slice = snapshot.docs.slice(i, i + BATCH_LIMIT);
        const batch = db.batch();
        slice.forEach((docSnap) => {
          console.log(`Programando borrado para la publicación ${docSnap.id}`);
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }

      console.log('Limpieza completada. Todas las publicaciones inactivas antiguas han sido eliminadas.');

    } catch (error) {
      console.error('Error durante la limpieza de publicaciones inactivas:', error);
      throw error; // Relanza para reintentos
    }
  }
);
// --- FIN: NUEVA FUNCIÓN DE LIMPIEZA ---
