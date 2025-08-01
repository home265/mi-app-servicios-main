// src/app/api/localidades/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json'; // <-- CAMBIO CLAVE: Se importa el JSON directamente.

// Definimos los tipos para que coincidan con la estructura del JSON.
type Localidad = {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
};

interface LocalidadesFile {
  localidades: Localidad[];
}

const todasLasLocalidades: Localidad[] = (data as LocalidadesFile).localidades;

export async function GET(request: Request) {
  try {
    // Obtenemos los parámetros de la URL para filtrar por provincia.
    const { searchParams } = new URL(request.url);
    const provinciaNombre = searchParams.get('provincia');

    // Si se pide una provincia específica, filtramos los resultados.
    if (provinciaNombre) {
      const localidadesFiltradas = todasLasLocalidades.filter(
        (l) => l.provincia.nombre.toLowerCase() === provinciaNombre.toLowerCase()
      );
      return NextResponse.json({ localidades: localidadesFiltradas });
    }

    // Si no, devolvemos todas las localidades.
    return NextResponse.json({ localidades: todasLasLocalidades });

  } catch (error) {
    console.error("Error al procesar localidades.json:", error);
    // Devolvemos un error 500 si algo falla en el servidor.
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}