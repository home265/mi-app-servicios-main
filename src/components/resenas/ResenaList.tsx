'use client';
import React from 'react';
import ResenaCard from './ResenaCard';
// CORRECCIÓN: Se importa el nuevo tipo 'ReviewData' en lugar del antiguo 'Review'.
import type { ReviewData } from '@/lib/services/reviewsService';

interface ResenaListProps {
  // CORRECCIÓN: Se usa el nuevo tipo 'ReviewData[]' para la prop 'reviews'.
  reviews: ReviewData[];
}

export const ResenaList: React.FC<ResenaListProps> = ({ reviews }) => {
  // Se añade una comprobación para asegurarse de que 'reviews' no es nulo o indefinido.
  if (!reviews || reviews.length === 0) {
    /* mensaje coherente con la paleta global */
    return (
      <p className="text-[var(--color-texto-secundario)]">
        No hay reseñas aún.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        // Esta parte funciona perfectamente, ya que nuestro nuevo ResenaCard espera una 'review' de tipo ReviewData.
        <ResenaCard key={r.id} review={r} />
      ))}
    </div>
  );
};