// src/types/horarios.ts

/**
 * Representa un único rango de horario con una hora de inicio y una de fin.
 * Ejemplo: de "09:00" a "13:00".
 */
export interface RangoHorario {
  de: string;
  a: string;
}

/**
 * Define el estado del horario para un día específico.
 * Puede ser:
 * - 'cerrado': El local no abre ese día.
 * - 'abierto24h': El local está abierto todo el día.
 * - RangoHorario[]: Uno o más rangos si tiene horarios partidos o un solo turno.
 */
export type EstadoHorarioDia = 'cerrado' | 'abierto24h' | RangoHorario[];

/**
 * Configuración completa para un día de la semana.
 */
export interface ConfiguracionDia {
  readonly diaNombre: string;        // Ej: "Lunes"
  readonly diaAbreviatura: string;   // Ej: "LUN"
  readonly diaIndice: number;        // Ej: 0 para Lunes
  estado: EstadoHorarioDia;
}

/**
 * Arreglo con la configuración de horarios para toda la semana.
 */
export type HorariosDeAtencion = ConfiguracionDia[];

/**
 * Configuración inicial por defecto: todos los días cerrados.
 */
export const DIAS_SEMANA_CONFIG_INICIAL: HorariosDeAtencion = [
  { diaNombre: 'Lunes', diaAbreviatura: 'LUN', diaIndice: 0, estado: 'cerrado' },
  { diaNombre: 'Martes', diaAbreviatura: 'MAR', diaIndice: 1, estado: 'cerrado' },
  { diaNombre: 'Miércoles', diaAbreviatura: 'MIÉ', diaIndice: 2, estado: 'cerrado' },
  { diaNombre: 'Jueves', diaAbreviatura: 'JUE', diaIndice: 3, estado: 'cerrado' },
  { diaNombre: 'Viernes', diaAbreviatura: 'VIE', diaIndice: 4, estado: 'cerrado' },
  { diaNombre: 'Sábado', diaAbreviatura: 'SÁB', diaIndice: 5, estado: 'cerrado' },
  { diaNombre: 'Domingo', diaAbreviatura: 'DOM', diaIndice: 6, estado: 'cerrado' },
];
