// src/app/(main)/planes/page.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    <div className="min-h-screen bg-fondo text-texto p-4">
  
  {/* --- Encabezado con posicionamiento relativo --- */}
  <div className="relative">
    {/* 1. Contenedor para posicionar el botón en la esquina */}
    <div className="absolute top-0 left-0">
      <BotonAyuda>
        <AyudaCrearEditarAnuncio fase="fase1a" />
      </BotonAyuda>
    </div>

    {/* 2. Título centrado y con más espacio inferior (mb-8) */}
    <h1 className="text-3xl font-bold text-primario mb-8 text-center">
      {existingDraft || borradorIdQueryParam ? 'Modifica tu Plan' : 'Elige tu Plan'}
    </h1>
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
            <Card
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between p-6
                           ${isSelected ? 'ring-2 ring-primario shadow-xl border-primario' : 'border-transparent'}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-center">{plan.name}</h2>
                <p className="mb-2">
                  <span className="font-medium">Precio:</span>{' '}
                  ${plan.priceARS.toLocaleString('es-AR')} ARS/mes
                </p>
                <p className="mb-2">
                  <span className="font-medium">Duración anuncio:</span> {plan.durationSeconds} segundos
                </p>
                <p className="mb-2">
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
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() =>
            router.push(existingDraft || borradorIdQueryParam ? '/mis-anuncios' : '/bienvenida')
          }
          className="text-texto-secundario hover:text-primario underline"
        >
          {existingDraft || borradorIdQueryParam ? 'Volver a Mis Anuncios' : 'Cancelar y Volver'}
        </button>
      </div>
    </div>
  );
}
