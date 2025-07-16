// src/app/components/resenas/FormularioResenaDetallado.tsx
'use client';

import React, { useState } from 'react';
import { useUserStore } from '@/store/userStore';
import { createReview, type DetailedRatings, type ReviewContext } from '@/lib/services/reviewsService';
// 1. AÑADIR IMPORTS: Se importan las funciones para manejar notificaciones.
import {
  removeNotification,
  sendRatingRequest,
} from '@/lib/services/notificationsService';
import CriterioRating from './CriterioRating';
import Button from '@/app/components/ui/Button';

interface TargetUser {
  uid: string;
  collection: string;
}

interface FormularioResenaDetalladoProps {
  target: TargetUser;
  // 2. AÑADIR PROP: Se recibe el ID de la notificación original para poder eliminarla.
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
  originalNotifId, // 3. RECIBIR PROP
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

  // 4. LÓGICA DE ENVÍO ACTUALIZADA ---
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

      // Paso A: Crea la reseña en la base de datos.
      await createReview(target, author, context, ratings, comment.trim());

      // Paso B: Elimina la notificación "Calificar a..." que trajo al usuario a esta página.
      if (originalNotifId) {
        await removeNotification(author, originalNotifId);
      }

      // Paso C: Envía una nueva notificación a la otra persona para que califique de vuelta.
      // (Solo si se acaba de calificar a un usuario, para evitar el bucle).
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

      // Llama a onSubmitted solo después de que todo haya terminado con éxito.
      onSubmitted?.();

    } catch (err) {
      console.error('Error en el proceso de envío de reseña:', err);
      setError('Ocurrió un error inesperado al procesar tu reseña. Por favor, inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX (sin cambios) ---
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
        <label htmlFor="comment" className="block mb-2 font-medium text-[var(--color-texto-principal)]">
          Comentario adicional (opcional)
        </label>
        <textarea
          id="comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Describe tu experiencia..."
          className="w-full p-3 rounded-lg bg-[var(--color-input)] border border-[var(--color-borde-input)] text-[var(--color-texto-principal)] focus:ring-2 focus:ring-[var(--color-resalte)] focus:outline-none transition"
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <Button type="submit" disabled={!isFormValid} fullWidth>
        {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
      </Button>
    </form>
  );
};

export default FormularioResenaDetallado;