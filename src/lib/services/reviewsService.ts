import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';

export type Recipient = { uid: string; collection: string };
export type Author    = { uid: string; collection: string };
export type ReviewContext = 'as_user' | 'as_provider';

/**
 * Estructura de una reseña en cliente
 */
export interface Review {
  id: string;
  authorId: string;
  authorCollection: string;
  rating: number;
  comment: string;
  timestamp: unknown;
}

/**
 * Crea una reseña en la subcolección adecuada bajo el documento target.
 */
export async function createReview(
  target: Recipient,
  author: Author,
  context: ReviewContext,
  rating: number,
  comment: string
): Promise<void> {
  // Determinar subcolección según contexto
  const sub = context === 'as_provider'
    ? 'reviews_as_provider'
    : 'reviews_as_user';

  const colRef = collection(
    db,
    target.collection,
    target.uid,
    sub
  );
  await addDoc(colRef, {
    authorId: author.uid,
    authorCollection: author.collection,
    rating,
    comment,
    timestamp: serverTimestamp(),
  });
}

/**
 * Obtiene las reseñas de un target en un contexto específico.
 */
export async function getReviews(
  target: Recipient,
  context: ReviewContext
): Promise<Review[]> {
  const sub = context === 'as_provider'
    ? 'reviews_as_provider'
    : 'reviews_as_user';

  const colRef = collection(
    db,
    target.collection,
    target.uid,
    sub
  );
  const snap: QuerySnapshot<DocumentData> = await getDocs(colRef);
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Review, 'id'>),
  }));
}
