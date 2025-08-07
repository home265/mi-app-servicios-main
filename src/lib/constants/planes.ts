// src/lib/constants/planes.ts

import { PlanId } from '@/types/paginaAmarilla';

/**
 * Define el modo de visualización de un anuncio.
 * - 'random': El anuncio aparece en rotación en distintas secciones.
 * - 'on_app_start': El anuncio tiene prioridad y aparece al iniciar la app.
 */
export type DisplayMode = 'random' | 'on_app_start';

/**
 * Define la estructura de un Plan de anuncio (el "tier" o nivel).
 */
export interface Plan {
  id: PlanId;
  name: string;
  priceARS: number; // Precio base por mes en ARS
  durationFrontMs: number; // Duración del frente de la tarjeta en milisegundos
  durationBackMs: number; // Duración del dorso de la tarjeta en milisegundos
  displayMode: DisplayMode;
  description: string; // Descripción breve del plan
}

/**
 * Lista de todos los planes de anuncios disponibles.
 */
export const PLANES: Plan[] = [
  {
    id: 'bronce',
    name: 'Plan Bronce',
    priceARS: 5000,
    durationFrontMs: 1500, // 1.5 segundos
    durationBackMs: 2500,  // 2.5 segundos (total 4s)
    displayMode: 'random',
    description: 'Rotación estándar en secciones de la app.',
  },
  {
    id: 'plata',
    name: 'Plan Plata',
    priceARS: 8000,
    durationFrontMs: 2000, // 2 segundos
    durationBackMs: 3000,  // 3 segundos (total 5s)
    displayMode: 'random',
    description: 'Mayor tiempo de exposición en rotación estándar.',
  },
  {
    id: 'oro',
    name: 'Plan Oro',
    priceARS: 12000,
    durationFrontMs: 2500, // 2.5 segundos
    durationBackMs: 3500,  // 3.5 segundos (total 6s)
    displayMode: 'random',
    description: 'Exposición extendida en rotación estándar.',
  },
  {
    id: 'titanio',
    name: 'Plan Titanio',
    priceARS: 18000,
    durationFrontMs: 3000, // 3 segundos
    durationBackMs: 5000,  // 5 segundos (total 8s)
    displayMode: 'random',
    description: 'Máxima exposición y duración en rotación estándar.',
  },
  {
    id: 'platino',
    name: 'Plan Platino',
    priceARS: 25000,
    durationFrontMs: 3000, // 3 segundos
    durationBackMs: 5000,  // 5 segundos (total 8s)
    displayMode: 'on_app_start',
    description: 'Exposición premium al iniciar la aplicación.',
  },
];