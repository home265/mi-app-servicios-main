import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const AD_COUNTERS_COLLECTION = 'adCounters';

/**
 * Obtiene el índice del siguiente anuncio a mostrar para una localidad específica
 * y actualiza el contador para el próximo usuario.
 * Utiliza una transacción de Firestore para evitar que dos usuarios obtengan el mismo índice a la vez.
 * @param provincia La provincia del usuario.
 * @param localidad La localidad del usuario.
 * @param totalAds El número total de anuncios en la lista para esa localidad.
 * @returns El índice (basado en 0) del anuncio que se debe mostrar.
 */
export const getNextAdIndex = async (
  provincia: string,
  localidad: string,
  totalAds: number
): Promise<number> => {
  // Si no hay anuncios en la lista, no hay nada que hacer.
  if (totalAds <= 0) {
    return 0;
  }

  // Creamos un ID único y limpio para el documento del contador.
  const locationId = `${provincia}_${localidad}`.toLowerCase().replace(/\s+/g, '_');
  const counterDocRef = doc(db, AD_COUNTERS_COLLECTION, locationId);

  try {
    const nextIndex = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);

      // Obtenemos el último índice guardado. Si no existe, empezamos desde -1.
      const lastIndex = counterDoc.data()?.lastAdIndex ?? -1;
      
      // Calculamos el índice para el usuario actual usando el operador de módulo (%)
      // para que la cuenta vuelva a 0 al llegar al final (la "rueda").
      const currentIndexToShow = (lastIndex + 1) % totalAds;

      // Actualizamos el contador en la base de datos para el *siguiente* usuario.
      transaction.set(counterDocRef, { 
        lastAdIndex: currentIndexToShow,
        updatedAt: serverTimestamp() 
      });

      // Devolvemos el índice que le toca a *este* usuario.
      return currentIndexToShow;
    });

    return nextIndex;
  } catch (error) {
    console.error(`Error en la transacción del contador de anuncios para ${locationId}:`, error);
    // Si la transacción falla, devolvemos 0 como un valor seguro para no romper la app.
    return 0;
  }
};