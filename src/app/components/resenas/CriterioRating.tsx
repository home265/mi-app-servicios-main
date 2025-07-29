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
      <label className="block mb-2 font-medium text-texto-principal">
        {label}
      </label>
      <div
        className="flex items-center space-x-1"
        onMouseLeave={() => setHoverRating(0)} // Resetea el hover al salir
      >
        {[1, 2, 3, 4, 5].map((starIndex) => {
          const isFilled = starIndex <= (hoverRating || rating);
          return (
            <button
              type="button"
              key={starIndex}
              onClick={() => onRatingChange(starIndex)}
              onMouseEnter={() => setHoverRating(starIndex)} // Muestra el hover al entrar
              className={`transition-colors duration-150 ${
                isFilled ? 'text-primario' : 'text-texto-secundario opacity-50 hover:text-primario hover:opacity-75'
              }`}
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