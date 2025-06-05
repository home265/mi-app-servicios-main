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
  PaginaAmarillaData, // Ya tiene horarios como HorariosDeAtencion
  PaginaAmarillaFiltros,
} from '@/types/paginaAmarilla';
// Importamos el nuevo tipo para los horarios que se guardarán/leerán
import { HorariosDeAtencion } from '@/types/horarios'; // Eliminamos la importación del antiguo HorarioDia
import { listAnunciosByFilter } from './anunciosService';

const PAGINAS_AMARILLAS_COLLECTION = 'paginas_amarillas';
const MILISEGUNDOS_EN_UN_ANO = 365 * 24 * 60 * 60 * 1000;

/* util: elimina undefined para evitar errores de Firestore */
const cleanUndefined = <T extends object>(obj: T): T => {
  const filtered = Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).filter(([, v]) => v !== undefined),
  );
  return filtered as T;
};

/* ───────── tipos DTO (Data Transfer Object) ───────── */
export type CreatePaginaAmarillaDTO = Omit<
  PaginaAmarillaData,
  | 'creatorId'
  | 'fechaCreacion'
  | 'fechaExpiracion'
  | 'ultimaModificacion'
  | 'contadorEdicionesAnual'
  | 'inicioCicloEdiciones'
  | 'activa'              // ← seguimos omitiendo la versión “completa”
> & {
  /** Opcional: horarios serializados o nulos. */
  horarios?: HorariosDeAtencion | null;

  /** URL de la portada (null si el usuario no subió imagen). */
  imagenPortadaUrl?: string | null;

  /** Bandera que indica si la tarjeta está visible en búsquedas.
   *  Se crea como `true`; la Cloud Function la pondrá `false`
   *  cuando corresponda (caducidad, pérdida de anuncio activo, etc.). */
  activa?: boolean;       // ← nuevo campo opcional
};


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
  >
> & {
  // 'horarios' ya está definido en PaginaAmarillaData como HorariosDeAtencion | null | undefined
  horarios?: HorariosDeAtencion | null;
  imagenPortadaUrl?: string | null;
};

/* ───────── helpers ───────── */
export const tieneAnuncioActivo = async (userId: string): Promise<boolean> => {
  try {
    const anuncios = await listAnunciosByFilter({
      creatorId: userId,
      status: 'active',
    });
    return anuncios.length > 0;
  } catch (e) {
    console.error('Error verificando anuncios activos:', e);
    return false;
  }
};

/* ───────── create ───────── */
export const createPaginaAmarilla = async (
  creatorId: string,
  data: CreatePaginaAmarillaDTO, // data.horarios ya debería ser HorariosDeAtencion | null | undefined
): Promise<void> => {
  if (!(await tieneAnuncioActivo(creatorId))) {
    throw new Error('Para crear una publicación en Páginas Amarillas, primero necesitas tener al menos un anuncio activo.');
  }

  const docRef = doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId);
  if ((await getDoc(docRef)).exists()) {
    throw new Error('Ya existe una publicación en Páginas Amarillas para este usuario.');
  }

  const now = Timestamp.now();
  const fechaExpiracion = new Timestamp(
    now.seconds + MILISEGUNDOS_EN_UN_ANO / 1000,
    now.nanoseconds,
  );

  const nuevaPublicacion: PaginaAmarillaData = {
    creatorId,
    fechaCreacion: now,
    fechaExpiracion,
    ultimaModificacion: now,
    contadorEdicionesAnual: 0,
    inicioCicloEdiciones: now,
    activa: true, // Se activa al crear si tiene anuncio activo

    creatorRole: data.creatorRole,
    nombrePublico: data.nombrePublico,
    provincia: data.provincia,
    localidad: data.localidad,

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
    // El campo horarios aquí ya viene con la nueva estructura HorariosDeAtencion desde el formulario
    // o es null/undefined. Se guarda tal cual o como null.
    horarios: data.horarios ?? null,
    realizaEnvios: data.realizaEnvios ?? null,
  };

  await setDoc(docRef, cleanUndefined(nuevaPublicacion));
};

/* ───────── get ───────── */
export const getPaginaAmarilla = async (
  creatorId: string,
): Promise<PaginaAmarillaData | null> => {
  const snap = await getDoc(doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId));
  if (!snap.exists()) {
    return null;
  }
  // PaginaAmarillaData ya espera 'horarios' como HorariosDeAtencion | null | undefined.
  // La función de adaptación está en el formulario de edición si los datos son antiguos.
  // Aquí simplemente casteamos al tipo esperado.
  return snap.data() as PaginaAmarillaData;
};

