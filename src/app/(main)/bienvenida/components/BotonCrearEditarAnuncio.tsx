'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { useUserStore } from '@/store/userStore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';

export default function BotonGestionSuscripcion() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const isLoadingAuth = useUserStore((s) => s.isLoadingAuth);
  const [busy, setBusy] = useState(false);

  // Navegación con retraso para animación
  const delayedNavigate = (path: string) => {
    setTimeout(() => {
      router.push(path);
    }, 150);
  };

  const handle = async () => {
    if (!currentUser || isLoadingAuth || busy) return;
    setBusy(true);

    try {
      // Consulta la card del usuario
      const page = await getPaginaAmarilla(currentUser.uid);

      if (page && page.isActive) {
        // Si ya tiene suscripción activa, va a editar la plantilla
        delayedNavigate(`/paginas-amarillas/editar/${currentUser.uid}`);
      } else {
        // Si no, va a seleccionar plan (primer mes gratis o suscribirse)
        delayedNavigate('/paginas-amarillas/planes');
      }
    } catch (error) {
      console.error('Error gestionando suscripción:', error);
      setBusy(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handle();
      }}
      onClick={handle}
      className="
        relative flex flex-col items-center justify-center
        aspect-square w-full max-w-[180px]
        rounded-xl text-texto-principal
        bg-tarjeta
        transition-all duration-150 ease-in-out
        shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
        hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]
        active:scale-95 active:brightness-90 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
      "
    >
      {busy ? (
        <svg
          className="animate-spin h-10 w-10 mb-2 text-texto-principal"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
          />
        </svg>
      ) : (
        <MegaphoneIcon className="w-10 h-10 mb-2 text-texto-principal" />
      )}

      <span className="text-sm text-center px-2">
        {busy ? 'Procesando…' : 'Configurar Suscripción'}
      </span>
    </div>
  );
}
