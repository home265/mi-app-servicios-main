'use client';
import React, { useState } from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { createReview, ReviewContext } from '@/lib/services/reviewsService';
import { sendRatingRequest } from '@/lib/services/notificationsService';
import { useUserStore } from '@/store/userStore';

interface ResenaFormProps {
  target: { uid: string; collection: string };
  onSubmitted?: () => void;
}

export default function ResenaForm({ target, onSubmitted }: ResenaFormProps) {
  /* ------------------- store ------------------- */
  const currentUser   = useUserStore((s) => s.currentUser);
  const originalRole  = useUserStore((s) => s.originalRole);
  const actingAs      = useUserStore((s) => s.actingAs);

  /* ------------------- estado ------------------ */
  const [rating, setRating]       = useState(0);
  const [comment, setComment]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  /* ------------------- submit ------------------ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !originalRole || rating < 1) return;

    setSubmitting(true);
    try {
      const authorCollection =
        originalRole === 'prestador'
          ? 'prestadores'
          : originalRole === 'comercio'
          ? 'comercios'
          : 'usuarios_generales';

      const context: ReviewContext = actingAs === 'user' ? 'as_provider' : 'as_user';

      /* 1️⃣  Guarda la reseña */
      await createReview(
        target,
        { uid: currentUser.uid, collection: authorCollection },
        context,
        rating,
        comment,
      );

      /* 2️⃣  Notifica al destinatario (rating_request) */
      await sendRatingRequest({
        to: [{ uid: target.uid, collection: target.collection }],
        from: { uid: currentUser.uid, collection: authorCollection },
        payload: {
          senderName: currentUser.nombre,
          avatarUrl: currentUser.selfieURL,
          description: '¡Has recibido una reseña!',
          timestamp: Date.now(),
        },
      });

      /* 3️⃣  Limpia estado y avisa al padre */
      setRating(0);
      setComment('');
      onSubmitted?.();
    } catch (err) {
      console.error('Error creando reseña o notificando:', err);
    } finally {
      setSubmitting(false);
    }
  }

  /* ------------------- UI ---------------------- */
  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Puntuación */}
        <div>
          <label className="block mb-1 font-medium">Puntuación:</label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                type="button"
                key={i}
                onClick={() => setRating(i)}
                className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}
              >
                <StarSolid className="h-6 w-6" />
              </button>
            ))}
          </div>
        </div>

        {/* Comentario */}
        <div>
          <label className="block mb-1 font-medium">Comentario:</label>
          <textarea
            className="w-full border border-[var(--color-borde-input)] rounded p-2 text-sm bg-[var(--color-input)] text-[var(--color-texto-principal)]"
            rows={4}
            spellCheck="true"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Escribe tu reseña..."
          />
        </div>

        {/* Botón enviar */}
        <Button type="submit" disabled={submitting || rating < 1}>
          {submitting ? 'Enviando...' : 'Enviar reseña'}
        </Button>
      </form>
    </Card>
  );
}
