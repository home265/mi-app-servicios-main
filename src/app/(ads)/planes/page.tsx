// src/app/(main)/planes/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Card from '@/app/components/ui/Card';
import { planes, PlanId } from '@/lib/constants/anuncios';
import { useAnuncioStore } from '@/store/anuncioStore';
import { useUserStore } from '@/store/userStore';
import { getExistingDraft, getAnuncioById } from '@/lib/services/anunciosService';
import type { Anuncio } from '@/types/anuncio';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';

export default function PlanesPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* ---------- stores ---------- */
  const setPlanInStore         = useAnuncioStore((s) => s.setPlan);
  const loadDraftConfigInStore = useAnuncioStore((s) => s.loadDraftConfig);
  const resetAnuncioStore      = useAnuncioStore((s) => s.reset);
  const currentPlanIdFromStore = useAnuncioStore((s) => s.planId);

  const currentUser   = useUserStore((s) => s.currentUser);
  const isLoadingAuth = useUserStore((s) => s.isLoadingAuth);

  /* ---------- local state ---------- */
  const [existingDraft, setExistingDraft]   = useState<Anuncio | null | undefined>(undefined);
  const [isLoadingData, setIsLoadingData]   = useState<boolean>(true);
  const [borradorIdQueryParam, setBorradorIdQueryParam] = useState<string | null>(null);

  /* ---------- carga inicial ---------- */
  const performInitialDataLoad = useCallback(
    async (isMountedChecker: () => boolean) => {
      if (!currentUser) {
        if (isMountedChecker()) setIsLoadingData(false);
        return;
      }

      if (isMountedChecker()) setIsLoadingData(true);

      try {
        const borradorIdFromUrl = searchParams.get('borradorId');
        if (isMountedChecker()) setBorradorIdQueryParam(borradorIdFromUrl);

        let draftToLoad: Anuncio | null = null;

        if (borradorIdFromUrl) {
          console.log(`PlanesPage: Cargando borrador específico desde URL: ${borradorIdFromUrl}`);
          draftToLoad = await getAnuncioById(borradorIdFromUrl);
          if (draftToLoad && draftToLoad.creatorId !== currentUser.uid) {
            console.error('PlanesPage: Intento de cargar un borrador que no pertenece al usuario actual.');
            if (isMountedChecker()) {
              setExistingDraft(null);
              resetAnuncioStore();
            }
            draftToLoad = null;
          } else if (!draftToLoad) {
            console.warn(`PlanesPage: No se encontró el borrador con ID ${borradorIdFromUrl}.`);
          }
        } else {
          console.log('PlanesPage: No hay borradorId en URL, buscando borrador único del usuario.');
          draftToLoad = await getExistingDraft(currentUser.uid);
        }

        if (isMountedChecker()) {
          if (draftToLoad) {
            setExistingDraft(draftToLoad);
            loadDraftConfigInStore({
              planId: draftToLoad.plan,
              campaniaId: draftToLoad.campaniaId,
              screensCount: draftToLoad.maxScreens,
            });
          } else {
            setExistingDraft(null);

            /* ──────────────────────────────────────────────────────────────
               Sólo reseteamos el store si el usuario NO ha hecho ya
               una selección (planId y campaniaId siguen en null).
               Esto evita borrar el plan elegido mientras performInitialDataLoad
               termina en segundo plano.
            ────────────────────────────────────────────────────────────── */
            const { planId, campaniaId } = useAnuncioStore.getState();
            if (planId === null && campaniaId === null) {
              resetAnuncioStore();
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar el borrador existente en PlanesPage:', error);
        if (isMountedChecker()) {
          setExistingDraft(null);
          const { planId, campaniaId } = useAnuncioStore.getState();
          if (planId === null && campaniaId === null) {
            resetAnuncioStore();
          }
        }
      } finally {
        if (isMountedChecker()) setIsLoadingData(false);
      }
    },
    [currentUser, loadDraftConfigInStore, searchParams, resetAnuncioStore]
  );

  useEffect(() => {
    let isMounted = true;
    const isMountedChecker = () => isMounted;

    if (!isLoadingAuth) {
      if (currentUser) {
        performInitialDataLoad(isMountedChecker);
      } else if (isMounted) {
        setIsLoadingData(false);
        setExistingDraft(null);
        resetAnuncioStore();
      }
    } else if (isMounted) {
      setIsLoadingData(true);
    }

    return () => {
      isMounted = false;
    };
  }, [isLoadingAuth, currentUser, performInitialDataLoad, resetAnuncioStore]);

  /* ---------- selección de plan ---------- */
  const handleSelectPlan = (selectedPlanId: PlanId) => {
    setPlanInStore(selectedPlanId);

    const draftIdToCarryForward = existingDraft?.id || borradorIdQueryParam;
    const draftPart = draftIdToCarryForward ? `&borradorId=${draftIdToCarryForward}` : '';

    router.push(`/campanas?planId=${selectedPlanId}${draftPart}`);
  };

  /* ---------- loading ---------- */
  if (isLoadingAuth || isLoadingData) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando planes...</p>
      </div>
    );
  }

  const planSeleccionadoId = currentPlanIdFromStore;

  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-fondo text-texto">
      {/* 1. Contenedor principal que limita y centra todo el contenido */}
      <div className="w-full max-w-5xl mx-auto px-4 py-8">

        {/* --- Encabezado con posicionamiento relativo --- */}
        <div className="relative">
  {/* Título centrado y sin el ícono */}
  <h1 className="text-3xl font-bold text-primario mb-8 text-center">
    {existingDraft || borradorIdQueryParam ? 'Modifica tu Plan' : 'Elige tu Plan'}
  </h1>

  {/* Botón de ayuda posicionado en la esquina derecha */}
  <div className="absolute top-0 right-0">
    <BotonAyuda>
      <AyudaCrearEditarAnuncio fase="fase1a" />
    </BotonAyuda>
  </div>
</div>

        {(existingDraft || borradorIdQueryParam) && (
          <p className="text-center text-texto-secundario mb-8">
            Estás modificando la configuración de tu borrador existente.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.map((plan) => {
            const isSelected = plan.id === planSeleccionadoId;
            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`
                  w-full rounded-2xl p-6 flex flex-col justify-between cursor-pointer
                  transition-all duration-200
                  bg-tarjeta
                  shadow-[4px_4px_8px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
                  hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(249,243,217,0.08)] hover:-translate-y-1
                  active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]

                  ${isSelected ? '!border-2 !border-primario !shadow-xl ring-2 ring-primario' : ''}
                `}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-center text-texto-principal">{plan.name}</h2>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Precio:</span>{' '}
                    ${plan.priceARS.toLocaleString('es-AR')} ARS/mes
                  </p>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Duración anuncio:</span> {plan.durationSeconds} segundos
                  </p>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Imágenes:</span> hasta {plan.maxImages}
                  </p>
                  <p className="text-sm text-texto-secundario">
                    <span className="font-medium">Se mostrará:</span>{' '}
                    {plan.displayMode === 'inicio' ? 'Al inicio de la app' : 'En secciones aleatorias'}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-4 pt-2 border-t border-primario/30 text-center">
                    <span className="text-sm font-semibold text-primario">Plan Actual</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center mt-12">
  <button
    onClick={() =>
      router.push(existingDraft || borradorIdQueryParam ? '/mis-anuncios' : '/bienvenida')
    }
    className="
      inline-flex items-center justify-center
      px-4 py-2 rounded-xl text-sm font-medium text-texto-secundario
      bg-tarjeta
      shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
      transition-all duration-150 ease-in-out
      hover:text-primario hover:brightness-110
      active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
    "
  >
    {existingDraft || borradorIdQueryParam ? 'Volver a Mis Anuncios' : 'Cancelar y Volver'}
  </button>
</div>
      </div>
    </div>
  );
}
