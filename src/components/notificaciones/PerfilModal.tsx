'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon, StarIcon } from '@heroicons/react/24/solid';
import type { DocumentData } from 'firebase/firestore';

import Avatar from '@/components/common/Avatar';
import Card from '@/components/ui/Card';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/components/ui/Button';
import { ResenaList } from '@/components/resenas/ResenaList';

import { getUserData } from '@/lib/firebase/authHelpers';
import { getReviews, type ReviewData } from '@/lib/services/reviewsService';

/* ------------------------------------------------------------------ */
// Tipos locales (sin cambios)
/* ------------------------------------------------------------------ */
interface PerfilModalProps {
  target: { uid: string; collection: string };
  viewerMode: 'user' | 'provider';
  onClose: () => void;
}

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

// --- Componente de Ayuda para mostrar estrellas (Estilos actualizados) ---
const StarRatingDisplay: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
            <StarIcon key={i} className={`h-4 w-4 ${rating >= i ? 'text-primario' : 'text-texto-secundario opacity-50'}`} />
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
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica de carga de datos (sin cambios)
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

        if (fetchedReviews.length > 0) {
          const total = fetchedReviews.reduce((sum, rev) => sum + rev.overallRating, 0);
          setAverageRating(total / fetchedReviews.length);
        } else {
          setAverageRating(0);
        }

      } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [target, viewerMode]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="text-texto-principal text-lg animate-pulse">Cargando perfil...</div>
      </div>
    );
  }

  if (!userData) return null;

  const fullName = `${userData.nombre} ${userData.apellido}`;
  const location = userData.localidad
    ? `${userData.localidad.nombre}, ${userData.localidad.provinciaNombre}`
    : '';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pt-20 anim-fadeIn">
      <Card className="relative w-full  max-w-lg max-h-[90vh] overflow-y-auto space-y-4 p-5 anim-zoomIn">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full text-texto-secundario hover:bg-white/10 hover:text-texto-principal transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-4">
          <Avatar selfieUrl={userData.selfieURL} nombre={fullName} size={80} />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-texto-principal">
              {fullName}
            </h2>
            <p className="text-sm text-texto-secundario">
              {location}
            </p>
            {reviews.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                    <span className="font-bold text-lg text-primario">{averageRating.toFixed(1)}</span>
                    <StarRatingDisplay rating={averageRating} />
                    <span className="text-xs text-texto-secundario">
                        ({reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'})
                    </span>
                </div>
            )}
          </div>
        </div>

        {userData.descripcion && (
          <p className="text-texto-principal pt-4 border-t border-borde-tarjeta">
            {userData.descripcion}
          </p>
        )}

        <div className="pt-4 border-t border-borde-tarjeta space-y-3">
          <h3 className="text-lg font-medium text-texto-principal">
            Reseñas Recibidas
          </h3>
          <ResenaList reviews={reviews} />
        </div>
      </Card>
    </div>
  );
};

export default PerfilModal;