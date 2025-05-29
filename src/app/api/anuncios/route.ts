import { NextRequest, NextResponse } from 'next/server';
import {
  listAnunciosByFilter,
  createDraftAnuncio,
  AnuncioFilter,
} from '../../../lib/services/anunciosService';

/**
 * GET /api/anuncios
 * Listar anuncios según filtros de query params: provincia, localidad, plan, status, creatorId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filter: AnuncioFilter = {};

    if (searchParams.has('provincia')) {
      filter.provincia = searchParams.get('provincia')!;
    }
    if (searchParams.has('localidad')) {
      filter.localidad = searchParams.get('localidad')!;
    }
    if (searchParams.has('plan')) {
      filter.plan = searchParams.get('plan')!;
    }
    if (searchParams.has('status')) {
      filter.status = searchParams.get('status') as AnuncioFilter['status'];
    }
    if (searchParams.has('creatorId')) {
      filter.creatorId = searchParams.get('creatorId')!;
    }

    const anuncios = await listAnunciosByFilter(filter);
    return NextResponse.json(anuncios);
  } catch (error) {
    console.error('Error listing anuncios:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * POST /api/anuncios
 * Crea un anuncio en estado 'draft'. Recibe el body con los campos del anuncio (sin id, createdAt, updatedAt).
 */
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // data debe cumplir Omit<Anuncio, 'id' | 'createdAt' | 'updatedAt'>
    const newId = await createDraftAnuncio(data);
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (error) {
    console.error('Error creating anuncio:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
