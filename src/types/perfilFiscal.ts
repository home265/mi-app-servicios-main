// /types/perfilFiscal.ts

export type ViaVerificacion = 'cuit_padron' | 'cuil_nombre';
export type ReceptorParaFactura = 'CUIT' | 'CONSUMIDOR_FINAL';

export type CondicionImpositivaMin =
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL'
  | 'NO_CATEGORIZADO';

export type PerfilFiscalProveedor = {
  /** ID del cliente en el proveedor (p.ej., TusFacturas). No guarda CUIT. */
  tusFacturasClienteId?: string;
};

export type PerfilFiscal = {
  /** Cómo se verificó en el registro */
  viaVerificacion: ViaVerificacion;

  /** A quién facturar en la práctica (derivado de viaVerificacion) */
  receptorParaFactura: ReceptorParaFactura;

  /** Datos NO sensibles que ayudan a facturar a CUIT cuando existe padrón */
  razonSocial?: string | null;
  condicionImpositiva?: CondicionImpositivaMin | null;
  domicilio?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  codigopostal?: string | null;

  /** Dónde llega la factura */
  emailReceptor: string;

  /** Cuándo se verificó (ISO string o Date según tu uso) */
  verifiedAt: string;

  /** Info del proveedor (sin CUIT) */
  proveedor?: PerfilFiscalProveedor;

  /** Explícito: no se persiste CUIT/CUIL en este perfil */
  cuitGuardado: 'none';
};
