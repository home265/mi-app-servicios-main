// src/lib/firebase/firestore.ts
import { doc, deleteDoc, getDoc, DocumentSnapshot, updateDoc } from 'firebase/firestore';
import { db } from './config'; // Tu instancia exportada de firestore (db)
import { deleteField } from 'firebase/firestore'; 
// Lista de posibles colecciones de usuarios (mantener consistente con Providers.tsx)
const USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

/**
 * Determina la colección correcta para un usuario basado en su rol o intentando encontrar el documento.
 * @param uid El UID del usuario.
 * @param rol (Opcional) El rol conocido del usuario.
 * @returns El nombre de la colección donde se encontró el usuario, o null.
 */
async function findUserCollection(uid: string, rol?: string): Promise<string | null> {
    if (rol) {
        switch (rol) {
            case 'prestador': return 'prestadores';
            case 'comercio': return 'comercios';
            case 'usuario': // Asumiendo que 'usuario' mapea a 'usuarios_generales'
            default: return 'usuarios_generales';
        }
    } else {
        // Si no se conoce el rol, intentar buscar en las colecciones
        console.warn("findUserCollection: No se proporcionó rol, buscando en todas las colecciones...");
        for (const collectionName of USER_COLLECTIONS) {
            const docRef = doc(db, collectionName, uid);
            const docSnap: DocumentSnapshot = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log(`findUserCollection: Usuario encontrado en ${collectionName}`);
                return collectionName;
            }
        }
        return null; // No encontrado
    }
}


/**
 * Borra el documento de perfil de usuario de la colección correcta en Firestore.
 * @param uid El UID del usuario a borrar.
 * @param rol (Opcional pero recomendado) El rol del usuario para encontrar la colección rápidamente.
 * @returns Promise<void>
 * @throws Si no se encuentra la colección o falla el borrado.
 */
export const deleteUserProfile = async (uid: string, rol?: string): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);
  
  if (!collectionName) {
      console.error(`No se pudo determinar la colección para el usuario con UID: ${uid}`);
      // Podríamos no lanzar un error si el documento ya no existe, pero sí si no sabemos dónde buscar.
      // Depende de cómo quieras manejarlo. Por ahora, lanzaremos un error si no se sabe la colección.
      throw new Error("No se pudo encontrar la colección del perfil de usuario.");
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    // Verificar si existe antes de borrar podría ser útil, pero deleteDoc no falla si no existe.
    await deleteDoc(userDocRef);
    console.log(`Documento de usuario borrado de Firestore (${collectionName}/${uid}) exitosamente.`);
  } catch (error) {
    console.error(`Error al borrar documento de usuario de Firestore (${collectionName}/${uid}):`, error);
    throw new Error("Error al borrar el perfil de la base de datos."); // Error genérico
  }
};


// --- INICIO: NUEVA FUNCIÓN AÑADIDA ---

/**
 * Actualiza el PIN hasheado de un usuario en su documento de Firestore.
 * @param uid El UID del usuario cuyo PIN se actualizará.
 * @param rol El rol del usuario, necesario para encontrar la colección correcta.
 * @param newHashedPin El nuevo PIN ya procesado con hash que se guardará.
 * @returns Promise<void>
 * @throws Si no se encuentra la colección del usuario o si falla la actualización.
 */
export const updateUserPin = async (uid: string, rol: string, newHashedPin: string): Promise<void> => {
  // Reutilizamos la función existente para encontrar la colección del usuario.
  const collectionName = await findUserCollection(uid, rol);
  
  if (!collectionName) {
      throw new Error(`No se pudo encontrar la colección para el usuario con UID: ${uid} para actualizar el PIN.`);
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    // Usamos updateDoc para modificar el campo específico del PIN.
    await updateDoc(userDocRef, {
      hashedPin: newHashedPin // Asegúrate que este nombre de campo ('hashedPin') coincida con el de tu base de datos.
    });
    console.log(`PIN actualizado exitosamente en Firestore para el usuario ${uid} en la colección ${collectionName}.`);
  } catch (error) {
    console.error(`Error al actualizar el PIN en Firestore (${collectionName}/${uid}):`, error);
    throw new Error("No se pudo actualizar el PIN en la base de datos.");
  }
};
// --- FIN: NUEVA FUNCIÓN AÑADIDA ---
/**
 * Elimina el token de notificación (FCM Token) y su timestamp del perfil de un usuario en Firestore.
 */
export const deleteUserFCMToken = async (uid: string, rol: string): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);

  if (!collectionName) {
    throw new Error(`No se pudo encontrar la colección para el usuario con UID: ${uid} para eliminar el token FCM.`);
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    await updateDoc(userDocRef, {
      fcmToken: deleteField(),
      fcmTokenTimestamp: deleteField()
    });
    console.log(`Token FCM eliminado exitosamente de Firestore para el usuario ${uid}.`);
  } catch (error) {
    console.error(`Error al eliminar el token FCM en Firestore (${collectionName}/${uid}):`, error);
    throw new Error("No se pudo desactivar las notificaciones.");
  }
};