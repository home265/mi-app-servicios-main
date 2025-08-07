// src/app/(main)/anuncios/page.tsx
import React from 'react';

import { PaginaAmarillaData } from '@/types/paginaAmarilla';
import { PlanSuscripcionId } from '@/lib/constants/planes';
import AnuncioAnimadoCard from '@/app/components/anuncios/AnuncioAnimadoCard';

// ======================================================================
// --- INICIO: LÓGICA MODIFICADA ---
// ======================================================================

// --- 1. Definición de las duraciones para cada plan (en milisegundos) ---
interface PlanDuracion {
  frente: number;
  dorso: number;
}

// Mapea los IDs de los planes a sus respectivas duraciones de animación.
const DURACIONES_POR_PLAN: Record<PlanSuscripcionId, PlanDuracion> = {
  mensual:    { frente: 1500, dorso: 2500 }, // Total: 4s
  trimestral: { frente: 2000, dorso: 3000 }, // Total: 5s
  semestral:  { frente: 2500, dorso: 3500 }, // Total: 6s
  anual:      { frente: 3000, dorso: 4000 }, // Total: 7s
};

// Duración por defecto en caso de que un plan no se encuentre.
const DEFAULT_DURACION: PlanDuracion = DURACIONES_POR_PLAN.mensual;


// --- 2. Función para obtener los datos reales desde la API ---
async function fetchPublicacionesDestacadas(): Promise<PaginaAmarillaData[]> {
  // Construye la URL base. En producción, esto debería venir de una variable de entorno.
  const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL('/api/paginas-amarillas', baseURL);
  
  // Añadimos el parámetro clave para pedir solo los anuncios con suscripción.
  url.searchParams.append('tipo', 'anuncios');

  try {
    const res = await fetch(url.toString(), {
      // Evitamos que la lista de anuncios se guarde en caché para que siempre esté actualizada.
      cache: 'no-store', 
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al obtener los anuncios desde la API.');
    }

    return res.json();

  } catch (error) {
    console.error("Error en fetchPublicacionesDestacadas:", error);
    // Devuelve un array vacío si hay un error para no romper la página.
    return []; 
  }
}

// --- Componente de Página ---
const AnunciosPage = async () => {
  const publicaciones = await fetchPublicacionesDestacadas();

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center text-amber-300 mb-4">
        Anuncios Destacados
      </h1>
      <p className="text-center text-texto-secundario mb-12">
        Nuestros miembros premium. ¡Apoya el comercio local!
      </p>

      {/* Grid para mostrar los anuncios */}
      {publicaciones.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {publicaciones.map((pub) => {
            // --- 3. Lógica para asignar la duración dinámicamente ---
            const planId = pub.subscriptionPlan; // 'mensual', 'trimestral', etc.
            const duracion = DURACIONES_POR_PLAN[planId] || DEFAULT_DURACION;

            return (
              <AnuncioAnimadoCard
                key={pub.creatorId}
                publicacion={pub}
                duracionFrente={duracion.frente}
                duracionDorso={duracion.dorso}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-texto-secundario">
          <p>No hay anuncios destacados para mostrar en este momento.</p>
        </div>
      )}
    </div>
  );
};

export default AnunciosPage;

// ======================================================================
// --- FIN: LÓGICA MODIFICADA ---
// ======================================================================