// src/app/api/localidades/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json';

// 1. Se simplifican los tipos para que coincidan con la nueva estructura del JSON.
type Localidad = {
  nombre: string;
  provincia: string;
};

interface LocalidadesFile {
  localidades: Localidad[];
}

// Esta parte no cambia, ya que la estructura principal { "localidades": [...] } se mantuvo.
const todasLasLocalidades: Localidad[] = (data as LocalidadesFile).localidades;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provinciaNombre = searchParams.get('provincia');

    if (provinciaNombre) {
      // 2. Se ajusta la lógica de filtrado.
      // Ahora se compara directamente con `l.provincia` porque ya no es un objeto.
      const localidadesFiltradas = todasLasLocalidades.filter(
        (l) => l.provincia.toLowerCase() === provinciaNombre.toLowerCase()
      );
      return NextResponse.json({ localidades: localidadesFiltradas });
    }

    // Si no, devolvemos todas las localidades (ahora en su formato simple).
    return NextResponse.json({ localidades: todasLasLocalidades });

  } catch (error) {
    console.error("Error al procesar localidades.json:", error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}