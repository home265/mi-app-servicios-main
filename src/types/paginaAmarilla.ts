// src/types/paginaAmarilla.ts

import { Timestamp } from 'firebase/firestore';
import { HorariosDeAtencion } from './horarios';

/* -------------------------------------------------------------------------- */
/* ROLES                                    */
/* -------------------------------------------------------------------------- */
export type RolPaginaAmarilla = 'prestador' | 'comercio';

// --- INICIO: NUEVOS TIPOS PARA PLANES Y CAMPAÑAS ---
export type PlanId = 'bronce' | 'plata' | 'oro' | 'titanio' | 'platino';
export type CampaignId = 'mensual' | 'trimestral' | 'semestral' | 'anual';
// --- FIN: NUEVOS TIPOS ---

/* -------------------------------------------------------------------------- */
/* ESTRUCTURA COMPLETA DEL DOCUMENTO                      */
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

  // --------------------------------------------------------------------------
  // --- INICIO: CAMPOS DE SUSCRIPCIÓN ACTUALIZADOS ---
  // --------------------------------------------------------------------------
  planId?: PlanId; // El tipo de plan (ej: 'bronce', 'oro')
  campaignId?: CampaignId; // La duración de la campaña (ej: 'mensual', 'anual')
  subscriptionStartDate?: Timestamp; // Se vuelve opcional por si solo se guarda el contenido
  subscriptionEndDate?: Timestamp; // Se vuelve opcional
  isActive: boolean;
  updatedAt?: Timestamp;
  paymentConfirmedAt?: Timestamp;
  // --- FIN: CAMPOS DE SUSCRIPCIÓN ACTUALIZADOS ---
}

/* -------------------------------------------------------------------------- */
/* TIPO SERIALIZABLE PARA PASAR A LOS CLIENT COMPONENTS          */
/* -------------------------------------------------------------------------- */
export interface SerializablePaginaAmarillaData
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion'
    | 'fechaExpiracion'
    | 'ultimaModificacion'
    | 'inicioCicloEdiciones'
    | 'subscriptionStartDate'
    | 'subscriptionEndDate'
    | 'updatedAt'
    | 'paymentConfirmedAt'
  > {
  fechaCreacion: string;
  fechaExpiracion: string;
  ultimaModificacion: string | null;
  inicioCicloEdiciones: string;
  subscriptionStartDate: string | null; // Se permite que sea null
  subscriptionEndDate: string | null; // Se permite que sea null
  updatedAt: string | null;
  paymentConfirmedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* DTO PARA CREAR UNA NUEVA PUBLICACIÓN DESDE EL FORM          */
/* -------------------------------------------------------------------------- */
/** Campos requeridos en la creación de una página amarilla.
 * Se omiten los timestamps, contadores y campos de suscripción que el backend inicializa.
 * `activa` se crea como `true`; `isActive` se crea como `false`. */
export interface CreatePaginaAmarillaDTO
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion'
    | 'fechaExpiracion'
    | 'ultimaModificacion'
    | 'contadorEdicionesAnual'
    | 'inicioCicloEdiciones'
    | 'activa'
    | 'planId' // Se omite el planId
    | 'campaignId' // Se omite el campaignId
    | 'subscriptionStartDate'
    | 'subscriptionEndDate'
    | 'isActive'
    | 'updatedAt'
    | 'paymentConfirmedAt'
  > {
  activa?: boolean;
}

/* -------------------------------------------------------------------------- */
/* FILTROS                                    */
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
  isActive?: boolean;
  realizaEnvios?: boolean;
  terminoBusqueda?: string;
  planId?: PlanId; // <-- Campo añadido para poder filtrar por plan
}