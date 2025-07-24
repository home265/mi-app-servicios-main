// src/app/api/localidades/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Definimos un tipo básico para las localidades para mejorar el autocompletado
type Localidad = {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
};

export async function GET(request: Request) {
  try {
    // Obtenemos los parámetros de la URL para filtrar por provincia
    const { searchParams } = new URL(request.url);
    const provinciaNombre = searchParams.get('provincia');

    // Construimos la ruta al archivo JSON dentro de la carpeta /src/data
    const jsonDirectory = path.join(process.cwd(), 'src', 'data');
    const fileContents = await fs.readFile(path.join(jsonDirectory, 'localidades.json'), 'utf8');
    const data: { localidades: Localidad[] } = JSON.parse(fileContents);

    // Si se pide una provincia específica, filtramos los resultados
    if (provinciaNombre) {
      const localidadesFiltradas = data.localidades.filter(
        (l) => l.provincia.nombre.toLowerCase() === provinciaNombre.toLowerCase()
      );
      return NextResponse.json({ localidades: localidadesFiltradas });
    }

    // Si no, devolvemos todas las localidades
    return NextResponse.json(data);

  } catch (error) {
    console.error("Error al leer o procesar localidades.json:", error);
    // Devolvemos un error 500 si algo falla en el servidor
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}