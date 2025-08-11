// src/app/components/resenas/CriterioRating.tsx
'use client';

import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';

interface CriterioRatingProps {
  label: string;
  rating: number;
  onRatingChange: (newRating: number) => void;
}

const CriterioRating: React.FC<CriterioRatingProps> = ({
  label,
  rating,
  onRatingChange,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div>
      <label className="block mb-3 font-medium text-texto-principal">
        {label}
      </label>
      <div
        className="flex items-center space-x-2" // Aumentamos el espacio para los botones más grandes
        onMouseLeave={() => setHoverRating(0)}
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= (hoverRating || rating);

          // Clases base para todos los botones de estrella
          const baseButtonClasses = `
            relative flex items-center justify-center
            w-12 h-12 rounded-full bg-tarjeta
            transition-all duration-150 ease-in-out
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo focus:ring-primario
          `;

          // Clases condicionales según si la estrella está "llena" o "vacía"
          const stateClasses = isFilled
            ? // Estilo "Presionado" para estrellas llenas (seleccionadas o en hover)
              `
              text-primario
              shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6)]
              scale-95
            `
            : // Estilo "Elevado" para estrellas vacías
              `
              text-texto-secundario opacity-50
              shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(255,255,255,0.05)]
              hover:opacity-100 hover:text-primario
              active:scale-95
            `;

          return (
            <button
              type="button"
              key={starIndex}
              onClick={() => onRatingChange(starIndex)}
              onMouseEnter={() => setHoverRating(starIndex)}
              // Combinamos las clases base con las condicionales
              className={`${baseButtonClasses} ${stateClasses}`}
            >
              <StarIcon className="h-8 w-8" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CriterioRating;