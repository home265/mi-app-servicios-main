// src/app/api/anuncios/[anuncioId]/capturas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { listCapturas, addCaptura } from '../../../../../lib/services/anunciosService';
import type { Captura } from '../../../../../types/anuncio';

/**
 * Next 15: `params` llega como **Promise** y debe esperarse.
 * Tipamos el contexto acorde y usamos `await params`.
 */
interface RouteContext {
  params: Promise<{
    anuncioId: string;
  }>;
}

/* -------------------------------------------------------------------------- */
/*                               MÉTODO  GET                                  */
/* -------------------------------------------------------------------------- */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { anuncioId } = await params;
    const capturas: Captura[] = await listCapturas(anuncioId);
    return NextResponse.json(capturas);
  } catch (error) {
    console.error('Error listando capturas:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                               MÉTODO  POST                                 */
/* -------------------------------------------------------------------------- */
export async function POST(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { anuncioId } = await params;

    // Extraer explícitamente los datos (se omite createdAt)
    const {
      imageUrl,
      screenIndex,
      plan,
      campaignDurationDays,
      provincia,
      localidad,
      animationEffect,
      durationSeconds,
      totalExposure,
    } = (await request.json()) as Omit<Captura, 'createdAt'>;

    const capturaData: Omit<Captura, 'createdAt'> = {
      imageUrl,
      screenIndex,
      plan,
      campaignDurationDays,
      provincia,
      localidad,
      animationEffect,
      durationSeconds,
      totalExposure,
    };

    const newId = await addCaptura(anuncioId, capturaData);
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (error) {
    console.error('Error creando captura:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
