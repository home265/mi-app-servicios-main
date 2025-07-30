/*───────────────────────────────────────────────
  BotonCrearEditarAnuncio — estilo unificado
───────────────────────────────────────────────*/
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useUserStore } from '@/store/userStore';
import { useAnuncioStore } from '@/store/anuncioStore';
import { getExistingDraft } from '@/lib/services/anunciosService';

import { MegaphoneIcon } from '@heroicons/react/24/outline';

export default function BotonCrearEditarAnuncio() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const isLoadingAuth = useUserStore((s) => s.isLoadingAuth);
  const resetAnuncio = useAnuncioStore((s) => s.reset);
  const [busy, setBusy] = useState(false);

  // ---- AÑADIDO ----
  // Función para navegar con retraso y permitir que se vea la animación de clic.
  const delayedNavigate = (path: string) => {
    setTimeout(() => {
      // Navegamos después de 150ms. No es necesario cambiar 'busy' a false
      // porque el componente se desmontará al navegar.
      router.push(path);
    }, 150);
  };

  /*────────── navegación ──────────*/
  const handle = async () => {
    if (!currentUser || isLoadingAuth || busy) return;

    setBusy(true);
    try {
      const draft = await getExistingDraft(currentUser.uid);
      if (draft) {
        // ---- MODIFICADO ----
        delayedNavigate(`/planes?borradorId=${draft.id}`);
      } else {
        resetAnuncio();
        // ---- MODIFICADO ----
        delayedNavigate('/planes');
      }
    } catch (e) {
      console.error('Error navegando a planes:', e);
      setBusy(false);
    }
  };

  /*────────── UI ──────────*/
  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handle();
      }}
      onClick={handle}
      // ---- MODIFICADO ----
      // Se reemplazaron todas las clases por las del BotonDeAccion para unificar el estilo.
      className="
        relative flex flex-col items-center justify-center
        aspect-square w-full max-w-[180px]
        rounded-xl text-texto-principal
        bg-tarjeta
        transition-all duration-150 ease-in-out

        /* Efecto de Relieve (Outset) */
        shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]

        /* Efecto al pasar el mouse (Hover) */
        hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]

        /* Efecto al Presionar (Active) */
        active:scale-95 active:brightness-90
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
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
        {busy ? 'Procesando…' : 'Crear / Editar Anuncio'}
      </span>
    </div>
  );
}