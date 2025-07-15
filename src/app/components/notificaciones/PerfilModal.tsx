'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/solid';
import type { DocumentData } from 'firebase/firestore';

import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button';
import { ResenaList } from '@/app/components/resenas/ResenaList';

import { getUserData } from '@/lib/firebase/authHelpers';
// 1. CORRECCIÓN: Se importa 'ReviewData' en lugar de 'Review', que ya no existe.
import { getReviews, type ReviewData } from '@/lib/services/reviewsService';

/* ------------------------------------------------------------------ */
// Tipos locales para mayor seguridad y claridad
/* ------------------------------------------------------------------ */
interface PerfilModalProps {
  target: { uid: string; collection: string };
  viewerMode: 'user' | 'provider';
  onClose: () => void;
}

// Tipo específico para los datos del perfil, evitando el uso de DocumentData genérico.
interface UserProfileData extends DocumentData {
  nombre: string;
  apellido: string;
  selfieURL?: string;
  descripcion?: string;
  localidad?: {
    nombre: string;
    provinciaNombre: string;
  };
}

// --- Componente de Ayuda para mostrar estrellas (solo visual) ---
const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <StarIcon key={i} className={`h-4 w-4 ${rating >= i ? 'text-yellow-400' : 'text-gray-400'}`} />
        ))}
    </div>
);

/* ------------------------------------------------------------------ */
// Componente Principal
/* ------------------------------------------------------------------ */
const PerfilModal: React.FC<PerfilModalProps> = ({
  target,
  viewerMode,
  onClose,
}) => {
  const [userData, setUserData] = useState<UserProfileData | null>(null);
  // 2. CORRECCIÓN: El estado ahora almacena un array de 'ReviewData'.
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  
  // --- NUEVOS ESTADOS para el promedio y la carga ---
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const result = await getUserData(target.uid);
        if (result) {
          setUserData(result.data as UserProfileData);
        }

        const context = viewerMode === 'provider' ? 'as_user' : 'as_provider';
        const fetchedReviews = await getReviews(target, context);
        setReviews(fetchedReviews);

        // 3. NUEVO: Se calcula y guarda el promedio de las calificaciones.
        if (fetchedReviews.length > 0) {
          const total = fetchedReviews.reduce((sum, rev) => sum + rev.overallRating, 0);
          setAverageRating(total / fetchedReviews.length);
        } else {
          setAverageRating(0); // Si no hay reseñas, el promedio es 0.
        }

      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [target, viewerMode]);

  // Renderiza un estado de carga
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="text-white text-lg animate-pulse">Cargando perfil...</div>
      </div>
    );
  }

  // Si no se encontraron datos de usuario, no se renderiza nada.
  if (!userData) return null;

  const fullName = `${userData.nombre} ${userData.apellido}`;
  const location = userData.localidad
    ? `${userData.localidad.nombre}, ${userData.localidad.provinciaNombre}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 anim-fadeIn">
      <Card className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 p-5 anim-zoomIn">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4">
          <Avatar selfieUrl={userData.selfieURL} nombre={fullName} size={80} />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-[var(--color-texto-principal)]">
              {fullName}
            </h2>
            <p className="text-sm text-[var(--color-texto-secundario)]">
              {location}
            </p>
            {/* 4. NUEVO: Muestra el promedio general de calificaciones */}
            {reviews.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                    <span className="font-bold text-lg text-yellow-400">{averageRating.toFixed(1)}</span>
                    <StarRatingDisplay rating={averageRating} />
                    <span className="text-xs text-[var(--color-texto-secundario)]">
                        ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                    </span>
                </div>
            )}
          </div>
        </div>

        {userData.descripcion && (
          <p className="text-[var(--color-texto-principal)] pt-4 border-t border-white/10">
            {userData.descripcion}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 space-y-3">
          <h3 className="text-lg font-medium text-[var(--color-texto-principal)]">
            Reseñas Recibidas
          </h3>
          <ResenaList reviews={reviews} />
        </div>
      </Card>
    </div>
  );
};

export default PerfilModal;