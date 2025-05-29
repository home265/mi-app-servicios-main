// src/app/(main)/bienvenida/components/BotonCrearEditarAnuncio.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore'; //
import { getExistingDraft } from '@/lib/services/anunciosService'; //
import { useAnuncioStore } from '@/store/anuncioStore'; //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button'; //
import { MegaphoneIcon } from '@heroicons/react/24/outline'; // O el ícono que prefieras

export default function BotonCrearEditarAnuncio() {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser); //
  const isLoadingAuth = useUserStore((state) => state.isLoadingAuth); //
  const resetAnuncioStore = useAnuncioStore((state) => state.reset); //
  const [isProcessing, setIsProcessing] = useState(false);

  const handleNavigation = async () => {
    if (!currentUser || isLoadingAuth) {
      return;
    }

    setIsProcessing(true);
    try {
      const existingDraft = await getExistingDraft(currentUser.uid); //

      if (existingDraft) {
        // Ya tiene un borrador, dirigir a editar (comenzando por Planes para cambiar configuración)
        // PlanesPage se encargará de cargar la configuración del borrador en anuncioStore.
        router.push(`/planes?borradorId=${existingDraft.id}`);
      } else {
        // No tiene borrador, iniciar flujo de creación nuevo.
        // Reseteamos el store de anuncio por si quedó alguna configuración de un flujo anterior.
        resetAnuncioStore(); //
        router.push('/planes');
      }
    } catch (error) {
      console.error("Error al verificar borrador existente o navegar:", error);
      // Aquí podrías mostrar una notificación al usuario
      setIsProcessing(false); // Permitir reintentar si hubo error
    }
    // No es necesario setIsProcessing(false) aquí si la navegación tiene éxito,
    // pero por si acaso, y para ser consistentes con el catch.
    // Si el componente sigue montado después de router.push (poco probable en navegaciones completas),
    // sería bueno resetearlo.
    // Sin embargo, como es probable que se desmonte, no es crítico.
    // Si se queda en la misma página y la navegación falla, sí es importante.
  };

  // Si necesitas un ícono específico para "Crear Anuncio" diferente al del botón general,
  // puedes definirlo aquí o pasarlo como prop.
  // Para este ejemplo, usaré MegaphoneIcon como en tu BienvenidaPage original.
  const IconComponent = MegaphoneIcon; 
  const label = "Crear / Editar Anuncio";


  return (
    <div
      onClick={handleNavigation}
      className="
        flex flex-col items-center justify-center
        p-4 aspect-square
        bg-transparent 
        border-2 border-borde-tarjeta 
        rounded-lg shadow-md 
        cursor-pointer 
        hover:bg-tarjeta/10 
        transition-all duration-200 ease-in-out
      "
      role="button"
      tabIndex={0}
      aria-disabled={isProcessing || isLoadingAuth || !currentUser}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleNavigation();
        }
      }}
    >
      {isProcessing ? (
        <svg className="animate-spin h-12 w-12 text-primario mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <IconComponent className="w-12 h-12 mb-2 text-primario" />
      )}
      <span className="text-sm font-medium text-texto-principal text-center">
        {isProcessing ? 'Procesando...' : label}
      </span>
    </div>
  );
}