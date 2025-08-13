// /types/informacionFiscal.ts

/**
 * Define la estructura para una sola actividad económica registrada en AFIP.
 */
export interface Actividad {
  descripcion: string;
  id: string;
  nomenclador: string;
  periodo: string;
}

/**
 * Condición frente al IVA que usan servicios de facturación (p. ej., TusFacturas).
 * Mapeo típico desde tu `condicionImpositiva`:
 * - MONOTRIBUTO            -> 'CF' (o 'MT', según tu criterio operativo)
 * - RESPONSABLE_INSCRIPTO  -> 'RI'
 * - EXENTO                 -> 'EX'
 * - CONSUMIDOR_FINAL       -> 'CF'
 * - NO_CATEGORIZADO        -> 'NR'
 */
export type CondicionIVA = 'CF' | 'RI' | 'MT' | 'EX' | 'NR';

/**
 * Preferencias del usuario para recibir el comprobante fiscal.
 */
export interface PreferenciasEnvio {
  email: boolean;
}

/**
 * Define la estructura de los datos fiscales de un contribuyente,
 * tal como se reciben de la API y se guardan en la subcolección de Firestore.
 */
export interface InformacionFiscal {
  /** ID del documento de Firestore (opcional) */
  id?: string;

  /** Datos principales (existentes) */
  razonSocial: string;
  condicionImpositiva:
    | 'MONOTRIBUTO'
    | 'RESPONSABLE_INSCRIPTO'
    | 'EXENTO'
    | 'CONSUMIDOR_FINAL'
    | 'NO_CATEGORIZADO';
  estado: 'ACTIVO' | 'INACTIVO';

  /** Ubicación (existente) */
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  codigopostal?: string;

  /** Actividades (existente) */
  actividades?: Actividad[];

  /** Verificación (existente) */
  fechaVerificacion: Date;

  /* ------------------------------------------------------------
   * Campos agregados para facturación y notificaciones
   * ------------------------------------------------------------ */

  /** CUIT/CUIL del contribuyente (al menos uno) */
  cuit?: string;
  cuil?: string;

  /**
   * Condición frente al IVA en código AFIP/TusFacturas.
   * (Podés derivarla de `condicionImpositiva` al guardar).
   */
  condicionIVA?: CondicionIVA;

  /** Correo para envío automático de la factura */
  emailFactura?: string;

  /** Teléfono con WhatsApp del usuario (si lo manejás en tu app) */
  telefonoWhatsapp?: string;

  /** Preferencias para envío del comprobante */
  preferenciasEnvio?: PreferenciasEnvio;

  /**
   * Origen de la información fiscal (según tu flujo actual suele ser 'ARCA').
   */
  source?: 'ARCA';

  /**
   * Alias opcional de `fechaVerificacion`.
   */
  verifiedAt?: Date;
}
