// src/app/api/anuncios/[anuncioId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getAnuncioById, updateAnuncio } from '../../../../lib/services/anunciosService';
import type { Anuncio } from '../../../../types/anuncio';

/**
 * En Next.js 15 el objeto `params` es **Promise** y debe esperarse.
 */
interface RouteContext {
  params: Promise<{
    anuncioId: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { anuncioId } = await params;
    const anuncio = await getAnuncioById(anuncioId);

    if (!anuncio) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    return NextResponse.json(anuncio);
  } catch (error) {
    console.error('Error obteniendo anuncio:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PUT                                      */
/* -------------------------------------------------------------------------- */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { anuncioId } = await params;

    const data = (await request.json()) as Partial<
      Omit<Anuncio, 'id' | 'creatorId' | 'createdAt'>
    >;

    await updateAnuncio(anuncioId, data);

    return NextResponse.json({ message: 'Anuncio actualizado' });
  } catch (error) {
    console.error('Error actualizando anuncio:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
