// src/types/paginaAmarilla.ts

import { Timestamp } from 'firebase/firestore';
import { HorariosDeAtencion } from './horarios';

/* -------------------------------------------------------------------------- */
/* ROLES                                    */
/* -------------------------------------------------------------------------- */
export type RolPaginaAmarilla = 'prestador' | 'comercio';

export type PlanId = 'bronce' | 'plata' | 'oro' | 'titanio' | 'platino';
export type CampaignId = 'mensual' | 'trimestral' | 'semestral' | 'anual';

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
  matriculaProfesional?: string | null;
  planId?: PlanId;
  campaignId?: CampaignId;
  subscriptionStartDate?: Timestamp;
  subscriptionEndDate: Timestamp;
  isActive: boolean;
  updatedAt?: Timestamp;
  paymentConfirmedAt?: Timestamp;
}

/* -------------------------------------------------------------------------- */
/* TIPO SERIALIZABLE PARA PASAR A LOS CLIENT COMPONENTS          */
/* -------------------------------------------------------------------------- */
export interface SerializablePaginaAmarillaData
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion' | 'fechaExpiracion' | 'ultimaModificacion' | 'inicioCicloEdiciones'
    | 'subscriptionStartDate' | 'subscriptionEndDate' | 'updatedAt' | 'paymentConfirmedAt'
  > {
  fechaCreacion: string;
  fechaExpiracion: string;
  ultimaModificacion: string | null;
  inicioCicloEdiciones: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  updatedAt: string | null;
  paymentConfirmedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* DTO PARA CREAR UNA NUEVA PUBLICACIÓN DESDE EL FORM          */
/* -------------------------------------------------------------------------- */
export interface CreatePaginaAmarillaDTO
  extends Omit<
    PaginaAmarillaData,
    | 'fechaCreacion' | 'fechaExpiracion' | 'ultimaModificacion' | 'contadorEdicionesAnual'
    | 'inicioCicloEdiciones' | 'activa' | 'subscriptionStartDate' | 'subscriptionEndDate'
    | 'isActive' | 'updatedAt' | 'paymentConfirmedAt'
  > {
  // Se omiten los campos de arriba, pero SÍ permitimos que se pasen estos:
  planId?: PlanId;
  campaignId?: CampaignId;
  activa?: boolean;
}

/* -------------------------------------------------------------------------- */
/* FILTROS                                    */
/* -------------------------------------------------------------------------- */
export interface PaginaAmarillaFiltros {
  provincia?: string;
  localidad?: string;
  rubro?: string;
  rubros?: string[]; // <--- ÚNICA LÍNEA AÑADIDA
  subRubro?: string;
  categoria?: string;
  subCategoria?: string;
  rol?: RolPaginaAmarilla;
  activa?: boolean;
  isActive?: boolean;
  realizaEnvios?: boolean;
  terminoBusqueda?: string;
  planId?: PlanId; // Para filtrar por un plan específico
  planIds?: PlanId[]; // Para filtrar por una LISTA de planes (ej: 'titanio', 'oro', etc.)
}