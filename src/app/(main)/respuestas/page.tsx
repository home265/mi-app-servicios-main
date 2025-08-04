// src/app/(main)/respuestas/page.tsx
'use client';

import React from 'react'; // Se importa solo lo necesario de React
import { useRouter } from 'next/navigation';

import useNotificationHandler from '@/hooks/useNotificationHandler'; // <-- PASO 1: IMPORTAR EL HOOK

// Importar los componentes UI necesarios
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import AlertPopup from '@/app/components/common/AlertPopup';
import Logo from '@/app/components/ui/Logo';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import { useUserStore } from '@/store/userStore';

export default function RespuestasPage() {
  const router = useRouter(); // router se mantiene si la página lo necesita

  // --- PASO 2: LLAMAR AL HOOK PARA OBTENER TODA LA LÓGICA Y ESTADO ---
  const {
    notifications,
    processingNotifId,
    showContacto,
    selectedPrestador,
    showPerfilModal,
    perfilModalTarget,
    showAlert,
    alertMessage,
    onPrimaryAction,
    onSecondaryAction,
    onTertiaryAction,
    onAvatarClick,
    closeContactoPopup,
    closePerfilModal,
    closeAlertPopup,
    currentUser,
    userUid,
    userCollection,
  } = useNotificationHandler();

  // Se mantiene la guarda para redirigir si el usuario no es correcto
  const actingAs = useUserStore((s) => s.actingAs);
  if (!currentUser || actingAs !== 'user') {
    if (typeof window !== 'undefined') {
      router.replace('/bienvenida');
    }
    return null;
  }

  // --- PASO 3: EL JSX AHORA ES MUCHO MÁS LIMPIO Y SOLO RENDERIZA ---
  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-fondo">
      <div className="mb-6 mt-2">
        <Logo />
      </div>
      <h1 className="mb-6 text-2xl font-bold text-texto-principal">
        Mis Respuestas y Notificaciones
      </h1>

      <div className="w-full max-w-lg space-y-4">
        {notifications.length === 0 && (
          <p className="text-center text-texto-secundario py-8">
            No tienes respuestas o notificaciones nuevas.
          </p>
        )}

        {notifications.map((n) => (
          <NotificacionCard
            key={n.id}
            data={n}
            viewerMode="user"
            isProcessing={processingNotifId === n.id}
            onPrimary={() => onPrimaryAction(n)}
            onSecondary={() => onSecondaryAction(n)}
            onTertiary={() => onTertiaryAction(n)}
            onAvatarClick={n.type === 'contact_followup' ? undefined : () => onAvatarClick(n)}
          />
        ))}
      </div>

      {showContacto && selectedPrestador && userUid && (
        <ContactoPopup
          userUid={userUid}
          userCollection={userCollection}
          providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection}
          providerName={selectedPrestador.nombre}
          notifId={
            notifications.find(
              (n) =>
                n.type === 'job_accept' &&
                n.from?.uid === selectedPrestador.uid,
            )?.id ?? ''
          }
          onClose={closeContactoPopup}
        />
      )}

      {showPerfilModal && perfilModalTarget && (
        <PerfilModal
          target={perfilModalTarget}
          viewerMode="user"
          onClose={closePerfilModal}
        />
      )}

      {showAlert && (
        <AlertPopup
          isOpen={showAlert}
          title="Proceso Cancelado"
          message={alertMessage}
          buttonText="Entendido"
          onClose={closeAlertPopup}
        />
      )}
    </div>
  );
}