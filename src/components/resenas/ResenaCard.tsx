// src/app/components/resenas/ResenaCard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { StarIcon } from '@heroicons/react/24/solid';

import { db } from '@/lib/firebase/config';
import type { ReviewData } from '@/lib/services/reviewsService';

import Avatar from '@/components/common/Avatar';
// El import de Card genérico ya no es necesario, usaremos un div con estilos directos.
// import Card from '@/app/components/ui/Card';

// --- Tipos locales (sin cambios) ---
interface AuthorProfile {
  nombre: string;
  apellido: string;
  selfieURL?: string;
}

interface ResenaCardProps {
  review: ReviewData;
}

// --- Componente de Ayuda para renderizar estrellas (sin cambios) ---
const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {Array.from({ length: fullStars }, (_, i) => (
        <StarIcon key={`full-${i}`} className="h-5 w-5 text-primario" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <StarIcon className="h-5 w-5 text-texto-secundario opacity-50" />
          <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
            <StarIcon className="h-5 w-5 text-primario" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }, (_, i) => (
        <StarIcon key={`empty-${i}`} className="h-5 w-5 text-texto-secundario opacity-50" />
      ))}
    </div>
  );
};

// --- Componente Principal ---
const ResenaCard: React.FC<ResenaCardProps> = ({ review }) => {
  const [authorData, setAuthorData] = useState<AuthorProfile | null>(null);

  // Lógica de carga de datos (sin cambios)
  useEffect(() => {
    async function fetchAuthor() {
      if (!review.authorCollection || !review.authorId) return;
      try {
        const snap = await getDoc(doc(db, review.authorCollection, review.authorId));
        if (snap.exists()) {
          setAuthorData(snap.data() as AuthorProfile);
        }
      } catch (error) {
        console.error("Error al cargar datos del autor:", error);
      }
    }
    fetchAuthor();
  }, [review.authorCollection, review.authorId]);

  const formatCriterionLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Estado de carga con el nuevo estilo 3D
  if (!authorData) {
    return (
      <div
        className="flex space-x-3 p-4 animate-pulse rounded-2xl bg-tarjeta
                   shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]"
      >
        <div className="rounded-full bg-fondo h-12 w-12"></div>
        <div className="flex-1 space-y-3 py-1">
          <div className="h-4 bg-fondo rounded w-3/4"></div>
          <div className="h-3 bg-fondo rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const fullName = `${authorData.nombre || ''} ${authorData.apellido || ''}`.trim();
  const date = (review.timestamp as Timestamp)?.toDate();

  return (
    // Contenedor principal con el nuevo estilo 3D
    <div
      className="p-4 space-y-4 rounded-2xl bg-tarjeta
                 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]"
    >
      {/* --- Encabezado (sin cambios en la lógica) --- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar selfieUrl={authorData.selfieURL} nombre={fullName} size={48} />
          <div>
            <p className="font-semibold text-md text-texto-principal">{fullName}</p>
            {date && (
                <p className="text-xs text-texto-secundario">
                  {date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0 flex-shrink-0">
          <StarRatingDisplay rating={review.overallRating} />
          <span className="font-bold text-lg text-texto-principal">
            {review.overallRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* --- Cuerpo (sin cambios en la lógica) --- */}
      <div className="pl-[60px] space-y-4">
        
        {/* Desglose de Calificaciones */}
        <div className="space-y-2 rounded-lg border border-borde-tarjeta p-3">
          {Object.entries(review.ratings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-texto-secundario">{formatCriterionLabel(key)}</span>
              <StarRatingDisplay rating={value} />
            </div>
          ))}
        </div>

        {/* Comentario */}
        {review.comment && (
          <p className="text-sm text-texto-principal bg-fondo p-3 rounded-lg italic">
            &quot;{review.comment}&quot;
          </p>
        )}
      </div>
    </div>
  );
};

export default ResenaCard;