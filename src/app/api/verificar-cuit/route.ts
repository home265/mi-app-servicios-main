// /app/api/verificar-cuit/route.ts
import { NextResponse } from 'next/server';
import {
  consultarCuit,
  mapAfipInfoToInformacionFiscal,
} from '@/lib/services/verificacionService';
import type { InformacionFiscal, CondicionIVA } from '@/types/informacionFiscal';
import { parseNombreFromTusFacturasError } from '@/lib/parseNombreFromTusFacturasError';
import type { ParsedNombre } from '@/lib/parseNombreFromTusFacturasError';

/**
 * Normaliza texto: minúsculas, sin tildes/puntuación, y conserva iniciales.
 */
function normalizarTexto(texto: string | undefined): string[] {
  if (!texto) return [];
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,]/g, '') // Elimina comas y puntos
    .split(/\s+/)
    .filter(Boolean); // Elimina espacios extra y conserva palabras de una letra
}

type BodyIn = { cuit?: string; nombre?: string; apellido?: string; };

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

function mapCondicionImpositivaToIVA(ci: InformacionFiscal['condicionImpositiva']): CondicionIVA {
  switch (ci) {
    case 'RESPONSABLE_INSCRIPTO': return 'RI';
    case 'MONOTRIBUTO': return 'MT';
    case 'EXENTO': return 'EX';
    case 'CONSUMIDOR_FINAL': return 'CF';
    default: return 'NR';
  }
}

export async function POST(request: Request) {
  try {
    const raw = (await request.json()) as unknown;
    if (!isValidBody(raw)) {
      return NextResponse.json({ error: true, message: 'Faltan datos requeridos.' }, { status: 400 });
    }

    const { cuit, nombre, apellido } = raw;
    const cuitSanitized = cuit.replace(/\D/g, '');

    if (cuitSanitized.length < 8) {
      return NextResponse.json({ error: true, message: 'CUIL/CUIT inválido.' }, { status: 422 });
    }

    // `consultarCuit` ahora SIEMPRE devuelve un objeto de éxito o lanza un error.
    const resp = await consultarCuit(cuitSanitized);

    // Lógica de comparación flexible y robusta
    const tokensNombreUsuario = normalizarTexto(nombre);
    const tokensApellidoUsuario = normalizarTexto(apellido);
    const razonSocialOficial = resp.razon_social ?? '';
    const tokensPadron = normalizarTexto(razonSocialOficial);

    const apellidoCoincide = tokensApellidoUsuario.every(
      (tApellido) => tokensPadron.some((tPad) => tPad.includes(tApellido))
    );
    const nombreCoincide = tokensNombreUsuario.some(
      (tNombre) => tokensPadron.some((tPad) => tPad.includes(tNombre))
    );

    if (!apellidoCoincide || !nombreCoincide) {
      return NextResponse.json(
        { error: true, message: 'El nombre y apellido no coinciden con los registros oficiales.' },
        { status: 401 }
      );
    }

    // Mapeo y respuesta final
    const base: InformacionFiscal = mapAfipInfoToInformacionFiscal(resp, cuitSanitized);
    const datos: InformacionFiscal = {
      ...base,
      condicionIVA: mapCondicionImpositivaToIVA(base.condicionImpositiva),
    };

    return NextResponse.json({ data: datos }, { status: 200 });
  } catch (e: unknown) {
    // Intento de extracción de nombre/apellido desde el error de tusfacturas.app
    // 1) Si el error trae un payload crudo en `raw`, lo usamos
    const hasRaw = typeof e === 'object' && e !== null && 'raw' in e;
    const rawPayload: unknown = hasRaw ? (e as { raw: unknown }).raw : e;

    const extracted: ParsedNombre | null = parseNombreFromTusFacturasError(rawPayload);

    if (extracted) {
      // Devolvemos 200 con error=true para que el cliente pueda validar por CUIL (indicio)
      return NextResponse.json(
        {
          error: true,
          message: 'AFIP sin datos registrales (modo CUIL)',
          extractedNombre: extracted,
        },
        { status: 200 }
      );
    }

    const msg = e instanceof Error ? e.message : 'Ocurrió un error inesperado.';
    // Devuelve el mensaje de error real del servicio si existe
    return NextResponse.json({ error: true, message: msg }, { status: 500 });
  }
}
