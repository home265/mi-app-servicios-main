// src/lib/constants/campanas.ts

import { CampaignId } from '@/types/paginaAmarilla';

/**
 * Define la estructura de una Campaña (la duración de una suscripción).
 */
export interface Campana {
  id: CampaignId;
  name: string;
  months: number; // Duración de la campaña en meses
  discount: number; // Descuento como un decimal (ej: 0.1 para 10%)
}

/**
 * Lista de todas las campañas disponibles.
 */
export const CAMPANAS: Campana[] = [
  {
    id: 'mensual',
    name: 'Mensual',
    months: 1,
    discount: 0, // Sin descuento
  },
  {
    id: 'trimestral',
    name: 'Trimestral',
    months: 3,
    discount: 0.1, // 10% de descuento
  },
  {
    id: 'semestral',
    name: 'Semestral',
    months: 6,
    discount: 0.2, // 20% de descuento
  },
  {
    id: 'anual',
    name: 'Anual',
    months: 12,
    discount: 0.3, // 30% de descuento
  },
];