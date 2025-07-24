// src/app/api/provincias/route.ts

import { NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';

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
    const jsonDirectory = path.join(process.cwd(), 'src', 'data');
    const fileContents = await fs.readFile(path.join(jsonDirectory, 'localidades.json'), 'utf8');
    
    // 2. Aplicamos nuestro tipo estricto al parsear el JSON
    const data: LocalidadesFile = JSON.parse(fileContents);

    // Usamos un Map para obtener provincias únicas de forma eficiente
    const provinciasMap = new Map<string, Provincia>();
    
    // 3. El callback del forEach ahora usa el tipo 'Localidad'
    data.localidades.forEach((localidad: Localidad) => {
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