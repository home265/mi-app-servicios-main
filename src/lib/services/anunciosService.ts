// src/lib/services/anunciosService.ts
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
  limit,           // Importado para getExistingDraft y getCapturaByScreenIndex
  writeBatch,      // Importado para deleteAnuncio
  deleteDoc,       // Importado para deleteAnuncio
  DocumentData,    // Importado para el tipado en addDoc
} from "firebase/firestore";
import { db } from "../firebase/config";
import { Anuncio, Captura, Elemento } from "../../types/anuncio";
import { deleteFileByUrl } from "../firebase/storage";   // ← nuevo import

const ANUNCIOS_COLLECTION = "anuncios";
const CAPTURAS_SUBCOLLECTION = "capturas";

export interface AnuncioFilter {
  provincia?: string;
  localidad?: string;
  plan?: string;
  status?: Anuncio["status"];
  creatorId?: string;
}

/* -------------------------------------------------------------------------- */
/*                   CRUD PRINCIPAL ­– DOCUMENTO ANUNCIO                      */
/* -------------------------------------------------------------------------- */

/**
 * Crea un anuncio en estado 'draft' y retorna su ID.
 * Inicializa elementosPorPantalla para la pantalla "0" si no se provee.
 */
export async function createDraftAnuncio(
  anuncioData: Omit<Anuncio, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const now = Timestamp.now();

  const elementosPorPantallaParaGuardar: Record<string, Elemento[]> =
    anuncioData.elementosPorPantalla &&
    Object.keys(anuncioData.elementosPorPantalla).length > 0
      ? anuncioData.elementosPorPantalla
      : { "0": [] };

  const newAnuncioToSave: Omit<
    Anuncio,
    "id" | "createdAt" | "updatedAt"
  > & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    ...anuncioData,
    elementosPorPantalla: elementosPorPantallaParaGuardar,
    createdAt: now,
    updatedAt: now,
  };

  const anunciosColRef = collection(db, ANUNCIOS_COLLECTION);
  const docRef = await addDoc(
    anunciosColRef,
    newAnuncioToSave as DocumentData
  );

  // se añade el campo id al documento
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
 * Si el anuncio ya está 'active', preserva ese estado para evitar volver a obligar al pago.
 */
export async function updateAnuncio(
  anuncioId: string,
  data: Partial<Omit<Anuncio, "id" | "creatorId" | "createdAt">>
): Promise<void> {
  if (!anuncioId) {
    throw new Error("updateAnuncio: anuncioId no proporcionado.");
  }

  const docRef = doc(db, ANUNCIOS_COLLECTION, anuncioId);

  /* ------------------------------------------------------------------ */
  /*  1) Consultamos el documento actual para conocer su status.        */
  /* ------------------------------------------------------------------ */
  const currentSnap = await getDoc(docRef);
  const currentStatus =
    currentSnap.exists() ? (currentSnap.data() as Pick<Anuncio, "status">).status : undefined;

  /* ------------------------------------------------------------------ */
  /*  2) Construimos el payload a actualizar; si ya está activo         */
  /*     forzamos a que permanezca 'active'.                            */
  /* ------------------------------------------------------------------ */
  const dataToUpdate = {
    ...data,
    ...(currentStatus === "active" ? { status: "active" as const } : {}),
    updatedAt: Timestamp.now(),
  };

  await updateDoc(docRef, dataToUpdate);
}

/* -------------------------------------------------------------------------- */
/*                         LISTADO / FILTRO DE ANUNCIOS                       */
/* -------------------------------------------------------------------------- */
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

  // eslint-disable-next-line prefer-const
  q =
    queryConstraints.length > 0
      ? query(anunciosColRef, ...queryConstraints)
      : query(anunciosColRef);

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ ...docSnap.data(), id: docSnap.id } as Anuncio));
}

/* -------------------------------------------------------------------------- */
/*                        CRUD ­– SUBCOLECCIÓN CAPTURAS                       */
/* -------------------------------------------------------------------------- */
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
  const capturasColRef = collection(
    db,
    ANUNCIOS_COLLECTION,
    anuncioId,
    CAPTURAS_SUBCOLLECTION
  );

  const docRef = await addDoc(capturasColRef, {
    ...capturaData,
    createdAt: Timestamp.now(),
  });
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
 * Obtiene la primera captura que coincida con screenIndex.
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
    console.error(`getCapturaByScreenIndex: screenIndex inválido: ${screenIndex}`);
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
 * Actualiza los datos de una captura y, si la URL de imagen cambia, borra la anterior en Storage.
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

    /* --------------------------------------------------------------- */
    /* 1. Leemos la captura actual para obtener la URL previa          */
    /* --------------------------------------------------------------- */
    const prevSnap = await getDoc(capturaRef);
    const prevUrl = prevSnap.exists()
      ? (prevSnap.data() as Captura).imageUrl
      : undefined;

    /* --------------------------------------------------------------- */
    /* 2. Actualizamos la captura                                      */
    /* --------------------------------------------------------------- */
    await updateDoc(capturaRef, data);
    console.log(
      `Captura ${capturaId} actualizada exitosamente para anuncio ${anuncioId}.`
    );

    /* --------------------------------------------------------------- */
    /* 3. Si cambió la URL, eliminamos el archivo anterior en Storage  */
    /* --------------------------------------------------------------- */
    const newUrl = "imageUrl" in data ? data.imageUrl : undefined;
    if (newUrl && prevUrl && newUrl !== prevUrl) {
      deleteFileByUrl(prevUrl).catch((err) =>
        console.error(`Error al borrar la imagen previa (${prevUrl}):`, err)
      );
    }
  } catch (error) {
    console.error(
      `Error actualizando captura ${capturaId} para anuncio ${anuncioId}:`,
      error
    );
    throw new Error(`Error al actualizar la captura ${capturaId}.`);
  }
};

/* -------------------------------------------------------------------------- */
/*                         UTILIDADES EXTRA / BORRADOR                        */
/* -------------------------------------------------------------------------- */

/**
 * Devuelve el primer borrador de anuncio existente para un usuario, o null.
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
 * Elimina un anuncio y todas sus capturas en Firestore.
 * (El borrado de las imágenes en Storage lo puedes manejar con Cloud Functions).
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
      capturasSnapshot.docs.forEach((docSnapshot) => batch.delete(docSnapshot.ref));
      await batch.commit();
      console.log(`Subcolección de capturas para anuncio ${anuncioId} eliminada.`);
    }

    await deleteDoc(anuncioRef);
    console.log(`Anuncio ${anuncioId} eliminado exitosamente de Firestore.`);
  } catch (error) {
    console.error(`Error eliminando el anuncio ${anuncioId} de Firestore:`, error);
    throw new Error(`No se pudo eliminar el anuncio ${anuncioId} de Firestore.`);
  }
}
