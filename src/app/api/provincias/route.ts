// src/app/api/provincias/route.ts

import { NextResponse } from 'next/server';
import data from '@/data/localidades.json';

// 1. Los tipos se simplifican drásticamente.
// Ya no necesitamos una interfaz 'Provincia', y 'Localidad' se ajusta al nuevo formato.
interface Localidad {
  nombre: string;
  provincia: string;
}

interface LocalidadesFile {
  localidades: Localidad[];
}

export async function GET() {
  try {
    const dataTyped: LocalidadesFile = data;

    // 2. La lógica se reescribe para ser más eficiente.
    // Usamos un 'Set' para obtener automáticamente los nombres de provincia únicos.
    // Un 'Set' solo permite valores únicos, por lo que no tenemos que verificar si ya existe.
    const provinciasSet = new Set<string>();
    
    dataTyped.localidades.forEach((localidad: Localidad) => {
      provinciasSet.add(localidad.provincia);
    });

    // 3. Convertimos el Set de nuevo a un arreglo.
    const provinciasUnicas = Array.from(provinciasSet);

    // La API ahora devolverá un arreglo de strings.
    return NextResponse.json({ provincias: provinciasUnicas });

  } catch (error) {
    console.error("Error al leer o procesar provincias:", error);
    return new NextResponse('Error interno del servidor', { status: 500 });
  }
}