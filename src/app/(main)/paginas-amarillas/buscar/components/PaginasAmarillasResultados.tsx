// src/app/(main)/paginas-amarillas/buscar/components/PaginasAmarillasResultados.tsx
'use client';

import React from 'react';
import { PaginaAmarillaData } from '@/types/paginaAmarilla';
import PaginaAmarillaDisplayCard from '@/app/components/paginas-amarillas/PaginaAmarillaDisplayCard';

interface Props {
  publicaciones: PaginaAmarillaData[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

const PaginasAmarillasResultados: React.FC<Props> = ({
  publicaciones,
  isLoading,
  error,
  hasSearched,
}) => {
  /* ---------- estado “cargando” ---------- */
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-tarjeta border border-borde-tarjeta rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-20 bg-borde-tarjeta rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-borde-tarjeta rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-borde-tarjeta rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-borde-tarjeta rounded w-full mb-2"></div>
            <div className="h-8 bg-borde-tarjeta rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  /* ---------- estado “error” ---------- */
  if (error) {
    return (
      <div className="mt-8 text-center p-6 bg-error/10 border border-error/30 rounded-md">
        <h3 className="text-lg font-semibold text-error">
          Error al realizar la búsqueda
        </h3>
        <p className="text-error/90 mt-1">{error}</p>
      </div>
    );
  }

  /* ---------- estado “sin resultados” ---------- */
  if (hasSearched && publicaciones.length === 0) {
    return (
      <div className="mt-8 text-center p-6 bg-tarjeta border border-borde-tarjeta rounded-md">
        <h3 className="text-lg font-semibold text-texto-principal">
          No se encontraron publicaciones
        </h3>
        <p className="text-texto-secundario mt-1">
          Intenta ajustar tus filtros de búsqueda o explora otras opciones.
        </p>
      </div>
    );
  }

  /* ---------- estado “resultados” ---------- */
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {publicaciones.map((p) => (
        <PaginaAmarillaDisplayCard key={p.creatorId} publicacion={p} />
      ))}
    </div>
  );
};

export default PaginasAmarillasResultados;