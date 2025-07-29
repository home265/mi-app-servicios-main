/*───────────────────────────────────────────────
  BotonCrearEditarAnuncio — estilo unificado
───────────────────────────────────────────────*/
'use client';

import React, { useState } from 'react';
import { useRouter }       from 'next/navigation';

import { useUserStore }    from '@/store/userStore';
import { useAnuncioStore } from '@/store/anuncioStore';
import { getExistingDraft } from '@/lib/services/anunciosService';

import { MegaphoneIcon }   from '@heroicons/react/24/outline';

export default function BotonCrearEditarAnuncio() {
  const router            = useRouter();
  const currentUser   = useUserStore(s => s.currentUser);
  const isLoadingAuth = useUserStore(s => s.isLoadingAuth);
  const resetAnuncio  = useAnuncioStore(s => s.reset);
  const [busy, setBusy] = useState(false);

  /*────────── navegación ──────────*/
  const handle = async () => {
    if (!currentUser || isLoadingAuth || busy) return;

    setBusy(true);
    try {
      const draft = await getExistingDraft(currentUser.uid);
      if (draft) {
        router.push(`/planes?borradorId=${draft.id}`);
      } else {
        resetAnuncio();
        router.push('/planes');
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
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handle(); }}
      onClick={handle}
      className="
        flex flex-col items-center justify-center
        aspect-square w-full max-w-[180px]
        rounded-xl shadow-md cursor-pointer
        transition active:scale-95 hover:shadow-lg
        bg-tarjeta border border-borde-tarjeta text-texto-principal
      "
    >
      {busy ? (
        <svg
          className="animate-spin h-10 w-10 mb-2 text-texto-principal"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.3 0 0 5.3 0 12h4z"
          />
        </svg>
      ) : (
        <MegaphoneIcon
          className="w-10 h-10 mb-2 text-texto-principal"
        />
      )}

      <span className="text-sm text-center px-2">
        {busy ? 'Procesando…' : 'Crear / Editar Anuncio'}
      </span>
    </div>
  );
}