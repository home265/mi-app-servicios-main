import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from './config';

type UserCollection = 'usuarios_generales' | 'prestadores' | 'comercios';

/**
 * Obtiene los datos de un usuario buscando en las tres colecciones según su rol.
 * @param uid UID del usuario en Firebase Auth
 * @returns Objeto con data y nombre de la colección donde se encontró, o null si no existe.
 */
export async function getUserData(
  uid: string
): Promise<{ data: DocumentData; collection: UserCollection } | null> {
  const collections: UserCollection[] = [
    'usuarios_generales',
    'prestadores',
    'comercios',
  ];

  for (const collection of collections) {
    const ref = doc(db, collection, uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { data: snap.data(), collection };
    }
  }

  return null;
}
