// src/lib/services/paginasAmarillasService.ts
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  QueryConstraint,
  DocumentData,
  Query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  CampaignId,
  PaginaAmarillaData,
  PaginaAmarillaFiltros,
  PlanId,
  SerializablePaginaAmarillaData,
} from '@/types/paginaAmarilla';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { HorariosDeAtencion } from '@/types/horarios';

const PAGINAS_AMARILLAS_COLLECTION = 'paginas_amarillas';

/** Elimina propiedades `undefined` para Firestore */
const cleanUndefined = <T extends object>(obj: T): T => {
  const filtered = Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined)
  );
  return filtered as T;
};

export type CreatePaginaAmarillaDTO = Omit<
  PaginaAmarillaData,
  | 'creatorId' | 'fechaCreacion' | 'fechaExpiracion' | 'ultimaModificacion' | 'contadorEdicionesAnual'
  | 'inicioCicloEdiciones' | 'activa' | 'subscriptionStartDate' | 'subscriptionEndDate' | 'isActive'
  | 'updatedAt' | 'paymentConfirmedAt'
> & {
  planId?: PlanId;
  campaignId?: CampaignId;
  activa?: boolean;
};

export type UpdatePaginaAmarillaDTO = Partial<
  Omit<
    PaginaAmarillaData,
    | 'creatorId' | 'creatorRole' | 'fechaCreacion' | 'fechaExpiracion' | 'contadorEdicionesAnual'
    | 'inicioCicloEdiciones' | 'activa' | 'ultimaModificacion' | 'subscriptionStartDate'
    | 'subscriptionEndDate' | 'isActive' | 'updatedAt' | 'paymentConfirmedAt'
  >
>;

/** CREATE: crea la página amarilla con plan y campaña, pero sin suscripción activa */
export const createPaginaAmarilla = async (
  creatorId: string,
  data: CreatePaginaAmarillaDTO
): Promise<void> => {
  const docRef = doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId);
  if ((await getDoc(docRef)).exists()) {
    throw new Error('Ya existe una publicación para este usuario.');
  }

  const now = Timestamp.now();
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const fechaExpiracion = new Timestamp(now.seconds + ONE_YEAR_MS / 1000, now.nanoseconds);

  const newPage: PaginaAmarillaData = {
    creatorId,
    creatorRole: data.creatorRole,
    nombrePublico: data.nombrePublico,
    provincia: data.provincia,
    localidad: data.localidad,
    fechaCreacion: now,
    fechaExpiracion,
    ultimaModificacion: now,
    contadorEdicionesAnual: 0,
    inicioCicloEdiciones: now,
    activa: data.activa ?? true,
    tituloCard: data.tituloCard ?? null,
    subtituloCard: data.subtituloCard ?? null,
    descripcion: data.descripcion ?? null,
    imagenPortadaUrl: data.imagenPortadaUrl ?? null,
    telefonoContacto: data.telefonoContacto ?? null,
    emailContacto: data.emailContacto ?? null,
    enlaceWeb: data.enlaceWeb ?? null,
    enlaceInstagram: data.enlaceInstagram ?? null,
    enlaceFacebook: data.enlaceFacebook ?? null,
    direccionVisible: data.direccionVisible ?? null,
    rubro: data.rubro ?? null,
    subRubro: data.subRubro ?? null,
    categoria: data.categoria ?? null,
    subCategoria: data.subCategoria ?? null,
    horarios: data.horarios ?? null,
    realizaEnvios: data.realizaEnvios ?? null,
    isActive: false,
    planId: data.planId,
    campaignId: data.campaignId,
  };

  await setDoc(docRef, cleanUndefined(newPage));
};

/** GET por creatorId */
export const getPaginaAmarilla = async (
  creatorId: string
): Promise<PaginaAmarillaData | null> => {
  const snap = await getDoc(doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId));
  if (!snap.exists()) return null;
  return snap.data() as PaginaAmarillaData;
};

/** UPDATE: actualiza datos de la página amarilla */
export const updatePaginaAmarilla = async (
  creatorId: string,
  dataToUpdate: UpdatePaginaAmarillaDTO
): Promise<void> => {
  const docRef = doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('La publicación no existe.');
  }

  const now = Timestamp.now();
  const updates: DocumentData = {
    ...dataToUpdate,
    ultimaModificacion: now,
  };

  if ('horarios' in dataToUpdate) {
    updates.horarios = dataToUpdate.horarios ?? null;
  }
  if ('imagenPortadaUrl' in dataToUpdate && dataToUpdate.imagenPortadaUrl === undefined) {
    updates.imagenPortadaUrl = null;
  }

  await updateDoc(docRef, cleanUndefined(updates));
};

