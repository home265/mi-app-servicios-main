// lib/services/tusFacturasService.ts
import type { InformacionFiscal } from '@/types/informacionFiscal';

const TF_ENDPOINT = 'https://www.tusfacturas.app/app/api/v2/facturacion/nuevo';

const {
  TUSFACTURAS_API_KEY,
  TUSFACTURAS_API_TOKEN,
  TUSFACTURAS_USER_TOKEN,
} = process.env;

if (!TUSFACTURAS_API_KEY || !TUSFACTURAS_API_TOKEN || !TUSFACTURAS_USER_TOKEN) {
  throw new Error('Faltan credenciales de TusFacturas en el .env');
}

export type Cliente = {
  documento_tipo: 'CUIT' | 'DNI' | 'EXT';
  documento_nro: string;
  razon_social?: string;
  email?: string;
  domicilio?: string;
  provincia?: string;
  condicion_iva: 'CF' | 'RI' | 'MT' | 'EX' | 'NR';
};

export type Item = {
  descripcion: string;
  cantidad: string | number;
  precio_unitario_sin_iva: string | number;
  alicuota: string | number; // ej 21, 10.5, 0
};

export type NuevaFacturaArgs = {
  tipo: 'FACTURA A' | 'FACTURA B' | 'FACTURA C' | 'FACTURA M' | 'FACTURA E';
  punto_venta: string;    // ej "0001"
  numero?: string;        // opcional, TF puede numerar
  external_reference: string; // tu ID de orden
  cliente: Cliente;
  items: Item[];
  bonificacion?: string | number;
  leyenda_gral?: string;
  pagos?: { descripcion: string; importe: number }[];
  moneda?: 'PES' | 'DOL';
  cotizacion?: string | number;
  /** NUEVO: controla si TF envía el mail al cliente (default: true) */
  enviaPorMail?: boolean;
};

/** Helper: arma el objeto `cliente` a partir de tu perfil fiscal guardado */
export function buildClienteFromFiscal(info: InformacionFiscal): Cliente {
  const documento_nro = info.cuit ?? info.cuil ?? '00000000';
  const documento_tipo: 'CUIT' | 'DNI' | 'EXT' = info.cuit ? 'CUIT' : 'DNI';

  return {
    documento_tipo,
    documento_nro,
    razon_social: info.razonSocial || undefined,
    email: info.emailFactura || undefined,
    // Podés pasar estos si los tenés; no son obligatorios:
    domicilio: info.domicilio || undefined,
    provincia: info.provincia || undefined,
    // Condición frente al IVA en el formato que TF espera:
    condicion_iva: info.condicionIVA ?? 'CF',
  };
}

