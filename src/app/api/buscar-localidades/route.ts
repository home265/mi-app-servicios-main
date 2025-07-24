// src/app/api/buscar-localidades/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

// Definimos los tipos para que coincidan con los del frontend
interface Provincia {
  id: string;
  nombre: string;
}

interface Localidad {
  id: string;
  nombre: string;
  provincia: Provincia;
}

interface LocalidadesFile {
  localidades: Localidad[];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // Si no hay un término de búsqueda, devolvemos un array vacío.
    if (!query || query.length < 2) {
      return NextResponse.json({ sugerencias: [] });
    }

    const jsonDirectory = path.join(process.cwd(), 'src', 'data');
    const fileContents = await fs.readFile(path.join(jsonDirectory, 'localidades.json'), 'utf8');
    const data: LocalidadesFile = JSON.parse(fileContents);

    // Replicamos la misma lógica de filtrado que tenías en el cliente.
    const busquedaNormalizada = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filtradas = data.localidades
      .filter(loc => {
        const nombreNormalizado = loc.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const provinciaNormalizada = loc.provincia.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nombreNormalizado.includes(busquedaNormalizada) || provinciaNormalizada.includes(busquedaNormalizada);
      })
      .slice(0, 10); // Limitamos a 10 resultados para no sobrecargar.

    return NextResponse.json({ sugerencias: filtradas });

  } catch (error) {
    console.error("Error en la API de búsqueda de localidades:", error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}