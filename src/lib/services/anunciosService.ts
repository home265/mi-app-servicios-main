import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  Query,
  limit, // Importado para getExistingDraft y getCapturaByScreenIndex
  writeBatch, // Importado para deleteAnuncio
  deleteDoc, // Importado para deleteAnuncio
  DocumentData, // Importado para el tipado en addDoc si es necesario
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Anuncio, Captura, Elemento } from "../../types/anuncio";

const ANUNCIOS_COLLECTION = "anuncios";
const CAPTURAS_SUBCOLLECTION = "capturas";

export interface AnuncioFilter {
  provincia?: string;
  localidad?: string;
  plan?: string;
  status?: Anuncio["status"];
  creatorId?: string;
}

/**
 * Crea un anuncio en estado 'draft' y retorna su ID.
 * Inicializa elementosPorPantalla para la pantalla "0" si no se provee.
 */
export async function createDraftAnuncio(
  anuncioData: Omit<Anuncio, "id" | "createdAt" | "updatedAt"> // Este tipo ya excluye 'id'
): Promise<string> {
  const now = Timestamp.now();

  const elementosPorPantallaParaGuardar: Record<string, Elemento[]> =
    anuncioData.elementosPorPantalla &&
    Object.keys(anuncioData.elementosPorPantalla).length > 0
      ? anuncioData.elementosPorPantalla
      : { "0": [] };

  // Usamos directamente anuncioData y añadimos los campos de timestamp.
  // El tipo resultante incluye los campos de anuncioData más createdAt y updatedAt.
  const newAnuncioToSave: Omit<Anuncio, "id" | "createdAt" | "updatedAt"> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    ...anuncioData,
    elementosPorPantalla: elementosPorPantallaParaGuardar,
    createdAt: now,
    updatedAt: now,
  };

  const anunciosColRef = collection(db, ANUNCIOS_COLLECTION);
  // El tipo de newAnuncioToSave es compatible con lo que Firestore espera para un nuevo documento.
  // Si TypeScript se quejara por alguna especificidad de addDoc, un 'as DocumentData' podría ser un último recurso,
  // pero idealmente la inferencia de tipos o un tipo más explícito para la colección lo maneja.
  const docRef = await addDoc(anunciosColRef, newAnuncioToSave as DocumentData); // Se añade 'as DocumentData' por si acaso, es una práctica común con addDoc genérico

  // Añadimos el ID al documento después de crearlo
  await updateDoc(doc(db, ANUNCIOS_COLLECTION, docRef.id), { id: docRef.id });
  return docRef.id;
}

/**
 * Obtiene un anuncio por su ID.
 */
export async function getAnuncioById(
  anuncioId: string
): Promise<Anuncio | null> {
  if (!anuncioId) {
    console.error("getAnuncioById: anuncioId no proporcionado.");
    return null;
  }
  const docRef = doc(db, ANUNCIOS_COLLECTION, anuncioId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    console.warn(`Anuncio con ID ${anuncioId} no encontrado.`);
    return null;
  }
  return { ...snap.data(), id: snap.id } as Anuncio;
}

/**
 * Actualiza campos de un anuncio.
 */
export async function updateAnuncio(
  anuncioId: string,
  data: Partial<Omit<Anuncio, "id" | "creatorId" | "createdAt">>
): Promise<void> {
  if (!anuncioId) {
    throw new Error("updateAnuncio: anuncioId no proporcionado.");
  }
  const docRef = doc(db, ANUNCIOS_COLLECTION, anuncioId);
  const dataToUpdate = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(docRef, dataToUpdate);
}

/**
 * Lista anuncios según filtros opcionales.
 */
export async function listAnunciosByFilter(
  filter: AnuncioFilter = {}
): Promise<Anuncio[]> {
  const anunciosColRef = collection(db, ANUNCIOS_COLLECTION);
  let q: Query;

  const queryConstraints = [];
  if (filter.provincia) {
    queryConstraints.push(where("provincia", "==", filter.provincia));
  }
  if (filter.localidad) {
    queryConstraints.push(where("localidad", "==", filter.localidad));
  }
  if (filter.plan) {
    queryConstraints.push(where("plan", "==", filter.plan));
  }
  if (filter.status) {
    queryConstraints.push(where("status", "==", filter.status));
  }
  if (filter.creatorId) {
    queryConstraints.push(where("creatorId", "==", filter.creatorId));
  }

  if (queryConstraints.length > 0) {
    q = query(anunciosColRef, ...queryConstraints);
  } else {
    q = query(anunciosColRef);
  }

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => {
    return { ...docSnap.data(), id: docSnap.id } as Anuncio;
  });
}

// --- Funciones de Captura ---

/**
 * Agrega una nueva captura a la subcolección de un anuncio.
 */
export async function addCaptura(
  anuncioId: string,
  capturaData: Omit<Captura, "createdAt">
): Promise<string> {
  if (!anuncioId) {
    throw new Error("addCaptura: anuncioId no proporcionado.");
  }
  const now = Timestamp.now();
  const capturasColRef = collection(
    db,
    ANUNCIOS_COLLECTION,
    anuncioId,
    CAPTURAS_SUBCOLLECTION
  );

  const newCapturaToSave: Captura = {
    ...capturaData,
    createdAt: now,
  };

  const docRef = await addDoc(capturasColRef, newCapturaToSave);
  return docRef.id;
}

