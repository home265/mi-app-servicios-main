'use client';
import React, { useEffect, useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';               // ⬅️ NUEVO
import Button from '@/app/components/ui/Button';
import { ResenaList } from '@/app/components/resenas/ResenaList';
import { getUserData } from '@/lib/firebase/authHelpers';
import { getReviews, Review } from '@/lib/services/reviewsService';
import type { DocumentData } from 'firebase/firestore';

/* ------------------------------------------------------------------ */
interface PerfilModalProps {
  target: { uid: string; collection: string };
  viewerMode: 'user' | 'provider';
  onClose: () => void;
}
/* ------------------------------------------------------------------ */

const PerfilModal: React.FC<PerfilModalProps> = ({
  target,
  viewerMode,
  onClose,
}) => {
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  /* ---------- carga datos ---------- */
  useEffect(() => {
    async function load() {
      const result = await getUserData(target.uid);
      if (result) setUserData(result.data);

      const context = viewerMode === 'provider' ? 'as_user' : 'as_provider';
      const revs = await getReviews(target, context);
      setReviews(revs);
    }
    load();
  }, [target, viewerMode]);

  if (!userData) return null;

  const fullName = `${userData.nombre} ${userData.apellido}`;
  const location = userData.localidad
    ? `${userData.localidad.nombre}, ${userData.localidad.provinciaNombre}`
    : '';

  /* ---------------------------------------------------------------- */

  return (
    /* -------- overlay -------- */
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      {/* -------- tarjeta principal -------- */}
      <Card className="w-96 max-h-[90vh] overflow-y-auto space-y-4">
        {/* botón cierre */}
        <Button
          variant="ghost"
          onClick={onClose}
          className="self-end text-xl leading-none text-[var(--color-texto-secundario)]"
        >
          &times;
        </Button>

        {/* avatar + nombre + ubicación */}
        <div className="flex items-center space-x-4">
          <Avatar selfieUrl={userData.selfieURL} nombre={fullName} size={80} />
          <div>
            <h2 className="text-xl font-semibold text-[var(--color-texto-principal)]">
              {fullName}
            </h2>
            <p className="text-sm text-[var(--color-texto-secundario)]">
              {location}
            </p>
          </div>
        </div>

        {/* descripción */}
        {userData.descripcion && (
          <p className="text-[var(--color-texto-principal)]">
            {userData.descripcion}
          </p>
        )}

        {/* reseñas */}
        <h3 className="text-lg font-medium text-[var(--color-texto-principal)]">
          Reseñas
        </h3>
        <ResenaList reviews={reviews} />
      </Card>
    </div>
  );
};

export default PerfilModal;
