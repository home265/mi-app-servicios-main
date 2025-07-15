// src/app/components/resenas/ResenaCard.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { doc, getDoc, type Timestamp } from 'firebase/firestore';
import { StarIcon } from '@heroicons/react/24/solid';

import { db } from '@/lib/firebase/config';
import type { ReviewData } from '@/lib/services/reviewsService'; // <-- Se importa el nuevo tipo

import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';

// --- Tipos locales para mayor seguridad ---
interface AuthorProfile {
  nombre: string;
  apellido: string;
  selfieURL?: string;
}

interface ResenaCardProps {
  review: ReviewData; // <-- Se usa el nuevo tipo de reseña
}

// --- Componente de Ayuda para renderizar estrellas ---
const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {Array.from({ length: fullStars }, (_, i) => (
        <StarIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />
      ))}
      {hasHalfStar && (
        <div className="relative">
          <StarIcon className="h-5 w-5 text-gray-300" />
          <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
            <StarIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      )}
      {Array.from({ length: emptyStars }, (_, i) => (
        <StarIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
      ))}
    </div>
  );
};

// --- Componente Principal ---
const ResenaCard: React.FC<ResenaCardProps> = ({ review }) => {
  const [authorData, setAuthorData] = useState<AuthorProfile | null>(null);

  // Carga los datos del autor de la reseña
  useEffect(() => {
    async function fetchAuthor() {
      if (!review.authorCollection || !review.authorId) return;
      try {
        const snap = await getDoc(doc(db, review.authorCollection, review.authorId));
        if (snap.exists()) {
          // Se asegura de que los datos corresponden al perfil esperado
          setAuthorData(snap.data() as AuthorProfile);
        }
      } catch (error) {
        console.error("Error al cargar datos del autor:", error);
      }
    }
    fetchAuthor();
  }, [review.authorCollection, review.authorId]);

  // Helper para formatear los nombres de los criterios
  const formatCriterionLabel = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // No renderizar nada hasta tener los datos del autor
  if (!authorData) {
    return (
      <Card className="flex space-x-3 p-4 animate-pulse">
        <div className="rounded-full bg-gray-500 h-12 w-12"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-500 rounded w-3/4"></div>
          <div className="h-3 bg-gray-500 rounded w-1/2"></div>
          <div className="h-3 bg-gray-500 rounded w-1/4"></div>
        </div>
      </Card>
    );
  }

  const fullName = `${authorData.nombre || ''} ${authorData.apellido || ''}`.trim();
  const date = (review.timestamp as Timestamp)?.toDate();

  return (
    <Card className="p-4 space-y-4">
      {/* --- Encabezado: Avatar, Nombre y Promedio General --- */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar selfieUrl={authorData.selfieURL} nombre={fullName} size={48} />
          <div>
            <p className="font-semibold text-md text-[var(--color-texto-principal)]">{fullName}</p>
            {date && (
                <p className="text-xs text-[var(--color-texto-secundario)]">
                  {date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StarRatingDisplay rating={review.overallRating} />
          <span className="font-bold text-lg text-[var(--color-texto-principal)]">
            {review.overallRating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* --- Cuerpo: Desglose de Criterios y Comentario --- */}
      <div className="pl-[60px] space-y-4"> {/* Alinear con el nombre */}
        
        {/* Desglose de Calificaciones */}
        <div className="space-y-2 rounded-lg border border-[var(--color-borde-input)] p-3">
          {Object.entries(review.ratings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-texto-secundario)]">{formatCriterionLabel(key)}</span>
              <StarRatingDisplay rating={value} />
            </div>
          ))}
        </div>

        {/* Comentario */}
        {review.comment && (
          <p className="text-sm text-[var(--color-texto-principal)] bg-[var(--color-input)] p-3 rounded-lg italic">
            &quot;{review.comment}&quot;
          </p>
        )}
      </div>
    </Card>
  );
};

export default ResenaCard;