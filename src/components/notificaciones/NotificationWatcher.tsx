// src/app/components/common/NotificationWatcher.tsx
'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/userStore';
import { subscribeToNotifications } from '@/lib/services/notificationsService';
import type { Unsubscribe } from 'firebase/firestore';
import type { NotificationDoc } from '@/lib/services/notificationsService';

/**
 * Este componente no renderiza nada. Su única función es suscribirse
 * a las notificaciones del usuario logueado y actualizar el store de Zustand
 * con los contadores de notificaciones no leídas.
 */
export default function NotificationWatcher() {
  const currentUser = useUserStore((s) => s.currentUser);
  const originalRole = useUserStore((s) => s.originalRole);
  const setUnread = useUserStore((s) => s.setUnread);

  useEffect(() => {
    // Si no hay usuario, nos aseguramos de que los contadores estén en cero y salimos.
    if (!currentUser || !originalRole) {
      setUnread('jobRequests', 0);
      setUnread('jobResponses', 0);
      return;
    }

    // Determinamos la colección del usuario según su rol original.
    const userIdentifier = {
      uid: currentUser.uid,
      collection:
        originalRole === 'prestador'
          ? 'prestadores'
          : originalRole === 'comercio'
          ? 'comercios'
          : 'usuarios_generales',
    };

    // Nos suscribimos a TODAS las notificaciones del usuario.
    const unsubscribe: Unsubscribe = subscribeToNotifications(
      userIdentifier,
      (allNotifications: NotificationDoc[]) => {
        // Calculamos las solicitudes de trabajo no leídas (para prestadores).
        const unreadJobRequests = allNotifications.filter(
          (n) => ['job_request', 'agreement_confirmed'].includes(n.type) && !n.read
        ).length;

        // Calculamos las respuestas a trabajos no leídas (para usuarios).
        const unreadJobResponses = allNotifications.filter(
          (n) => ['job_accept', 'contact_followup', 'rating_request'].includes(n.type) && !n.read
        ).length;

        // Actualizamos el store global con ambos contadores.
        setUnread('jobRequests', unreadJobRequests);
        setUnread('jobResponses', unreadJobResponses);
      }
    );

    // La función de limpieza de useEffect se encarga de cancelar la suscripción
    // cuando el componente se desmonta o el usuario cambia, evitando fugas de memoria.
    return () => {
      unsubscribe();
    };
  }, [currentUser, originalRole, setUnread]);

  // El componente no renderiza ningún elemento visual.
  return null;
}