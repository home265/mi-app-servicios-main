// src/app/api/anuncios/route.ts

import { NextResponse, NextRequest } from 'next/server';
import { listPaginasAmarillasByFilter, ListPaginasAmarillasOptions } from '@/lib/services/paginasAmarillasService';
import { getNextAdIndex } from '@/lib/services/adCounterService';
import { PaginaAmarillaFiltros, PlanId } from '@/types/paginaAmarilla';

// Define la jerarquía de los planes para la búsqueda con fallback.
const PLAN_HIERARCHY: PlanId[] = ['platino', 'titanio', 'oro', 'plata', 'bronce'];
const GENERAL_PLANS: PlanId[] = ['titanio', 'oro', 'plata', 'bronce'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const provincia = searchParams.get('provincia');
    const localidad = searchParams.get('localidad');
    const context = searchParams.get('context');

    if (!provincia || !localidad || !context) {
      return NextResponse.json(
        { error: 'Faltan parámetros de búsqueda (provincia, localidad, context).' },
        { status: 400 }
      );
    }

    // --- LÓGICA PARA ANUNCIOS DE ALTA PRIORIDAD (EJ: BÚSQUEDA DE SERVICIO) ---
    if (context === 'searchTrigger') {
      for (const plan of PLAN_HIERARCHY) {
        const filtros: PaginaAmarillaFiltros = { provincia, localidad, planId: plan, activa: true };
        const options: ListPaginasAmarillasOptions = { soloSuscritos: true };
        
        if (plan === 'platino') {
          options.orderBy = 'fechaCreacion';
        }

        const ads = await listPaginasAmarillasByFilter(filtros, options);

        if (ads.length > 0) {
          let adToShow = ads[0];

          if (plan === 'platino' && ads.length > 0) {
            const index = await getNextAdIndex(provincia, localidad, ads.length);
            adToShow = ads[index];
          }

          return NextResponse.json(adToShow, { status: 200 });
        }
      }
      return NextResponse.json(null, { status: 200 });
    }
    
    // --- LÓGICA PARA ANUNCIOS GENERALES (EJ: DESPUÉS DE ACEPTAR TRABAJO) ---
    if (context === 'generalTrigger') {
      const filtros: PaginaAmarillaFiltros = {
        provincia,
        localidad,
        planIds: GENERAL_PLANS,
        activa: true,
      };
      
      const options: ListPaginasAmarillasOptions = { 
        soloSuscritos: true, 
        orderBy: 'fechaCreacion'
      };

      const ads = await listPaginasAmarillasByFilter(filtros, options);
      
      // --- INICIO DE LA CORRECCIÓN ---
      // Devolvemos la lista de anuncios encontrada.
      return NextResponse.json(ads, { status: 200 });
      // --- FIN DE LA CORRECCIÓN ---
    }

    return NextResponse.json({ error: 'Contexto no válido.' }, { status: 400 });

  } catch (err) {
    const error = err as Error;
    console.error('Error en la API de anuncios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener el anuncio.' },
      { status: 500 }
    );
  }
}