export async function emitirFacturaTF({
  tipo,
  punto_venta,
  numero,
  external_reference,
  cliente,
  items,
  bonificacion = 0,
  leyenda_gral = '',
  pagos,
  moneda = 'PES',
  cotizacion,
  enviaPorMail = true,
}: NuevaFacturaArgs) {
  const body = {
    usertoken: TUSFACTURAS_USER_TOKEN,
    apikey: TUSFACTURAS_API_KEY,
    apitoken: TUSFACTURAS_API_TOKEN,
    cliente: {
      ...cliente,
      envia_por_mail: enviaPorMail ? 'S' : 'N',
    },
    comprobante: {
      fecha: new Date().toLocaleDateString('es-AR'), // dd/mm/yyyy
      tipo,
      punto_venta,
      numero,
      external_reference,
      operacion: 'V',
      moneda,
      cotizacion,
      detalle: items.map((it) => ({
        cantidad: String(it.cantidad),
        producto: {
          descripcion: it.descripcion,
          precio_unitario_sin_iva: String(it.precio_unitario_sin_iva),
          alicuota: String(it.alicuota),
        },
      })),
      bonificacion: String(bonificacion),
      leyenda_gral,
      pagos: pagos
        ? {
            formas_pago: pagos.map((p) => ({ descripcion: p.descripcion, importe: p.importe })),
            total: pagos.reduce((a, b) => a + b.importe, 0),
          }
        : undefined,
    },
  };

  const res = await fetch(TF_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    cache: 'no-store',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TusFacturas error ${res.status}: ${text}`);
  }
  return res.json(); // datos del comprobante (CAE, nro, PDF, etc.)
}

/* ============================================================================
 * NUEVO: soporte para PERFIL FISCAL ligero (sin guardar CUIT/CUIL)
 * ========================================================================== */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { PerfilFiscal, ReceptorParaFactura, CondicionImpositivaMin } from '@/types/perfilFiscal';

type CondicionIVA = 'CF' | 'RI' | 'MT' | 'EX' | 'NR';

export function mapCondicionImpositivaMinToIVA(ci?: CondicionImpositivaMin | null): CondicionIVA {
  switch (ci) {
    case 'RESPONSABLE_INSCRIPTO': return 'RI';
    case 'MONOTRIBUTO': return 'MT';
    case 'EXENTO': return 'EX';
    case 'CONSUMIDOR_FINAL': return 'CF';
    case 'NO_CATEGORIZADO':
    default: return 'NR';
  }
}

/**
 * Construye el `Cliente` desde el PERFIL (sin números sensibles).
 * Si pasás `legacy` (InformacionFiscal), puede usar su cuit/cuil para documento.
 */
export function buildClienteFromPerfil(
  perfil: PerfilFiscal,
  legacy?: Pick<InformacionFiscal, 'cuit' | 'cuil' | 'razonSocial' | 'condicionIVA' | 'emailFactura' | 'domicilio' | 'provincia'> | null
): Cliente {
  const documento_nro = legacy?.cuit ?? legacy?.cuil ?? '00000000';
  const documento_tipo: 'CUIT' | 'DNI' | 'EXT' = legacy?.cuit ? 'CUIT' : 'DNI';

  const condicionIVA: CondicionIVA =
    perfil.condicionImpositiva
      ? mapCondicionImpositivaMinToIVA(perfil.condicionImpositiva)
      : (legacy?.condicionIVA ?? 'CF');

  return {
    documento_tipo,
    documento_nro,
    razon_social: perfil.razonSocial ?? legacy?.razonSocial ?? 'Consumidor Final',
    email: perfil.emailReceptor, // preferimos el email declarado en el perfil
    domicilio: legacy?.domicilio || undefined,
    provincia: legacy?.provincia || undefined,
    condicion_iva: condicionIVA,
  };
}

/** Regla simple: RI → A ; resto → B (misma lógica que venías usando) */
export function tipoFacturaDesdeIVA(cond: CondicionIVA): 'FACTURA A' | 'FACTURA B' {
  return cond === 'RI' ? 'FACTURA A' : 'FACTURA B';
}

/**
 * Emite la factura en TF a partir del PERFIL (y opcionalmente `legacy`).
 * Respeta un modo "stub" si seteás TUSFACTURAS_MODE=stub para no emitir real.
 */
export async function emitirFacturaDesdePerfil(args: {
  external_reference: string;
  monto: number;
  perfil: PerfilFiscal;
  descripcion?: string;
  punto_venta?: string;
  leyenda_gral?: string;
  enviaPorMail?: boolean;
  legacyInfo?: InformacionFiscal | null; // si lo tenés, ayuda con doc_nro
}): Promise<{ ok: boolean; stub?: boolean }> {
  const {
    external_reference,
    monto,
    perfil,
    descripcion = `Orden ${external_reference}`,
    punto_venta = '0001',
    leyenda_gral = '',
    enviaPorMail = true,
    legacyInfo = null,
  } = args;

  // Modo protegido para pruebas
  const mode = (process.env.TUSFACTURAS_MODE ?? 'live') as 'live' | 'stub';
  if (mode === 'stub') {
    // Simulación sin emitir real
    return { ok: true, stub: true };
  }

  const cliente = buildClienteFromPerfil(perfil, legacyInfo);

  // Tipo de factura según receptor/IVA
  const cond = cliente.condicion_iva;
  const tipo: 'FACTURA A' | 'FACTURA B' =
    perfil.receptorParaFactura === 'CUIT' ? tipoFacturaDesdeIVA(cond) : 'FACTURA B';

  const items: Item[] = [
    {
      descripcion,
      cantidad: 1,
      precio_unitario_sin_iva: monto,
      alicuota: 21,
    },
  ];

  await emitirFacturaTF({
    tipo,
    punto_venta,
    external_reference,
    cliente,
    items,
    leyenda_gral,
    enviaPorMail,
    pagos: [{ descripcion: 'MercadoPago', importe: monto }],
  });

  return { ok: true };
}
