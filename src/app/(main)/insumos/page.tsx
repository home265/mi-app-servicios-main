// src/app/(main)/insumos/page.tsx
'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { listPaginasAmarillasByFilter } from '@/lib/services/paginasAmarillasService';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import BotonVolver from '@/components/common/BotonVolver';
import PaginaAmarillaDisplayCard from '@/components/paginas-amarillas/PaginaAmarillaDisplayCard';

// --- Componente de Lógica Principal ---
const InsumosResultados = () => {
  const searchParams = useSearchParams();
  const [resultados, setResultados] = useState<Record<string, SerializablePaginaAmarillaData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const provincia = searchParams.get('provincia');
    const localidad = searchParams.get('localidad');
    const rubrosQuery = searchParams.get('rubros');

    if (!provincia || !localidad || !rubrosQuery) {
      setError('Faltan parámetros para la búsqueda de insumos.');
      setIsLoading(false);
      return;
    }

    const rubros = rubrosQuery.split(',');

    const fetchInsumos = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const publicaciones = await listPaginasAmarillasByFilter({
          provincia,
          localidad,
          rubros, // Usamos la nueva capacidad de buscar por múltiples rubros
          rol: 'comercio', // Siempre buscamos comercios
          activa: true,
        });

        // Agrupamos los resultados por rubro para mostrarlos ordenadamente
        const agrupados = publicaciones.reduce((acc, pub) => {
          const rubro = pub.rubro || 'Otros';
          if (!acc[rubro]) {
            acc[rubro] = [];
          }
          acc[rubro].push(pub);
          return acc;
        }, {} as Record<string, SerializablePaginaAmarillaData[]>);

        setResultados(agrupados);
      } catch (err) {
        const fetchError = err as Error;
        setError(fetchError.message || 'Ocurrió un error al buscar proveedores.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsumos();
  }, [searchParams]);

  if (isLoading) {
    return <p className="text-center text-lg animate-pulse text-texto-secundario">Buscando proveedores...</p>;
  }

  if (error) {
    return <p className="text-center text-error">{error}</p>;
  }

  const rubrosEncontrados = Object.keys(resultados);

  if (rubrosEncontrados.length === 0) {
    return <p className="text-center text-texto-secundario">No se encontraron proveedores de insumos en tu zona para tu oficio.</p>;
  }

  return (
    <div className="space-y-8">
      {rubrosEncontrados.sort().map((rubro) => (
        <section key={rubro}>
          <h2 className="text-2xl font-bold text-primario mb-4 pb-2 border-b-2 border-primario/30">{rubro}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resultados[rubro].map((publicacion) => (
              <PaginaAmarillaDisplayCard key={publicacion.creatorId} publicacion={publicacion} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};

// --- Componente de Página Principal ---
export default function InsumosPage() {
  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal p-4 sm:p-8">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold text-texto-principal">Proveedores de Insumos</h1>
        <p className="text-texto-secundario">Resultados de búsqueda para tu oficio en tu localidad.</p>
      </header>
      <main className="w-full max-w-7xl mx-auto">
        <Suspense fallback={<p>Cargando...</p>}>
          <InsumosResultados />
        </Suspense>
      </main>
      <BotonVolver />
    </div>
  );
}