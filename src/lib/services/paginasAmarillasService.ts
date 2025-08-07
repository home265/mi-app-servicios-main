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

// --- INICIO: TIPO DTO CORREGIDO ---

export type CreatePaginaAmarillaDTO = Omit<
  PaginaAmarillaData,
  | 'creatorId'
  | 'fechaCreacion'
  | 'fechaExpiracion'
  | 'ultimaModificacion'
  | 'contadorEdicionesAnual'
  | 'inicioCicloEdiciones'
  | 'activa' // Se omite del tipo base
  | 'subscriptionStartDate'
  | 'subscriptionEndDate'
  | 'isActive'
  | 'updatedAt'
  | 'paymentConfirmedAt'
> & {
  // Se permite pasar planId y campaignId durante la creación.
  planId?: PlanId;
  campaignId?: CampaignId;
  activa?: boolean; // <-- LÍNEA CORREGIDA: Se vuelve a añadir como opcional.
};

// --- FIN: TIPO DTO CORREGIDO ---

export type UpdatePaginaAmarillaDTO = Partial<
  Omit<
    PaginaAmarillaData,
    | 'creatorId'
    | 'creatorRole'
    | 'fechaCreacion'
    | 'fechaExpiracion'
    | 'contadorEdicionesAnual'
    | 'inicioCicloEdiciones'
    | 'activa'
    | 'ultimaModificacion'
    | 'subscriptionStartDate'
    | 'subscriptionEndDate'
    | 'isActive'
    | 'updatedAt'
    | 'paymentConfirmedAt'
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
    // Datos básicos
    creatorId,
    creatorRole: data.creatorRole,
    nombrePublico: data.nombrePublico,
    provincia: data.provincia,
    localidad: data.localidad,

    // Timestamps y contadores
    fechaCreacion: now,
    fechaExpiracion,
    ultimaModificacion: now,
    contadorEdicionesAnual: 0,
    inicioCicloEdiciones: now,

    // Datos de contenido del formulario
    activa: data.activa ?? true, // Esta línea ahora funcionará sin error.
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

    // Suscripción inicial: inactiva y con los planes seleccionados
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


/** Opciones para la función de listar páginas amarillas. */
export interface ListPaginasAmarillasOptions {
  /** Si es `true`, devuelve solo publicaciones con suscripción activa. */
  soloSuscritos?: boolean;
}

/**
 * LISTA publicaciones con filtros. Puede devolver todas las publicaciones de la guía
 * o solo las que tienen una suscripción activa, según las opciones.
 */
export const listPaginasAmarillasByFilter = async (
  filtros: PaginaAmarillaFiltros,
  options: ListPaginasAmarillasOptions = {}
): Promise<PaginaAmarillaData[]> => {
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

  // Filtro base: la publicación debe estar visible en la guía
  qc.push(where('activa', '==', filtros.activa ?? true));

  // Filtro condicional para suscripciones activas
  if (options.soloSuscritos) {
    qc.push(where('isActive', '==', true));
    qc.push(where('subscriptionEndDate', '>', Timestamp.now()));
    // Ordenar por fecha de expiración solo tiene sentido si filtramos por suscriptores
    qc.push(orderBy('subscriptionEndDate', 'asc'));
  }

  const q: Query<DocumentData> = query(
    collection(db, PAGINAS_AMARILLAS_COLLECTION),
    ...qc
  );
  
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PaginaAmarillaData);
};