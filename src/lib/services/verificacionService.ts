// /lib/services/verificacionService.ts
import type { InformacionFiscal, Actividad, CondicionIVA } from '@/types/informacionFiscal';

/** -------------------- Tipos de request/response de TusFacturas -------------------- */

type DocumentoTipo = 'CUIT' | 'DNI' | 'EXT';

type TFAfipInfoRequest = {
  apikey: string;
  apitoken: string;
  usertoken: string;
  cliente: {
    documento_tipo: DocumentoTipo;
    documento_nro: string;
  };
};

type TFAfipCliente = {
  razon_social?: string;
  condicion_iva?: CondicionIVA;
  domicilio?: string;
  localidad?: string;
  provincia?: string;
  codigopostal?: string;
  actividades?: Actividad[];
  estado?: 'ACTIVO' | 'INACTIVO';
  // Pueden venir más campos; no los forzamos aquí
};

export type TFAfipInfoSuccess = {
  error: 'N';
  cliente?: TFAfipCliente;
  mensajes?: string[];
  errores?: string[];
};

type TFAfipInfoError = {
  error: 'S';
  errores?: string[];
  mensajes?: string[];
};

export type TFAfipInfoResponse = TFAfipInfoSuccess | TFAfipInfoError;

/** -------------------- Helpers de type-narrowing -------------------- */

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function parseResponse(x: unknown): TFAfipInfoResponse {
  if (!isObject(x)) {
    return { error: 'S', errores: ['Respuesta inválida del servicio'] };
  }
  const obj = x as Record<string, unknown>;
  const error = typeof obj.error === 'string' ? (obj.error as 'N' | 'S') : 'S';

  const cliente = isObject(obj.cliente)
    ? (obj.cliente as unknown as TFAfipCliente)
    : undefined;

  const mensajes = Array.isArray(obj.mensajes) ? (obj.mensajes as string[]) : undefined;
  const errores = Array.isArray(obj.errores) ? (obj.errores as string[]) : undefined;

  return { error, cliente, mensajes, errores } as TFAfipInfoResponse;
}

/** -------------------- Servicio principal -------------------- */

/**
 * Consulta los datos de un CUIT/CUIL en la API de TusFacturas.app.
 * Debe ejecutarse en servidor (nunca en el navegador).
 *
 * @param cuit CUIT/CUIL a consultar (solo dígitos).
 * @returns Respuesta tipada de TusFacturas (éxito o error).
 * @throws Si faltan credenciales o si la API devuelve error.
 */
export async function consultarCuit(cuit: string): Promise<TFAfipInfoResponse> {
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
    cliente: {
      documento_tipo: 'CUIT',
      documento_nro: cuit,
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  // Intentamos parsear JSON siempre (aunque no sea 2xx) para extraer errores.
  let dataParsed: TFAfipInfoResponse;
  try {
    const json = (await res.json()) as unknown;
    dataParsed = parseResponse(json);
  } catch {
    dataParsed = { error: 'S', errores: ['No se pudo parsear la respuesta JSON.'] };
  }

  if (!res.ok || dataParsed.error === 'S') {
    const msg =
      (dataParsed.errores && dataParsed.errores.join(', ')) ||
      'Error al consultar el CUIT.';
    throw new Error(msg);
  }

  return dataParsed;
}

/** -------------------- Utilidad: tipo de factura según condición IVA -------------------- */

export type FacturaTipo = 'FACTURA A' | 'FACTURA B';

/**
 * Regla estándar:
 * - RI  -> FACTURA A
 * - CF, MT, EX, NR -> FACTURA B
 */
export function facturaTipoFromCondicionIVA(condicionIVA?: CondicionIVA): FacturaTipo {
  return condicionIVA === 'RI' ? 'FACTURA A' : 'FACTURA B';
}

/** -------------------- Normalizador opcional a tu modelo -------------------- */

/** Mapea condicionIVA (códigos AFIP/TF) a tu `condicionImpositiva` “amigable”. */
function mapCondicionIVAToImpositiva(c?: CondicionIVA):
  | 'MONOTRIBUTO'
  | 'RESPONSABLE_INSCRIPTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL'
  | 'NO_CATEGORIZADO' {
  switch (c) {
    case 'RI': return 'RESPONSABLE_INSCRIPTO';
    case 'MT': return 'MONOTRIBUTO';
    case 'EX': return 'EXENTO';
    case 'CF': return 'CONSUMIDOR_FINAL';
    case 'NR': return 'NO_CATEGORIZADO';
    default:   return 'NO_CATEGORIZADO';
  }
}

/**
 * Mapea la respuesta exitosa de TusFacturas al tipo interno `InformacionFiscal`.
 * Útil para guardar en Firestore en `users/{uid}/informacionFiscal/current`.
 *
 * @param resp Respuesta de TusFacturas con `error: 'N'`.
 * @param cuitOrCuil CUIT/CUIL consultado (por si no viene en la respuesta).
 */
export function mapAfipInfoToInformacionFiscal(
  resp: TFAfipInfoSuccess,
  cuitOrCuil: string
): InformacionFiscal {
  const cli: TFAfipCliente = resp.cliente ?? {};
  const ahora = new Date();

  const condicionIVA: CondicionIVA | undefined = cli.condicion_iva;
  const condicionImpositiva = mapCondicionIVAToImpositiva(condicionIVA);

  return {
    // Campos “existentes” en tu tipo
    razonSocial: cli.razon_social ?? '',
    condicionImpositiva,
    estado: cli.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO',
    domicilio: cli.domicilio,
    localidad: cli.localidad,
    provincia: cli.provincia,
    codigopostal: cli.codigopostal,
    actividades: cli.actividades,
    fechaVerificacion: ahora,

    // Campos agregados para facturación
    cuit: cuitOrCuil,
    condicionIVA, // usado luego para decidir tipo de factura
    emailFactura: undefined, // podés setear el email del perfil si lo tenés
    telefonoWhatsapp: undefined,
    preferenciasEnvio: { email: true },
    source: 'ARCA',
    verifiedAt: ahora,
  };
}
