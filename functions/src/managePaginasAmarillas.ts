import { onSchedule, ScheduledEvent } from 'firebase-functions/v2/scheduler'; // Para Cloud Functions v2
import * as logger from 'firebase-functions/logger'; // Nuevo logger para v2
import * as admin from 'firebase-admin';
import { PaginaAmarillaData } from '../../src/types/paginaAmarilla'; // Usar el path alias

// Constantes
const PAGINAS_AMARILLAS_COLLECTION = 'paginas_amarillas';
const ANUNCIOS_COLLECTION = 'anuncios';
const MILISEGUNDOS_EN_UN_ANO = 365 * 24 * 60 * 60 * 1000;
const MAX_OPERATIONS_PER_BATCH = 490;

// Inicializar admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Verifica si un usuario (prestador/comercio) tiene al menos un anuncio activo.
 * Versión para Admin SDK.
 */
async function checkUserHasActiveAnuncio(userId: string): Promise<boolean> {
  try {
    const anunciosRef = db.collection(ANUNCIOS_COLLECTION);
    const now = admin.firestore.Timestamp.now();

    const querySnapshot = await anunciosRef
      .where('creatorId', '==', userId)
      .where('status', '==', 'active')
      .where('endDate', '>', now)
      .limit(1)
      .get();

    return !querySnapshot.empty;
  } catch (error) {
    logger.error(
      `[Admin SDK] Error verificando anuncios activos para el usuario ${userId}:`,
      error
    );
    return false;
  }
}

// Definición de la función programada usando Cloud Functions v2
export const scheduledmanagepaginasamarillas = onSchedule( // Los nombres de funciones v2 deben ser minúsculas
  {
    schedule: 'every 24 hours', // O '0 3 * * *' para una hora específica
    timeZone: 'America/Argentina/Buenos_Aires', // Opcional: ajusta tu zona horaria
    // Puedes añadir más opciones como retryConfig, memory, timeoutSeconds si es necesario
  },
  async (event: ScheduledEvent): Promise<void> => { // Tipar event explícitamente
    logger.log('Iniciando mantenimiento programado de Páginas Amarillas (v2)...', { structuredData: true });
    const now = admin.firestore.Timestamp.now();
    let currentBatch = db.batch();
    let operationsInCurrentBatch = 0;
    let totalOperationsPerformed = 0;

    async function commitCurrentBatch(): Promise<void> {
      if (operationsInCurrentBatch > 0) {
        try {
          await currentBatch.commit();
          logger.info(`Lote de ${operationsInCurrentBatch} operaciones confirmado.`);
          totalOperationsPerformed += operationsInCurrentBatch;
        } catch (error) {
          logger.error('Error al confirmar lote:', error);
        }
        currentBatch = db.batch();
        operationsInCurrentBatch = 0;
      }
    }

    // 1. Manejar publicaciones activas cuya fecha de expiración ha llegado o pasado
    try {
      const expiradasQuerySnapshot = await db
        .collection(PAGINAS_AMARILLAS_COLLECTION)
        .where('activa', '==', true)
        .where('fechaExpiracion', '<=', now)
        .get();

      logger.info(`Encontradas ${expiradasQuerySnapshot.size} publicaciones activas con fecha de expiración pasada.`);

      for (const doc of expiradasQuerySnapshot.docs) {
        const publicacion = doc.data() as PaginaAmarillaData;
        const creatorId = publicacion.creatorId;

        const tieneAnuncioActualmente = await checkUserHasActiveAnuncio(creatorId);

        if (tieneAnuncioActualmente) {
          const nuevaFechaExpiracionMillis = now.toMillis() + MILISEGUNDOS_EN_UN_ANO;
          const nuevaFechaExpiracion = admin.firestore.Timestamp.fromMillis(nuevaFechaExpiracionMillis);

          currentBatch.update(doc.ref, {
            fechaExpiracion: nuevaFechaExpiracion,
            contadorEdicionesAnual: 0,
            inicioCicloEdiciones: now,
            ultimaModificacion: now,
            activa: true,
          });
          logger.info(`Publicación ${doc.id} renovada para usuario ${creatorId}.`);
        } else {
          currentBatch.update(doc.ref, {
            activa: false,
            ultimaModificacion: now,
          });
          logger.info(
            `Publicación ${doc.id} marcada como INACTIVA para usuario ${creatorId} (sin anuncios activos al expirar).`
          );
        }
        operationsInCurrentBatch++;
        if (operationsInCurrentBatch >= MAX_OPERATIONS_PER_BATCH) {
          await commitCurrentBatch();
        }
      }
    } catch (error) {
        logger.error("Error procesando publicaciones expiradas:", error);
    }

    // 2. Revisión proactiva de elegibilidad para publicaciones activas no expiradas
    try {
        const activasNoExpiradasQuerySnapshot = await db
            .collection(PAGINAS_AMARILLAS_COLLECTION)
            .where('activa', '==', true)
            .where('fechaExpiracion', '>', now)
            .get();

        logger.info(`Revisando ${activasNoExpiradasQuerySnapshot.size} publicaciones activas y no expiradas para elegibilidad continua.`);

        for (const doc of activasNoExpiradasQuerySnapshot.docs) {
            const publicacion = doc.data() as PaginaAmarillaData;
            const creatorId = publicacion.creatorId;

            // Evitar doble procesamiento si ya fue manejada por la query de expiradas (aunque no debería pasar por la lógica de la query)
            // Esta comprobación es más por seguridad, pero las queries deberían ser mutuamente excluyentes.

            const tieneAnuncioActualmente = await checkUserHasActiveAnuncio(creatorId);

            if (!tieneAnuncioActualmente) {
                currentBatch.update(doc.ref, {
                    activa: false,
                    ultimaModificacion: now,
                });
                logger.info(
                    `Publicación ${doc.id} marcada como INACTIVA (usuario ${creatorId} perdió anuncio activo antes de expiración de card).`
                );
                operationsInCurrentBatch++;
                if (operationsInCurrentBatch >= MAX_OPERATIONS_PER_BATCH) {
                    await commitCurrentBatch();
                }
            }
        }
    } catch (error) {
        logger.error("Error en revisión proactiva de publicaciones activas:", error);
    }

    await commitCurrentBatch();

    logger.info(
      `Mantenimiento de Páginas Amarillas (v2) completado. Total de operaciones realizadas: ${totalOperationsPerformed}.`
    );
    // Las funciones v2 onSchedule no necesitan retornar explícitamente null, una Promise<void> es suficiente.
  }
);