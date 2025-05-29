'use client';
import React from 'react';
import ResenaCard from './ResenaCard';
import { Review } from '@/lib/services/reviewsService';

interface ResenaListProps {
  reviews: Review[];
}

export const ResenaList: React.FC<ResenaListProps> = ({ reviews }) => {
  if (!reviews.length) {
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
        <ResenaCard key={r.id} review={r} />
      ))}
    </div>
  );
};