/**
 * Lista todas las capturas de un anuncio, ordenadas por screenIndex.
 */
export async function listCapturas(anuncioId: string): Promise<Captura[]> {
  if (!anuncioId) {
    console.warn("listCapturas: anuncioId no proporcionado.");
    return [];
  }
  const capturasColRef = collection(
    db,
    ANUNCIOS_COLLECTION,
    anuncioId,
    CAPTURAS_SUBCOLLECTION
  );
  const q = query(capturasColRef, orderBy("screenIndex", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => docSnap.data() as Captura);
}

/**
 * Encuentra el ID y los datos de la primera captura para un anuncio y screenIndex específicos.
 */
export const getCapturaByScreenIndex = async (
  anuncioId: string,
  screenIndex: number
): Promise<{ id: string; data: Captura } | null> => {
  if (!anuncioId) {
    console.error("getCapturaByScreenIndex: anuncioId no proporcionado.");
    return null;
  }
  if (typeof screenIndex !== "number" || screenIndex < 0) {
    console.error(
      `getCapturaByScreenIndex: screenIndex inválido: ${screenIndex}`
    );
    return null;
  }

  try {
    const capturasRef = collection(
      db,
      ANUNCIOS_COLLECTION,
      anuncioId,
      CAPTURAS_SUBCOLLECTION
    );
    const q = query(
      capturasRef,
      where("screenIndex", "==", screenIndex),
      limit(1)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, data: docSnap.data() as Captura };
    }
    return null;
  } catch (error) {
    console.error(
      `Error buscando captura para anuncio ${anuncioId}, pantalla ${screenIndex}:`,
      error
    );
    throw new Error(
      `Error al buscar la captura existente para la pantalla ${screenIndex}.`
    );
  }
};

/**
 * Actualiza los datos de un documento de captura existente.
 */
export const updateCaptura = async (
  anuncioId: string,
  capturaId: string,
  data: Partial<Omit<Captura, "createdAt" | "screenIndex">>
): Promise<void> => {
  if (!anuncioId || !capturaId) {
    throw new Error("updateCaptura: anuncioId o capturaId no proporcionado.");
  }
  if (!data || Object.keys(data).length === 0) {
    console.warn("updateCaptura: No se proporcionaron datos para actualizar.");
    return;
  }

  try {
    const capturaRef = doc(
      db,
      ANUNCIOS_COLLECTION,
      anuncioId,
      CAPTURAS_SUBCOLLECTION,
      capturaId
    );
    await updateDoc(capturaRef, data);
    console.log(
      `Captura ${capturaId} actualizada exitosamente para anuncio ${anuncioId}.`
    );
  } catch (error) {
    console.error(
      `Error actualizando captura ${capturaId} para anuncio ${anuncioId}:`,
      error
    );
    throw new Error(`Error al actualizar la captura ${capturaId}.`);
  }
};

// --- NUEVAS FUNCIONES ---

/**
 * Obtiene el borrador de anuncio existente para un usuario.
 * Devuelve el objeto Anuncio completo o null si no existe.
 */
export async function getExistingDraft(
  creatorId: string
): Promise<Anuncio | null> {
  if (!creatorId) {
    console.error("getExistingDraft: creatorId no proporcionado.");
    return null;
  }

  const anunciosColRef = collection(db, ANUNCIOS_COLLECTION);
  const q = query(
    anunciosColRef,
    where("creatorId", "==", creatorId),
    where("status", "==", "draft"),
    orderBy("updatedAt", "desc"),
    limit(1)
  );

  try {
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      return { ...docSnap.data(), id: docSnap.id } as Anuncio;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo borrador existente:", error);
    return null;
  }
}

/**
 * Elimina un anuncio y todas sus capturas asociadas de Firestore.
 * NOTA: La eliminación de imágenes de Firebase Storage no se incluye aquí
 * y debería manejarse por separado (idealmente con una Cloud Function).
 */
export async function deleteAnuncio(anuncioId: string): Promise<void> {
  if (!anuncioId) {
    throw new Error("deleteAnuncio: anuncioId no proporcionado.");
  }

  const anuncioRef = doc(db, ANUNCIOS_COLLECTION, anuncioId);

  try {
    const capturasColRef = collection(anuncioRef, CAPTURAS_SUBCOLLECTION);
    const capturasSnapshot = await getDocs(capturasColRef);

    if (!capturasSnapshot.empty) {
      const batch = writeBatch(db);
      capturasSnapshot.docs.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      await batch.commit();
      console.log(
        `Subcolección de capturas para anuncio ${anuncioId} eliminada.`
      );
    }

    await deleteDoc(anuncioRef);
    console.log(
      `Anuncio ${anuncioId} eliminado exitosamente de Firestore.`
    );
  } catch (error) {
    console.error(`Error eliminando el anuncio ${anuncioId} de Firestore:`, error);
    throw new Error(
      `No se pudo eliminar el anuncio ${anuncioId} de Firestore.`
    );
  }
}