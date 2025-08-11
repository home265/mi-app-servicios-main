// src/app/components/resenas/FormularioResenaDetallado.tsx
'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { createReview, type DetailedRatings, type ReviewContext } from '@/lib/services/reviewsService';
import {
  removeNotification,
  sendRatingRequest,
} from '@/lib/services/notificationsService';
import CriterioRating from './CriterioRating';
// El import del botón genérico ya no es necesario, lo eliminamos.
// import Button from '@/app/components/ui/Button';

interface TargetUser {
  uid: string;
  collection: string;
}

interface FormularioResenaDetalladoProps {
  target: TargetUser;
  originalNotifId: string | null;
  onSubmitted?: () => void;
}

// --- Definición de los Criterios de Calificación (sin cambios) ---
const CRITERIOS = {
  para_prestador: [
    { id: 'calidad', label: 'Calidad del trabajo' },
    { id: 'puntualidad', label: 'Puntualidad y cumplimiento' },
    { id: 'comunicacion', label: 'Claridad y comunicación' },
  ],
  para_usuario: [
    { id: 'claridad', label: 'Claridad del requerimiento' },
    { id: 'pago', label: 'Condiciones de pago' },
    { id: 'amabilidad', label: 'Amabilidad y trato' },
  ],
};

const FormularioResenaDetallado: React.FC<FormularioResenaDetalladoProps> = ({
  target,
  originalNotifId,
  onSubmitted,
}) => {
  // --- Estados y Store (sin cambios) ---
  const [ratings, setRatings] = useState<DetailedRatings>({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { currentUser, originalRole, actingAs } = useUserStore();

  const criteriosAMostrar =
    actingAs === 'user' ? CRITERIOS.para_prestador : CRITERIOS.para_usuario;

  const handleRatingChange = (criterionId: string, newRating: number) => {
    setRatings((prevRatings) => ({
      ...prevRatings,
      [criterionId]: newRating,
    }));
  };

  const isFormValid =
    criteriosAMostrar.every((c) => (ratings[c.id] ?? 0) > 0) && !isSubmitting;

  // --- LÓGICA DE ENVÍO (sin cambios) ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid || !currentUser || !originalRole) {
      setError('Por favor, completa todas las calificaciones antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const authorCollection =
        originalRole === 'prestador'
          ? 'prestadores'
          : originalRole === 'comercio'
          ? 'comercios'
          : 'usuarios_generales';
      
      const author = { uid: currentUser.uid, collection: authorCollection };
      const context: ReviewContext = actingAs === 'user' ? 'as_provider' : 'as_user';

      // --- INICIO DE LA SECUENCIA DE OPERACIONES ---

      await createReview(target, author, context, ratings, comment.trim());

      if (originalNotifId) {
        await removeNotification(author, originalNotifId);
      }

      if (context === 'as_user') {
        await sendRatingRequest({
          to: [{ uid: target.uid, collection: target.collection }],
          from: author,
          payload: {
            senderName: currentUser.nombre,
            avatarUrl: currentUser.selfieURL || '',
            description: `¡Has recibido una reseña de ${currentUser.nombre}! Ahora puedes calificarlo/a.`,
            timestamp: Date.now(),
          },
        });
      }
      
      // --- FIN DE LA SECUENCIA ---

      onSubmitted?.();

    } catch (err) {
      console.error('Error en el proceso de envío de reseña:', err);
      setError('Ocurrió un error inesperado al procesar tu reseña. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX (con el botón actualizado) ---
  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {criteriosAMostrar.map((criterion) => (
          <CriterioRating
            key={criterion.id}
            label={criterion.label}
            rating={ratings[criterion.id] || 0}
            onRatingChange={(newRating) =>
              handleRatingChange(criterion.id, newRating)
            }
          />
        ))}
      </div>

      <div>
        <label htmlFor="comment" className="block mb-2 font-medium text-texto-principal">
          Comentario adicional (opcional)
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe tu experiencia..."
          className="w-full p-3 rounded-lg bg-fondo border border-borde-tarjeta text-texto-principal focus:ring-2 focus:ring-primario focus:outline-none transition"
        />
      </div>

      {error && <p className="text-error text-sm text-center">{error}</p>}
      <div className="flex justify-center">
        <button
          type="submit"
          disabled={!isFormValid}
          className="btn-primary"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
        </button>
      </div>
    </form>
  );
};

export default FormularioResenaDetallado;