/* ───────── update ───────── */
// La función de update es llamada por tu API Route en:
// src/app/api/paginas-amarillas/[creatorId]/route.ts
// Esa API Route recibe el payload del PaginaAmarillaEditarForm.
// El payload ya debería tener dataToUpdate.horarios como HorariosDeAtencion | null.
export const updatePaginaAmarilla = async (
  creatorId: string,
  dataToUpdate: UpdatePaginaAmarillaDTO,
): Promise<void> => {
  const docRef = doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('La publicación que intentas actualizar no existe.');
  }

  // No es necesario re-chequear tieneAnuncioActivo aquí para update,
  // a menos que sea una regla de negocio (ej. si deja de tener anuncios activos, se desactiva la PA).
  // Esa lógica está en la Cloud Function 'managePaginasAmarillas'.

  const now = Timestamp.now();
  const datosConcretos: DocumentData = { // Usamos DocumentData para ser explícitos con Firestore
    ...dataToUpdate,
    ultimaModificacion: now,
  };

  // Si 'horarios' está explícitamente en dataToUpdate, lo usamos.
  // Si no está, no se toca el campo 'horarios' en Firestore.
  // Si se quiere borrar los horarios, dataToUpdate.horarios debería ser null.
  if ('horarios' in dataToUpdate) {
    datosConcretos.horarios = dataToUpdate.horarios ?? null;
  }
  if ('imagenPortadaUrl' in dataToUpdate && dataToUpdate.imagenPortadaUrl === undefined) {
    // Si se pasó undefined explícitamente para imagenPortadaUrl (ej. desde el formulario para borrarla sin subir nueva),
    // se guarda como null. El payload del form ya debería enviar null.
    datosConcretos.imagenPortadaUrl = null;
  }


  // Limpiamos los undefined ANTES de enviar a Firestore
  await updateDoc(docRef, cleanUndefined(datosConcretos));
};

/* ───────── delete ───────── */
export const deletePaginaAmarilla = async (
  creatorId: string,
): Promise<void> => {
  await deleteDoc(doc(db, PAGINAS_AMARILLAS_COLLECTION, creatorId));
};

/* ───────── list ───────── */
export const listPaginasAmarillasByFilter = async (
  filtros: PaginaAmarillaFiltros,
): Promise<PaginaAmarillaData[]> => {
  const qc: QueryConstraint[] = [];

  if (filtros.provincia)   qc.push(where('provincia',   '==', filtros.provincia));
  if (filtros.localidad)   qc.push(where('localidad',   '==', filtros.localidad));
  if (filtros.rol)         qc.push(where('creatorRole', '==', filtros.rol));

  // Búsqueda por rubro/categoría
  if (filtros.rubro)        qc.push(where('rubro',        '==', filtros.rubro));
  if (filtros.subRubro)     qc.push(where('subRubro',     '==', filtros.subRubro));
  if (filtros.categoria)    qc.push(where('categoria',    '==', filtros.categoria));
  if (filtros.subCategoria) qc.push(where('subCategoria', '==', filtros.subCategoria));

  if (typeof filtros.realizaEnvios === 'boolean') {
    qc.push(where('realizaEnvios', '==', filtros.realizaEnvios));
  }

  /* ---------------------------------------------------------------
     Siempre filtramos por 'activa'; si no se pasa, asumimos true.
  --------------------------------------------------------------- */
  qc.push(where('activa', '==', filtros.activa ?? true));

  /* ---------------------------------------------------------------
     Si la consulta es por activas (o no se especifica), añadimos la
     condición de vigencia en fechaExpiracion.
  --------------------------------------------------------------- */
  if (filtros.activa === undefined || filtros.activa === true) {
    qc.push(where('fechaExpiracion', '>', Timestamp.now()));
  }

  /* ---------------------------------------------------------------
     orderBy garantiza que Firestore use SIEMPRE el mismo índice
     (provincia, localidad, activa, fechaExpiracion ASC).
  --------------------------------------------------------------- */
  qc.push(orderBy('fechaExpiracion', 'asc'));

  const q: Query<DocumentData> = query(
    collection(db, PAGINAS_AMARILLAS_COLLECTION),
    ...qc,
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as PaginaAmarillaData);
};
