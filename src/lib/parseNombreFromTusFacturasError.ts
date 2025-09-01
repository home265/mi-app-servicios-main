// src/lib/parseNombreFromTusFacturasError.ts

export type ParsedNombre = {
  /** Tal como viene en AFIP, en MAYÚSCULAS, sin adornos extra */
  nombreCompleto: string;
  /** Apellido principal (asumimos el 1º token) */
  apellido: string;
  /** Segundo apellido si existe (cuando hay ≥4 tokens) */
  apellido2?: string;
  /** Todos los nombres de pila (resto de tokens) */
  nombres: string;
  /** Tokens ya limpios (útil para debug/comparaciones) */
  tokens: string[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === 'object' && v !== null;
}

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

/** Aplana recursivamente lo que venga y devuelve solo strings */
function flattenToStrings(u: unknown): string[] {
  if (isString(u)) return [u];
  if (Array.isArray(u)) {
    const acc: string[] = [];
    for (const el of u) acc.push(...flattenToStrings(el));
    return acc;
  }
  return [];
}

/**
 * Extrae el texto del/los mensajes de error de tusfacturas.app
 * Soporta: { errores: [[ "msg" ]] }, { message: "..." } o string directo.
 */
function extractMessageText(payload: unknown): string | null {
  if (isString(payload)) return payload;

  if (isRecord(payload)) {
    const errores = payload['errores'];
    const pieces = flattenToStrings(errores);
    const joined = pieces.join(' ').trim();
    if (joined) return joined;

    const messageProp = payload['message'];
    if (isString(messageProp)) return messageProp;
  }

  return null;
}

/**
 * Busca el bloque de nombre en mayúsculas.
 * 1) Toma lo que viene DESPUÉS del último ":" y ANTES del " - ".
 * 2) Si falla, busca directamente un bloque MAYÚSCULAS que termina en " - ".
 */
function extractNameBlock(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // Caso más común: "... error:  PEREZ GARCIA MARIA VICTORIA - La clave ..."
  const idxColon = normalized.lastIndexOf(':');
  if (idxColon !== -1) {
    const after = normalized.slice(idxColon + 1).trim();
    const dashMatch = after.match(
      // Nota: el guion va ESCAPADO \- para evitar "rango" en la clase
      /^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s'’.·\-]+?)(?:\s*[-–—]\s*|$)/u
    );
    if (dashMatch) return dashMatch[1].trim();
  }

  // Fallback: "PEREZ GARCIA MARIA VICTORIA - ..." (sin confiar en ":")
  const m = normalized.match(
    /([A-ZÁÉÍÓÚÜÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÜÑ'’.·\-]{2,}){1,})\s*[-–—]/u
  );
  if (m) return m[1].trim();

  return null;
}

/** Limpia el bloque a MAYÚSCULAS, sin caracteres raros, espacios colapsados */
function cleanName(name: string): string {
  return name
    .replace(/[^A-ZÁÉÍÓÚÜÑ\s'’.\-·]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s'’.·\-]+|[\s'’.·\-]+$/g, '')
    .toUpperCase();
}

/**
 * Helper principal:
 * - Lee el JSON/objeto/error devuelto por tusfacturas.app
 * - Extrae el nombre en mayúsculas
 * - Lo parte en tokens y devuelve un JSON amigable
 *
 * Heurística:
 *   - 2 tokens: [APELLIDO] [NOMBRES]
 *   - 3 tokens: [APELLIDO] [NOMBRE] [NOMBRE]
 *   - ≥4 tokens: [APELLIDO] [APELLIDO2] [NOMBRES...]
 */
export function parseNombreFromTusFacturasError(payload: unknown): ParsedNombre | null {
  const msg = extractMessageText(payload);
  if (!msg) return null;

  const rawBlock = extractNameBlock(msg);
  if (!rawBlock) return null;

  const cleaned = cleanName(rawBlock);
  const tokens = cleaned.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) return null;
  if (tokens.length === 1) {
    return {
      nombreCompleto: cleaned,
      apellido: tokens[0],
      nombres: '',
      tokens,
    };
  }

  const apellido = tokens[0];
  const hasSecondLastName = tokens.length >= 4;
  const apellido2 = hasSecondLastName ? tokens[1] : undefined;
  const nombresTokens = hasSecondLastName ? tokens.slice(2) : tokens.slice(1);

  return {
    nombreCompleto: cleaned,
    apellido,
    ...(apellido2 ? { apellido2 } : {}),
    nombres: nombresTokens.join(' '),
    tokens,
  };
}

/**
 * Normalizador para comparar contra los campos de tu formulario.
 * (MAYÚSCULAS, sin tildes ni puntuación, espacios colapsados; preserva Ñ)
 */
export function normalizarNombreParaComparar(input: string): string {
  return (input || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // quita tildes
    .replace(/[^\w\sÑ]/g, ' ')       // deja letras, dígitos, _ y Ñ
    .replace(/\s+/g, ' ')
    .trim();
}
