// src/app/api/buscar-localidades/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json'; // <-- CAMBIO CLAVE: Se importa el JSON directamente.

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

// Se "castea" el JSON importado una sola vez para tener el tipado correcto.
const todasLasLocalidades: Localidad[] = (data as LocalidadesFile).localidades;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    // Si no hay un término de búsqueda, devolvemos un array vacío.
    if (!query || query.length < 2) {
      return NextResponse.json({ sugerencias: [] });
    }

    // Ya no es necesario leer el archivo, usamos la variable `todasLasLocalidades`
    // que ya tiene los datos.

    // Replicamos la misma lógica de filtrado que tenías.
    const busquedaNormalizada = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filtradas = todasLasLocalidades
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