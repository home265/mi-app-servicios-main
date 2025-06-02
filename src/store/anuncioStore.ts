// src/store/anuncioStore.ts
'use client';

import { create } from 'zustand';
import type { PlanId, CampaniaId } from '@/lib/constants/anuncios'; // Asegúrate que la ruta a tus tipos es correcta

/**
 * Estado temporal para flujo de creación/edición de la configuración de un anuncio:
 * selección de plan, tipo de campaña y cantidad de pantallas.
 */
interface AnuncioStoreState {
  planId: PlanId | null;
  campaniaId: CampaniaId | null; // CampaniaId puede ser opcional en un Anuncio, pero aquí lo mantenemos así por ahora
  screensCount: number | null;

  /** Guarda el plan seleccionado */
  setPlan: (planId: PlanId) => void;
  /** Guarda la campaña seleccionada */
  setCampania: (campaniaId: CampaniaId) => void;
  /** Guarda la cantidad de pantallas seleccionadas */
  setScreensCount: (count: number) => void;

  /**
   * Carga la configuración de un borrador existente en el store.
   * Usado cuando se retoma la edición de un borrador único.
   */
  loadDraftConfig: (config: {
    planId: PlanId;
    campaniaId: CampaniaId | undefined; // Hacemos campaniaId opcional aquí para coincidir con el tipo Anuncio
    screensCount: number;
  }) => void;

  /** Resetea el estado cambiando todo a null */
  reset: () => void;
}

export const useAnuncioStore = create<AnuncioStoreState>((set, _get) => ({
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
      campaniaId: config.campaniaId === undefined ? null : config.campaniaId, // Manejar undefined
      screensCount: config.screensCount,
    });
  },

  reset: () => {
    console.log('ANUNCIO_STORE: reset llamado');
    set({ planId: null, campaniaId: null, screensCount: null });
  },
}));
