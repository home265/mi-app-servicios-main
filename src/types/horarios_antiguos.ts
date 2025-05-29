// src/types/horarios_antiguos.ts

/**
 * ESTA ES LA ESTRUCTURA ANTIGUA de cómo definías el horario para un día.
 * La necesitamos para poder convertir los datos viejos al nuevo formato.
 */
export interface HorarioDia { // Este es tu TIPO ANTIGUO
  readonly diaNombre: string;
  readonly diaAbreviatura: string;
  readonly diaIndice: number;
  habilitado: boolean;
  es24Horas: boolean;
  apertura?: string; // Formato HH:mm
  cierre?: string;   // Formato HH:mm
}

// Esta era tu constante de configuración ANTIGUA.
// La función de adaptación que te daré no la usa directamente,
// pero es bueno tenerla aquí como referencia de cómo eran los datos.
export const DIAS_SEMANA_CONFIG_ANTIGUA: ReadonlyArray<HorarioDia> = [
  { diaNombre: 'Lunes', diaAbreviatura: 'LUN', diaIndice: 0, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Martes', diaAbreviatura: 'MAR', diaIndice: 1, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Miércoles', diaAbreviatura: 'MIÉ', diaIndice: 2, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Jueves', diaAbreviatura: 'JUE', diaIndice: 3, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Viernes', diaAbreviatura: 'VIE', diaIndice: 4, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Sábado', diaAbreviatura: 'SÁB', diaIndice: 5, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
  { diaNombre: 'Domingo', diaAbreviatura: 'DOM', diaIndice: 6, habilitado: false, es24Horas: false, apertura: '', cierre: '' },
] as const;