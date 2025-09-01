// /lib/services/verificacionService.ts
import type { InformacionFiscal, Actividad } from '@/types/informacionFiscal';

// --- Tipos que reflejan la ESTRUCTURA REAL de la API ---
type TFAfipInfoRequest = {
  apikey: string;
  apitoken: string;
  usertoken: string;
  cliente: {
    documento_tipo: 'CUIT';
    documento_nro: string;
  };
};

// Respuesta exitosa (CUIT): campos en el nivel raíz
export type TFAfipInfoSuccess = {
  error: 'N';
  razon_social?: string;
  condicion_impositiva?: string;
  domicilio?: string;
  localidad?: string;
  codigopostal?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
  provincia?: string;
  actividad?: Actividad[];
  errores?: string[];
};

// Respuesta de error (CUIL): el nombre viene dentro del array 'errores'
type TFAfipInfoError = {
  error: 'S';
  errores?: (string[] | string)[];
};

type TFAfipInfoResponse = TFAfipInfoSuccess | TFAfipInfoError;

/** Error tipado que conserva el payload crudo para que el route lo parsee */
export class TusFacturasApiError extends Error {
  constructor(public raw: unknown, message: string) {
    super(message);
    this.name = 'TusFacturasApiError';
  }
}

/** Aplana errores: (string[] | string)[] -> string[] */
function flattenErrores(src: TFAfipInfoError['errores']): string[] {
  if (!src) return [];
  const out: string[] = [];
  for (const item of src) {
    if (Array.isArray(item)) {
      for (const s of item) if (typeof s === 'string') out.push(s);
    } else if (typeof item === 'string') {
      out.push(item);
    }
  }
  return out;
}

/**
 * --- FUNCIÓN PRINCIPAL INTELIGENTE ---
 * Consulta el CUIT/CUIL y normaliza la respuesta.
 * Si es un CUIT, devuelve la respuesta exitosa.
 * Si la API devuelve error (p. ej. caso CUIL), se lanza un error que incluye el payload crudo.
 */
export async function consultarCuit(cuit: string): Promise<TFAfipInfoSuccess> {
  const apiKey = process.env.TUSFACTURAS_API_KEY;
  const apiToken = process.env.TUSFACTURAS_API_TOKEN;
  const userToken = process.env.TUSFACTURAS_USER_TOKEN;

  if (!apiKey || !apiToken || !userToken) {
    throw new Error('Faltan credenciales de TusFacturas en el servidor.');
  }

  const endpoint = 'https://www.tusfacturas.app/app/api/v2/clientes/afip-info';
  const body: TFAfipInfoRequest = {
    apikey: apiKey,
    apitoken: apiToken,
    usertoken: userToken,
    cliente: { documento_tipo: 'CUIT', documento_nro: cuit },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error('El servicio de verificación no está disponible en este momento.');
  }

  const dataParsed = (await res.json()) as TFAfipInfoResponse;

  // Si la API reporta error (casos típicos de CUIL), NO transformamos a éxito aquí.
  // Lanzamos un error con el payload crudo para que el route extraiga el nombre (helper).
  if (dataParsed.error === 'S') {
    const mensajes = flattenErrores(dataParsed.errores);
    const finalErrorMsg = mensajes.length > 0
      ? mensajes.join(', ')
      : 'No se pudo verificar el CUIT/CUIL.';
    throw new TusFacturasApiError(dataParsed, finalErrorMsg);
  }

  // Éxito CUIT: devolvemos tal cual (flujo intacto)
  return dataParsed;
}

function mapCondicionImpositiva(c?: string): InformacionFiscal['condicionImpositiva'] {
  const upperC = c?.toUpperCase();
  switch (upperC) {
    case 'RESPONSABLE INSCRIPTO': return 'RESPONSABLE_INSCRIPTO';
    case 'MONOTRIBUTO': return 'MONOTRIBUTO';
    case 'EXENTO': return 'EXENTO';
    case 'CONSUMIDOR FINAL': return 'CONSUMIDOR_FINAL';
    default: return 'NO_CATEGORIZADO';
  }
}

/**
 * Mapea la respuesta exitosa normalizada a tu modelo interno `InformacionFiscal`.
 */
export function mapAfipInfoToInformacionFiscal(
  resp: TFAfipInfoSuccess,
  cuitOrCuil: string
): InformacionFiscal {
  const ahora = new Date();
  const condicionImpositiva = mapCondicionImpositiva(resp.condicion_impositiva);

  return {
    razonSocial: resp.razon_social ?? '',
    condicionImpositiva,
    estado: resp.estado ?? 'INACTIVO',
    domicilio: resp.domicilio,
    localidad: resp.localidad,
    provincia: resp.provincia,
    codigopostal: resp.codigopostal,
    actividades: resp.actividad,
    fechaVerificacion: ahora,
    cuit: cuitOrCuil,
    verifiedAt: ahora,
  };
}
