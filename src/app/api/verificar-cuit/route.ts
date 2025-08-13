// /app/api/verificar-cuit/route.ts
import { NextResponse } from 'next/server';
import {
  consultarCuit,
  mapAfipInfoToInformacionFiscal,
  type TFAfipInfoResponse,
} from '@/lib/services/verificacionService';
import type { InformacionFiscal, CondicionIVA } from '@/types/informacionFiscal';

// Normaliza texto: minúsculas, sin tildes, tokens > 1 char
function normalizarTexto(texto: string | undefined): string[] {
  if (!texto) return [];
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

type BodyIn = {
  cuit?: string;
  nombre?: string;
  apellido?: string;
};

function isValidBody(x: unknown): x is Required<BodyIn> {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.cuit === 'string' &&
    typeof o.nombre === 'string' &&
    typeof o.apellido === 'string' &&
    o.cuit.trim().length > 0 &&
    o.nombre.trim().length > 0 &&
    o.apellido.trim().length > 0
  );
}

// Mapea tu condicionImpositiva textual a código de IVA esperado por TF
function mapCondicionImpositivaToIVA(ci: InformacionFiscal['condicionImpositiva']): CondicionIVA {
  switch (ci) {
    case 'RESPONSABLE_INSCRIPTO': return 'RI';
    case 'MONOTRIBUTO': return 'MT'; // si preferís 'CF' para monotributo, cambialo aquí
    case 'EXENTO': return 'EX';
    case 'CONSUMIDOR_FINAL': return 'CF';
    case 'NO_CATEGORIZADO':
    default: return 'NR';
  }
}

// Type guard: narra TFAfipInfoResponse a "éxito"
type TFAfipInfoSuccessLocal = Extract<TFAfipInfoResponse, { error: 'N' }>;
function isTFAfipSuccess(resp: TFAfipInfoResponse): resp is TFAfipInfoSuccessLocal {
  return resp.error === 'N';
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;

    if (!isValidBody(raw)) {
      return NextResponse.json(
        { error: true, message: 'Faltan datos requeridos (cuit, nombre, apellido).' },
        { status: 400 }
      );
    }

    // Sanitizar CUIT/CUIL a solo dígitos
    const cuit = raw.cuit.replace(/\D/g, '');
    const nombre = raw.nombre;
    const apellido = raw.apellido;

    if (cuit.length < 8) {
      return NextResponse.json(
        { error: true, message: 'CUIL/CUIT inválido.' },
        { status: 422 }
      );
    }

    // 1) Consultar TusFacturas (padrones AFIP/ARCA)
    const resp = (await consultarCuit(cuit)) as TFAfipInfoResponse;

    // 2) Si vino error explícito desde TF, devolvemos mensaje claro
    if (!isTFAfipSuccess(resp)) {
      const msg =
        Array.isArray(resp.errores) && resp.errores.length > 0
          ? resp.errores.join(', ')
          : 'No se pudo verificar el CUIT/CUIL.';
      return NextResponse.json({ error: true, message: msg }, { status: 502 });
    }

    // 3) Cotejar nombre+apellido vs razón social del padrón
    const tokensUsuario = [...normalizarTexto(nombre), ...normalizarTexto(apellido)];
    const razon = resp.cliente?.razon_social ?? '';
    const tokensPadron = normalizarTexto(razon);

    const coincide =
      tokensUsuario.length > 0 &&
      tokensUsuario.every((tUser) => tokensPadron.some((tPad) => tPad.includes(tUser)));

    if (!coincide) {
      return NextResponse.json(
        { error: true, message: 'El nombre y apellido no coinciden con los registros oficiales.' },
        { status: 401 }
      );
    }

    // 4) Mapear a tu modelo interno (ahora resp está narrowed a éxito)
    const base: InformacionFiscal = mapAfipInfoToInformacionFiscal(resp, cuit);

    // 5) Enriquecer con nuevos campos por defecto
    const datos: InformacionFiscal = {
      ...base,
      cuit: base.cuit ?? cuit,
      condicionIVA: base.condicionIVA ?? mapCondicionImpositivaToIVA(base.condicionImpositiva),
      emailFactura: base.emailFactura,
      preferenciasEnvio: base.preferenciasEnvio ?? { email: true },
    };

    return NextResponse.json<{ error?: false; data: InformacionFiscal }>(
      { error: false as const, data: datos },
      { status: 200 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
    return NextResponse.json({ error: true, message: msg }, { status: 500 });
  }
}
