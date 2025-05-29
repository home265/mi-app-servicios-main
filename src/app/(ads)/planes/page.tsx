'use client';

import React, { useState, useCallback, useEffect } from 'react'; // Añadir useEffect
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/app/components/ui/Card'; //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { planes, Plan, PlanId } from '@/lib/constants/anuncios'; //
import { useAnuncioStore } from '@/store/anuncioStore'; //
import { useUserStore } from '@/store/userStore'; //
import { getExistingDraft, getAnuncioById } from '@/lib/services/anunciosService'; // Añadir getAnuncioById
import type { Anuncio } from '@/types/anuncio'; //

export default function PlanesPage() {
  const router = useRouter(); //
  const searchParams = useSearchParams(); //

  // Stores
  const setPlanInStore = useAnuncioStore((state) => state.setPlan); //
  const loadDraftConfigInStore = useAnuncioStore((state) => state.loadDraftConfig); //
  const resetAnuncioStore = useAnuncioStore((state) => state.reset); // Para limpiar si no hay borrador
  const currentPlanIdFromStore = useAnuncioStore((state) => state.planId); //
  const currentUser = useUserStore((state) => state.currentUser); //
  const isLoadingAuth = useUserStore((state) => state.isLoadingAuth); //

  const [existingDraft, setExistingDraft] = useState<Anuncio | null | undefined>(undefined); //
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); //
  const [borradorIdQueryParam, setBorradorIdQueryParam] = useState<string | null>(null); //

  // Ya no se necesita initialCheckDone con useEffect

  const performInitialDataLoad = useCallback(async (isMountedChecker: () => boolean) => {
    if (!currentUser) { //
      if (isMountedChecker()) setIsLoadingData(false);
      return;
    }

    if (isMountedChecker()) setIsLoadingData(true);

    try {
      const borradorIdFromUrl = searchParams.get('borradorId'); //
      if (isMountedChecker()) setBorradorIdQueryParam(borradorIdFromUrl);

      let draftToLoad: Anuncio | null = null;
      if (borradorIdFromUrl) {
        console.log(`PlanesPage: Cargando borrador específico desde URL: ${borradorIdFromUrl}`);
        draftToLoad = await getAnuncioById(borradorIdFromUrl); // Usar getAnuncioById para el ID específico
        if (draftToLoad && draftToLoad.creatorId !== currentUser.uid) {
            console.error("PlanesPage: Intento de cargar un borrador que no pertenece al usuario actual.");
            // Aquí podrías redirigir, mostrar un error, o anular draftToLoad
            if (isMountedChecker()) {
                setExistingDraft(null); // No permitir cargar borrador ajeno
                resetAnuncioStore(); // Limpiar store si se intentó cargar borrador incorrecto
            }
            draftToLoad = null; // Anular para no proceder con datos incorrectos
        } else if (!draftToLoad) {
            console.warn(`PlanesPage: No se encontró el borrador con ID ${borradorIdFromUrl}. Se intentará buscar un borrador general.`);
            // Opcionalmente, si no se encuentra por ID de URL, intentar buscar el único borrador del usuario
            // draftToLoad = await getExistingDraft(currentUser.uid);
        }
      } else {
        // Si no hay borradorId en la URL, intentar encontrar el borrador único del usuario
        console.log("PlanesPage: No hay borradorId en URL, buscando borrador único del usuario.");
        draftToLoad = await getExistingDraft(currentUser.uid); //
      }

      if (isMountedChecker()) {
        if (draftToLoad) { //
          setExistingDraft(draftToLoad); //
          loadDraftConfigInStore({ //
            planId: draftToLoad.plan, //
            campaniaId: draftToLoad.campaniaId, //
            screensCount: draftToLoad.maxScreens, //
          });
        } else { //
          setExistingDraft(null); //
          // Si no hay borrador (ni por URL ni el único del usuario), resetear el store para empezar de cero
          resetAnuncioStore(); //
        }
      }
    } catch (error) { //
      console.error("Error al cargar el borrador existente en PlanesPage:", error); //
      if (isMountedChecker()) {
        setExistingDraft(null); //
        resetAnuncioStore();
      }
    } finally { //
      if (isMountedChecker()) setIsLoadingData(false); //
    }
  }, [currentUser, loadDraftConfigInStore, searchParams, resetAnuncioStore]); //

  useEffect(() => {
    let isMounted = true;
    const isMountedChecker = () => isMounted;

    if (!isLoadingAuth) {
      if (currentUser) {
        // Solo llama a performInitialDataLoad si aún no se ha hecho
        // (esta condición ahora está dentro de performInitialDataLoad o se maneja con su useCallback)
        // El useCallback de performInitialDataLoad ahora depende de `searchParams`,
        // así que se regenerará si cambia.
        // Si ya se hizo el chequeo y los parámetros no cambian, no debería volver a ejecutar la lógica pesada.
        performInitialDataLoad(isMountedChecker);
      } else {
        // No hay usuario, no cargar datos de usuario
        if (isMounted) {
            setIsLoadingData(false);
            setExistingDraft(null);
            resetAnuncioStore(); // Si no hay usuario, limpiar el store de anuncio
        }
      }
    } else {
        if (isMounted) setIsLoadingData(true); // Sigue cargando autenticación
    }

    return () => {
      isMounted = false;
    };
  }, [isLoadingAuth, currentUser, performInitialDataLoad, resetAnuncioStore]); // performInitialDataLoad está en las dependencias


  const handleSelectPlan = (selectedPlanId: PlanId) => { //
    setPlanInStore(selectedPlanId); //
    // Usar el ID del borrador que se cargó (existingDraft.id si se encontró uno)
    // o el borradorIdQueryParam si no se cargó `existingDraft` pero el ID estaba en la URL.
    // Esto asegura que si se cargó un borrador por URL, ese ID se propague.
    const draftIdToCarryForward = existingDraft?.id || borradorIdQueryParam; //

    if (draftIdToCarryForward) { //
      router.push(`/campanas?borradorId=${draftIdToCarryForward}`); //
    } else { //
      router.push('/campanas'); //
    }
  };

  if (isLoadingAuth || isLoadingData) { //
    return ( //
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando planes...</p>
      </div>
    );
  }

  const planSeleccionadoId = currentPlanIdFromStore; //

  return ( //
    <div className="min-h-screen bg-fondo text-texto p-4">
      <h1 className="text-3xl font-bold text-primario mb-2 text-center">
        {existingDraft || borradorIdQueryParam ? 'Modifica tu Plan' : 'Elige tu Plan'} {/* */}
      </h1>
      {(existingDraft || borradorIdQueryParam) && ( //
        <p className="text-center text-texto-secundario mb-8">
          Estás modificando la configuración de tu borrador existente.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {planes.map((plan) => { //
          const isSelected = plan.id === planSeleccionadoId; //
          return ( //
            <Card //
              key={plan.id} //
              onClick={() => handleSelectPlan(plan.id)} //
              className={`cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between p-6
                           ${isSelected ? 'ring-2 ring-primario shadow-xl border-primario' : 'border-transparent'}`} //
              role="button" //
              tabIndex={0} //
              aria-pressed={isSelected} //
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-center">
                  {plan.name} {/* */}
                </h2>
                <p className="mb-2">
                  <span className="font-medium">Precio:</span> ${plan.priceARS.toLocaleString('es-AR')} ARS/mes {/* */}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Duración anuncio:</span> {plan.durationSeconds} segundos {/* */}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Imágenes:</span> hasta {plan.maxImages} {/* */}
                </p>
                <p className="text-sm text-texto-secundario">
                  <span className="font-medium">Se mostrará:</span>{' '} {/* */}
                  {plan.displayMode === 'inicio' ? 'Al inicio de la app' : 'En secciones aleatorias'} {/* */}
                </p>
              </div>
              {isSelected && ( //
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
          onClick={() => router.push(existingDraft || borradorIdQueryParam ? '/mis-anuncios' : '/bienvenida')} //
          className="text-texto-secundario hover:text-primario underline"
        >
          {existingDraft || borradorIdQueryParam ? 'Volver a Mis Anuncios' : 'Cancelar y Volver'} {/* */}
        </button>
      </div>
    </div>
  );
}