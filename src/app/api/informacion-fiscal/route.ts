// /app/api/informacion-fiscal/route.ts
import { NextResponse } from 'next/server';
import type { PerfilFiscal, ViaVerificacion, ReceptorParaFactura, CondicionImpositivaMin } from '@/types/perfilFiscal';
import { savePerfilFiscal } from '@/lib/services/perfilFiscalService';

type Rol = 'usuario' | 'prestador' | 'comercio';

type BodyIn = {
  uid?: string;
  perfil?: PerfilFiscal;
  rol?: Rol; // opcional: ayuda a ubicar la colección; si no viene, se busca automáticamente
};

function isViaVerificacion(x: unknown): x is ViaVerificacion {
  return x === 'cuit_padron' || x === 'cuil_nombre';
}

function isReceptorParaFactura(x: unknown): x is ReceptorParaFactura {
  return x === 'CUIT' || x === 'CONSUMIDOR_FINAL';
}

function isCondicion(x: unknown): x is CondicionImpositivaMin {
  return (
    x === 'RESPONSABLE_INSCRIPTO' ||
    x === 'MONOTRIBUTO' ||
    x === 'EXENTO' ||
    x === 'CONSUMIDOR_FINAL' ||
    x === 'NO_CATEGORIZADO'
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isStringOrNull(x: unknown): x is string | null {
  return typeof x === 'string' || x === null;
}

function isOptionalStringOrNull(x: unknown): x is string | null | undefined {
  return typeof x === 'string' || x === null || typeof x === 'undefined';
}

function isProveedor(obj: unknown): obj is NonNullable<PerfilFiscal['proveedor']> {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  if (typeof o.tusFacturasClienteId === 'undefined') return true;
  return typeof o.tusFacturasClienteId === 'string';
}

function isPerfilFiscal(x: unknown): x is PerfilFiscal {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;

  // requeridos
  if (!isViaVerificacion(o.viaVerificacion)) return false;
  if (!isReceptorParaFactura(o.receptorParaFactura)) return false;
  if (typeof o.emailReceptor !== 'string') return false;
  if (typeof o.verifiedAt !== 'string') return false; // aceptamos ISO string
  if (o.cuitGuardado !== 'none') return false;

  // opcionales (strings o null)
  if (!isOptionalStringOrNull(o.razonSocial)) return false;
  if (!(typeof o.condicionImpositiva === 'undefined' || o.condicionImpositiva === null || isCondicion(o.condicionImpositiva))) {
    return false;
  }
  if (!isOptionalStringOrNull(o.domicilio)) return false;
  if (!isOptionalStringOrNull(o.localidad)) return false;
  if (!isOptionalStringOrNull(o.provincia)) return false;
  if (!isOptionalStringOrNull(o.codigopostal)) return false;

  // proveedor opcional
  if (!(typeof o.proveedor === 'undefined' || isProveedor(o.proveedor))) return false;

  return true;
}

function isRol(x: unknown): x is Rol {
  return x === 'usuario' || x === 'prestador' || x === 'comercio';
}

function isValidBody(b: unknown): b is Required<Pick<BodyIn, 'uid' | 'perfil'>> & Partial<Pick<BodyIn, 'rol'>> {
  if (typeof b !== 'object' || b === null) return false;
  const o = b as Record<string, unknown>;
  if (typeof o.uid !== 'string' || o.uid.trim().length === 0) return false;
  if (!isPerfilFiscal(o.perfil)) return false;
  // rol es opcional; si viene, validamos valor
  if (typeof o.rol !== 'undefined' && !isRol(o.rol)) return false;
  return true;
}

export async function POST(req: Request) {
  const body: unknown = await req.json();

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: true, message: 'Payload inválido: se requiere { uid, perfil } con estructura correcta.' },
      { status: 400 }
    );
  }

  const { uid, perfil, rol } = body;

  // Persistir en Firestore: users/{uid}/informacionFiscal/current (campo 'perfil')
  try {
    await savePerfilFiscal(uid, typeof rol === 'string' ? rol : '', perfil);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'No se pudo guardar la información fiscal.';
    return NextResponse.json({ error: true, message: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
