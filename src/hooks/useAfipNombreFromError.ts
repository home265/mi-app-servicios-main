// src/hooks/useAfipNombreFromError.ts
import { useMemo } from 'react';
import { parseNombreFromTusFacturasError, ParsedNombre } from '@/lib/parseNombreFromTusFacturasError';

export function useAfipNombreFromError(payload: unknown): ParsedNombre | null {
  return useMemo(() => parseNombreFromTusFacturasError(payload), [payload]);
}
