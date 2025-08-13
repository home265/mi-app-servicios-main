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