/** DELETE */
export const deletePaginaAmarilla = async (creatorId: string): Promise<void> => {
  await deleteDoc(doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId));
};

// --- INICIO: SECCIÓN ACTUALIZADA ---

/** Opciones para la función de listar páginas amarillas. */
export interface ListPaginasAmarillasOptions {
  soloSuscritos?: boolean;
  orderBy?: 'subscriptionEndDate' | 'fechaCreacion'; // <-- Opción de ordenamiento
}

/**
 * LISTA publicaciones con filtros.
 */
export const listPaginasAmarillasByFilter = async (
  filtros: PaginaAmarillaFiltros,
  options: ListPaginasAmarillasOptions = {}
): Promise<SerializablePaginaAmarillaData[]> => {
  const qc: QueryConstraint[] = [];

  // Filtros de búsqueda estándar
  if (filtros.provincia) qc.push(where('provincia', '==', filtros.provincia));
  if (filtros.localidad) qc.push(where('localidad', '==', filtros.localidad));
  if (filtros.rol) qc.push(where('creatorRole', '==', filtros.rol));
  if (filtros.rubro) qc.push(where('rubro', '==', filtros.rubro));
  if (filtros.subRubro) qc.push(where('subRubro', '==', filtros.subRubro));
  if (filtros.categoria) qc.push(where('categoria', '==', filtros.categoria));
  if (filtros.subCategoria) qc.push(where('subCategoria', '==', filtros.subCategoria));
  if (typeof filtros.realizaEnvios === 'boolean') {
    qc.push(where('realizaEnvios', '==', filtros.realizaEnvios));
  }
  if (filtros.planId) qc.push(where('planId', '==', filtros.planId));
  
  // Lógica añadida para filtrar por VARIOS planes a la vez
  if (filtros.planIds && filtros.planIds.length > 0) {
    qc.push(where('planId', 'in', filtros.planIds));
  }

  // Filtro base: la publicación debe estar visible en la guía
  qc.push(where('activa', '==', filtros.activa ?? true));

  // Filtro condicional para suscripciones activas
  if (options.soloSuscritos) {
    qc.push(where('isActive', '==', true));
    qc.push(where('subscriptionEndDate', '>', Timestamp.now()));
  }

  // Lógica de ordenamiento dinámico
  if (options.orderBy === 'fechaCreacion') {
    qc.push(orderBy('fechaCreacion', 'asc'));
  } else if (options.orderBy === 'subscriptionEndDate' && options.soloSuscritos) {
    // Ordenar por fecha de expiración solo tiene sentido si filtramos por suscriptores
    qc.push(orderBy('subscriptionEndDate', 'asc'));
  }

  const q: Query<DocumentData> = query(
    collection(db, PAGINAS_AMARILLAS_COLLECTION),
    ...qc
  );
  
  const snap = await getDocs(q);
  // El tipo de dato que viene de la API ya está serializado.
  // Realizamos una conversión manual aquí para asegurar la compatibilidad de tipos.
  return snap.docs.map((d) => {
    const data = d.data();
    // Creamos un objeto serializable a partir de los datos de Firestore
    const serializableData: SerializablePaginaAmarillaData = {
      ...(data as PaginaAmarillaData), // Hacemos un cast inicial para el autocompletado
      fechaCreacion: (data.fechaCreacion as Timestamp).toDate().toISOString(),
      fechaExpiracion: (data.fechaExpiracion as Timestamp).toDate().toISOString(),
      ultimaModificacion: (data.ultimaModificacion as Timestamp)?.toDate().toISOString() || null,
      inicioCicloEdiciones: (data.inicioCicloEdiciones as Timestamp).toDate().toISOString(),
      subscriptionStartDate: (data.subscriptionStartDate as Timestamp)?.toDate().toISOString() || null,
      subscriptionEndDate: (data.subscriptionEndDate as Timestamp)?.toDate().toISOString() || null,
      updatedAt: (data.updatedAt as Timestamp)?.toDate().toISOString() || null,
      paymentConfirmedAt: (data.paymentConfirmedAt as Timestamp)?.toDate().toISOString() || null,
    };
    return serializableData;
  });
};
// --- FIN: SECCIÓN ACTUALIZADA ---