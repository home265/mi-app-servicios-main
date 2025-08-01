// src/app/api/provincias/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json'; // <-- CAMBIO CLAVE: Se importa el JSON directamente.

// 1. Definimos la estructura de nuestros datos con interfaces
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

export async function GET() {
  try {
    // Ya no es necesario leer el archivo con `fs`.
    
    // 2. Aplicamos nuestro tipo estricto al JSON importado
    const dataTyped: LocalidadesFile = data;

    // Usamos un Map para obtener provincias únicas de forma eficiente
    const provinciasMap = new Map<string, Provincia>();
    
    // 3. El callback del forEach ahora usa el tipo 'Localidad'
    dataTyped.localidades.forEach((localidad: Localidad) => {
      if (!provinciasMap.has(localidad.provincia.id)) {
        provinciasMap.set(localidad.provincia.id, localidad.provincia);
      }
    });

    const provinciasUnicas = Array.from(provinciasMap.values());

    return NextResponse.json({ provincias: provinciasUnicas });

  } catch (error) {
    console.error("Error al leer o procesar provincias:", error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}