// src/types/paginaAmarilla.ts
import { Timestamp } from 'firebase/firestore';
import { HorariosDeAtencion } from './horarios';

/* -------------------------------------------------------------------------- */
/*                                   ROLES                                    */
/* -------------------------------------------------------------------------- */
export type RolPaginaAmarilla = 'prestador' | 'comercio';

/* -------------------------------------------------------------------------- */
/*                     ESTRUCTURA COMPLETA DEL DOCUMENTO                      */
/* -------------------------------------------------------------------------- */
export interface PaginaAmarillaData {
  creatorId: string;
  creatorRole: RolPaginaAmarilla;
  nombrePublico: string;
  provincia: string;
  localidad: string;

  fechaCreacion: Timestamp;
  fechaExpiracion: Timestamp;
  ultimaModificacion: Timestamp;
  contadorEdicionesAnual: number;
  inicioCicloEdiciones: Timestamp;

  activa: boolean;

  tituloCard?: string | null;
  subtituloCard?: string | null;
  descripcion?: string | null;
  imagenPortadaUrl?: string | null;
  telefonoContacto?: string | null;
  emailContacto?: string | null;
  enlaceWeb?: string | null;
  enlaceInstagram?: string | null;
  enlaceFacebook?: string | null;
  direccionVisible?: string | null;

  rubro?: string | null;
  subRubro?: string | null;
  categoria?: string | null;
  subCategoria?: string | null;

  horarios?: HorariosDeAtencion | null;
  realizaEnvios?: boolean | null;
}

/* -------------------------------------------------------------------------- */
/*              TIPO SERIALIZABLE PARA PASAR A LOS CLIENT COMPONENTS          */
/* -------------------------------------------------------------------------- */
export interface SerializablePaginaAmarillaData
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion'
    | 'fechaExpiracion'
    | 'ultimaModificacion'
    | 'inicioCicloEdiciones'
  > {
  fechaCreacion: string;
  fechaExpiracion: string;
  ultimaModificacion: string;
  inicioCicloEdiciones: string;
}

/* -------------------------------------------------------------------------- */
/*                DTO PARA CREAR UNA NUEVA PUBLICACIÓN DESDE EL FORM          */
/* -------------------------------------------------------------------------- */
/** Campos requeridos en la creación de una página amarilla.
 *  Se omiten los timestamps y contadores que el backend inicializa.
 *  `activa` se crea como `true`; se marca opcional para no romper llamadas
 *  anteriores y para permitir asignarlo internamente si fuese necesario. */
export interface CreatePaginaAmarillaDTO
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion'
    | 'fechaExpiracion'
    | 'ultimaModificacion'
    | 'contadorEdicionesAnual'
    | 'inicioCicloEdiciones'
    | 'activa'
  > {
  activa?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                                 FILTROS                                   */
/* -------------------------------------------------------------------------- */
export interface PaginaAmarillaFiltros {
  provincia?: string;
  localidad?: string;
  rubro?: string;
  subRubro?: string;
  categoria?: string;
  subCategoria?: string;
  rol?: RolPaginaAmarilla;
  activa?: boolean;
  realizaEnvios?: boolean;
  terminoBusqueda?: string;
}
