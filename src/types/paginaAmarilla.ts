// src/types/paginaAmarilla.ts
import { Timestamp } from 'firebase/firestore';
// Importamos el nuevo tipo principal para la configuración de horarios de toda la semana
import { HorariosDeAtencion } from './horarios';

export type RolPaginaAmarilla = 'prestador' | 'comercio';

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
  // Actualizamos el tipo de 'horarios' para usar la nueva estructura
  horarios?: HorariosDeAtencion | null; // Puede ser null o undefined si no se establecen
  realizaEnvios?: boolean | null;
}

// Tipo para pasar a Client Components, con fechas como strings
// y horarios también serializados si es necesario (aunque HorariosDeAtencion ya es serializable)
export interface SerializablePaginaAmarillaData
  extends Omit<
    PaginaAmarillaData,
    'fechaCreacion' | 'fechaExpiracion' | 'ultimaModificacion' | 'inicioCicloEdiciones'
  > {
  fechaCreacion: string;        // ISOString
  fechaExpiracion: string;      // ISOString
  ultimaModificacion: string;   // ISOString
  inicioCicloEdiciones: string; // ISOString
  // La propiedad 'horarios' se hereda de PaginaAmarillaData con el tipo HorariosDeAtencion | null
}

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
  // No solemos filtrar directamente por la estructura compleja de horarios aquí,
  // pero podrías añadir un filtro como 'abiertoAhora?: boolean' que se calcularía en el backend.
}