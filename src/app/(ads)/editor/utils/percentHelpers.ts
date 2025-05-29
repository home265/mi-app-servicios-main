/**
 * Convierte un valor en píxeles a porcentaje respecto a un total.
 * @param px Valor en píxeles.
 * @param total Dimensión total en píxeles.
 * @returns Porcentaje (0–100).
 */
export function pxToPct(px: number, total: number): number {
  if (total <= 0) return 0;
  return (px / total) * 100;
}

/**
 * Convierte un valor de porcentaje a píxeles respecto a un total.
 * @param pct Porcentaje (0–100).
 * @param total Dimensión total en píxeles.
 * @returns Valor en píxeles.
 */
export function pctToPx(pct: number, total: number): number {
  return (pct / 100) * total;
}
