// src/store/anuncioStore.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'; // Añadido persist, createJSONStorage y StateStorage
import type { PlanId, CampaniaId } from '@/lib/constants/anuncios'; // Asegúrate que la ruta a tus tipos es correcta

/**
 * Estado temporal para flujo de creación/edición de la configuración de un anuncio:
 * selección de plan, tipo de campaña y cantidad de pantallas.
 */
interface AnuncioStoreState {
  planId: PlanId | null;
  campaniaId: CampaniaId | null;
  screensCount: number | null;

  setPlan: (planId: PlanId) => void;
  setCampania: (campaniaId: CampaniaId) => void;
  setScreensCount: (count: number) => void;
  loadDraftConfig: (config: {
    planId: PlanId;
    campaniaId: CampaniaId | undefined;
    screensCount: number;
  }) => void;
  reset: () => void;
}

// Para evitar problemas con localStorage en SSR, definimos un storage dummy si no está disponible
const dummyStorage: StateStorage = {
  getItem: (_name: string): string | Promise<string | null> | null => {
    return null;
  },
  setItem: (_name: string, _value: string): void | Promise<void> => {
    // No hacer nada
  },
  removeItem: (_name: string): void | Promise<void> => {
    // No hacer nada
  },
};

export const useAnuncioStore = create(
  persist<AnuncioStoreState>(
    (set, _get) => ({ // _get sigue disponible si lo necesitas, aunque no se use aquí
      planId: null,
      campaniaId: null,
      screensCount: null,

      setPlan: (planId) => {
        console.log('ANUNCIO_STORE: setPlan llamado con:', planId);
        set({ planId });
      },

      setCampania: (campaniaId) => {
        console.log('ANUNCIO_STORE: setCampania llamado con:', campaniaId);
        set({ campaniaId });
      },

      setScreensCount: (screensCount) => {
        console.log('ANUNCIO_STORE: setScreensCount llamado con:', screensCount);
        set({ screensCount });
      },

      loadDraftConfig: (config) => {
        console.log('ANUNCIO_STORE: loadDraftConfig llamado con:', config);
        set({
          planId: config.planId,
          campaniaId: config.campaniaId === undefined ? null : config.campaniaId,
          screensCount: config.screensCount,
        });
      },

      reset: () => {
        console.log('ANUNCIO_STORE: reset llamado');
        set({ planId: null, campaniaId: null, screensCount: null });
      },
    }),
    {
      name: 'anuncio-creation-storage', // Nombre de la clave en localStorage (puedes cambiarlo)
      // Usar createJSONStorage para localStorage.
      // Para manejar el caso donde localStorage no esté disponible (ej. SSR, o modo incógnito estricto),
      // proveemos un fallback a un dummyStorage.
      storage: createJSONStorage(() => typeof window !== 'undefined' ? window.localStorage : dummyStorage),
    }
  )
);