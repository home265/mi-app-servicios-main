// lib/services/reviewsService.ts

import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  type DocumentData,
  type QuerySnapshot,
  type Timestamp,
  type FieldValue,
} from 'firebase/firestore';

// Tipos que se mantienen igual
export type Recipient = { uid: string; collection: string };
export type Author = { uid: string; collection: string };
export type ReviewContext = 'as_user' | 'as_provider';

/**
 * Representa las calificaciones detalladas de una reseña.
 * Ejemplo: { calidad: 5, puntualidad: 4, comunicacion: 5 }
 */
export type DetailedRatings = {
  [key: string]: number;
};

/**
 * Estructura de una reseña en el cliente, después de ser leída de Firestore.
 * El campo 'timestamp' es un objeto Timestamp.
 */
export interface ReviewData {
  id: string;
  authorId: string;
  authorCollection: string;
  comment: string;
  ratings: DetailedRatings;
  overallRating: number;
  timestamp: Timestamp;
}

/**
 * Estructura del documento que se escribe en Firestore.
 * El campo 'timestamp' es un FieldValue (serverTimestamp()).
 */
type ReviewDocument = Omit<ReviewData, 'id' | 'timestamp'> & {
  timestamp: FieldValue;
};

/**
 * Crea una reseña detallada en la subcolección adecuada bajo el documento target.
 * Calcula el promedio general antes de guardar.
 *
 * @param target A quién se está calificando.
 * @param author Quién está escribiendo la reseña.
 * @param context El contexto de la reseña (calificando como usuario o como proveedor).
 * @param ratings Objeto con las calificaciones de cada criterio.
 * @param comment El comentario de texto de la reseña.
 */
export async function createReview(
  target: Recipient,
  author: Author,
  context: ReviewContext,
  ratings: DetailedRatings,
  comment: string
): Promise<void> {
  // Determinar la subcolección según el contexto
  const subcollectionName =
    context === 'as_provider' ? 'reviews_as_provider' : 'reviews_as_user';

  // --- Lógica para calcular el promedio general ---
  const ratingValues = Object.values(ratings);
  const overallRating =
    ratingValues.length > 0
      ? ratingValues.reduce((sum, current) => sum + current, 0) /
        ratingValues.length
      : 0;
  // ---------------------------------------------

  const collectionRef = collection(db, target.collection, target.uid, subcollectionName);

  const newReview: ReviewDocument = {
    authorId: author.uid,
    authorCollection: author.collection,
    ratings,
    overallRating: parseFloat(overallRating.toFixed(2)),
    comment,
    timestamp: serverTimestamp(),
  };

  await addDoc(collectionRef, newReview);
}

/**
 * Obtiene todas las reseñas de un target en un contexto específico.
 *
 * @param target El usuario cuyas reseñas se quieren obtener.
 * @param context El contexto de las reseñas a obtener.
 * @returns Una promesa que resuelve a un array de reseñas con la nueva estructura.
 */
export async function getReviews(
  target: Recipient,
  context: ReviewContext
): Promise<ReviewData[]> {
  const subcollectionName =
    context === 'as_provider' ? 'reviews_as_provider' : 'reviews_as_user';

  const collectionRef = collection(db, target.collection, target.uid, subcollectionName);

  // CORRECCIÓN: Se usa el tipo genérico que devuelve getDocs por defecto.
  const snapshot: QuerySnapshot<DocumentData> = await getDocs(collectionRef);

  if (snapshot.empty) {
    return [];
  }

  // Se realiza la aserción de tipo en cada documento individual, que es más seguro.
  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<ReviewData, 'id'>;
    return {
      id: doc.id,
      ...data,
    };
  });
}