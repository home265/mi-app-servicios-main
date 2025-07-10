// src/lib/services/cvService.ts
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Timestamp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config'; // Asegúrate que la ruta a tu config sea correcta

/**
 * Interfaz que representa la estructura de un documento de CV
 * en la colección principal /cvs.
 */
export interface CvDocument {
  uid: string;
  nombreCompleto: string;
  selfieURL: string | null;
  descripcion: string;
  telefonoAlt: string;
  rubros: string[];
  estudios: {
    primario: string;
    secundario: string;
    universitario: string;
    posgrado: string;
  };
  localidad: {
    nombre: string;
    provinciaNombre: string;
  };
  timestamp: number;
}

/**
 * Interfaz para los filtros de búsqueda de CVs.
 */
export interface CvSearchFilters {
  provincia: string;
  localidad: string;
  rubro?: string; // El rubro es opcional
}


/**
 * Crea o actualiza el CV de un usuario en la colección /cvs.
 * Usa el UID del usuario como ID del documento para asegurar que solo haya uno.
 * @param uid El UID del usuario.
 * @param cvData El objeto completo con los datos del CV a guardar.
 * @returns Promise<void>
 * @throws Si falla la escritura en la base de datos.
 */
export const createOrUpdateCv = async (uid: string, cvData: Omit<CvDocument, 'uid'>): Promise<void> => {
  if (!uid) {
    throw new Error("Se requiere un UID de usuario para crear o actualizar un CV.");
  }
  
  const cvDocRef = doc(db, 'cvs', uid);
  const dataToSave: CvDocument = { uid, ...cvData };

  try {
    await setDoc(cvDocRef, dataToSave);
    console.log(`CV guardado exitosamente en Firestore para el usuario: ${uid}`);
  } catch (error) {
    console.error(`Error al guardar el CV para el usuario ${uid}:`, error);
    throw new Error("No se pudo guardar el CV en la base de datos.");
  }
};

/**
 * Obtiene el documento de CV de un usuario por su UID.
 * @param uid El UID del usuario (que es el ID del documento del CV).
 * @returns Promise<CvDocument | null> El documento del CV si existe, o null si no.
 * @throws Si falla la lectura de la base de datos.
 */
export const getCvByUid = async (uid: string): Promise<CvDocument | null> => {
  if (!uid) {
    console.warn("getCvByUid: No se proporcionó UID.");
    return null;
  }
  
  const cvDocRef = doc(db, 'cvs', uid);

  try {
    const docSnap = await getDoc(cvDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as CvDocument;
    } else {
      console.log(`No se encontró un CV para el usuario: ${uid}`);
      return null;
    }
  } catch (error) {
    console.error(`Error al obtener el CV para el usuario ${uid}:`, error);
    throw new Error("Error al obtener el CV de la base de datos.");
  }
};

/**
 * Busca CVs en la colección /cvs aplicando filtros de búsqueda.
 * @param filters Objeto con los filtros a aplicar (provincia, localidad, rubro).
 * @returns Promise<CvDocument[]> Un array con los CVs que coinciden con la búsqueda.
 * @throws Si la consulta a la base de datos falla.
 */
export const searchCvs = async (filters: CvSearchFilters): Promise<CvDocument[]> => {
  if (!filters.provincia || !filters.localidad) {
    throw new Error("La provincia y la localidad son requeridas para la búsqueda.");
  }

  const cvsCollectionRef = collection(db, 'cvs');
  
  // Construcción de la consulta base
  let q = query(
    cvsCollectionRef,
    where('localidad.provinciaNombre', '==', filters.provincia),
    where('localidad.nombre', '==', filters.localidad)
  );

  // Añadir filtro de rubro si se proporcionó
  if (filters.rubro && filters.rubro.trim() !== '') {
    q = query(q, where('rubros', 'array-contains', filters.rubro));
  }

  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("La búsqueda de CVs no arrojó resultados.");
      return [];
    }
    
    // Mapear los documentos a nuestro tipo CvDocument
    const results = querySnapshot.docs.map(doc => doc.data() as CvDocument);
    return results;

  } catch (error) {
    console.error("Error al ejecutar la búsqueda de CVs:", error);
    // Este error podría ser por falta de índice. La consola del navegador dará más detalles.
    throw new Error("Ocurrió un error al buscar los perfiles.");
  }
};

/**
 * Borra el CV de un usuario de la colección /cvs.
 * Ideal para usar cuando un usuario elimina su cuenta.
 * @param uid El UID del usuario cuyo CV se borrará.
 * @returns Promise<void>
 */
export const deleteCvForUser = async (uid: string): Promise<void> => {
  if (!uid) {
    console.warn("deleteCvForUser: No se proporcionó UID.");
    return;
  }
  
  const cvDocRef = doc(db, 'cvs', uid);

  try {
    await deleteDoc(cvDocRef);
    console.log(`CV borrado exitosamente de Firestore para el usuario: ${uid}`);
  } catch (error) {
    console.error(`Error al borrar el CV del usuario ${uid}:`, error);
    // No relanzamos el error para no interrumpir un proceso de borrado de cuenta más grande.
  }
};