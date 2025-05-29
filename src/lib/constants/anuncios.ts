/**
 * Definiciones tipadas para planes y tipos de campaña
 */

// Exportamos PlanId explícitamente para que sea accesible desde otros módulos
export type PlanId = 'platino' | 'titanio' | 'oro' | 'plata' | 'bronce';

export interface Plan {
  id: PlanId;
  name: string;
  maxImages: number;
  durationSeconds: number;
  priceARS: number;
  displayMode: 'inicio' | 'aleatoria';
}

export const planes: Plan[] = [
  { id: 'platino', name: 'Platino', maxImages: 8, durationSeconds: 8, priceARS: 50000, displayMode: 'inicio' },
  { id: 'titanio', name: 'Titanio', maxImages: 7, durationSeconds: 7, priceARS: 30000, displayMode: 'aleatoria' },
  { id: 'oro', name: 'Oro', maxImages: 6, durationSeconds: 6, priceARS: 25000, displayMode: 'aleatoria' },
  { id: 'plata', name: 'Plata', maxImages: 5, durationSeconds: 5, priceARS: 15000, displayMode: 'aleatoria' },
  { id: 'bronce', name: 'Bronce', maxImages: 4, durationSeconds: 4, priceARS: 10000, displayMode: 'aleatoria' },
];

// Exportamos CampaniaId explícitamente para que sea accesible desde otros módulos
export type CampaniaId = 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface Campania {
  id: CampaniaId;
  name: string;
  months: number;
  discount: number; // 0.1 => 10%
}

export const campanias: Campania[] = [
  { id: 'mensual', name: 'Mensual', months: 1, discount: 0 },
  { id: 'trimestral', name: 'Trimestral', months: 3, discount: 0.1 },
  { id: 'semestral', name: 'Semestral', months: 6, discount: 0.2 },
  { id: 'anual', name: 'Anual', months: 12, discount: 0.3 },
];
