// lib/flags.ts
function nonEmpty(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * ¿Mercado Pago está listo?
 * Requiere token privado (server) y public key (frontend).
 */
export const MP_ENABLED: boolean =
  nonEmpty(process.env.MP_ACCESS_TOKEN) &&
  nonEmpty(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);

/**
 * ¿TusFacturas está listo?
 * Requiere las tres credenciales del panel (todas del lado servidor).
 */
export const TF_ENABLED: boolean =
  nonEmpty(process.env.TUSFACTURAS_API_KEY) &&
  nonEmpty(process.env.TUSFACTURAS_API_TOKEN) &&
  nonEmpty(process.env.TUSFACTURAS_USER_TOKEN);

/**
 * URL pública de la app (para back_urls, links en correos, etc.)
 * Útil si necesitás construir rutas completas en server.
 */
export const APP_URL: string = process.env.NEXT_PUBLIC_APP_URL ?? "";

/**
 * (Opcional) Tipo de factura deseado. Cambiá el valor por ENV si querés.
 * 'B' (Responsable Inscripto), 'C' (Monotributo). Solo referencia.
 */
export const FACTURA_TIPO: "B" | "C" =
  (process.env.FACTURA_TIPO === "B" || process.env.FACTURA_TIPO === "C")
    ? process.env.FACTURA_TIPO
    : "B";
