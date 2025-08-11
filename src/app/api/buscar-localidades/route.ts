// src/app/api/buscar-localidades/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json';

// 1. Se simplifican los tipos. La interfaz 'Provincia' ya no es necesaria aquí.
interface Localidad {
  nombre: string;
  provincia: string;
}

interface LocalidadesFile {
  localidades: Localidad[];
}

const todasLasLocalidades: Localidad[] = (data as LocalidadesFile).localidades;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.length < 2) {
      return NextResponse.json({ sugerencias: [] });
    }

    const busquedaNormalizada = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const filtradas = todasLasLocalidades
      .filter(loc => {
        const nombreNormalizado = loc.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // 2. Se ajusta la lógica de filtrado para la provincia.
        // Ahora se accede directamente a 'loc.provincia'.
        const provinciaNormalizada = loc.provincia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        return nombreNormalizado.includes(busquedaNormalizada) || provinciaNormalizada.includes(busquedaNormalizada);
      })
      .slice(0, 10);

    return NextResponse.json({ sugerencias: filtradas });

  } catch (error) {
    console.error("Error en la API de búsqueda de localidades:", error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}