// src/app/(ads)/resumen/count/page.tsx
'use client';

import React, { useState, useEffect as ReactUseEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnuncioStore } from '@/store/anuncioStore';
import { planes, Plan, PlanId, CampaniaId } from '@/lib/constants/anuncios'; // CampaniaId y PlanId importados para claridad
import { updateAnuncio } from '@/lib/services/anunciosService';
import type { Anuncio } from '@/types/anuncio';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';

export default function CountSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const borradorId = searchParams.get('borradorId');

  // --- Valores del Store ---
  // Con 'persist', estos se hidratarán desde localStorage si existen.
  const planIdFromStore: PlanId | null = useAnuncioStore((state) => state.planId);
  const campaniaIdFromStore: CampaniaId | null = useAnuncioStore((state) => state.campaniaId);
  const screensCountFromStore: number | null = useAnuncioStore((state) => state.screensCount);
  const setScreensCountInStore = useAnuncioStore((state) => state.setScreensCount);

  // --- Estado Local ---
  const [isLoadingUpdate, setIsLoadingUpdate] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  // Inicializar selectedCount a null; se establecerá después del montaje y la validación del plan.
  const [selectedCount, setSelectedCount] = useState<number | null>(null);

  // --- Efecto de Montaje ---
  ReactUseEffect(() => {
    setMounted(true); // Se activa solo en el cliente después del montaje inicial
  }, []);

  // --- Derivar Plan Seleccionado (después del montaje) ---
  // Será undefined si planIdFromStore es null o inválido, o si no está montado.
  const plan: Plan | undefined = mounted && planIdFromStore
    ? planes.find((p) => p.id === planIdFromStore)
    : undefined;

  // --- Efecto Principal para Redirección e Inicialización de selectedCount ---
  ReactUseEffect(() => {
    if (mounted) {
      if (!planIdFromStore) {
        console.warn('CountSelectionPage (cliente): No hay planId. Redirigiendo a /planes...');
        router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
        return; // Salir temprano para evitar más lógica si redirige
      }
      
      if (!campaniaIdFromStore) {
        console.warn('CountSelectionPage (cliente): No hay campaniaId. Redirigiendo a /campanas...');
        router.replace(borradorId ? `/campanas?borradorId=${borradorId}&planId=${planIdFromStore}` : `/campanas?planId=${planIdFromStore}`);
        return; // Salir temprano
      }

      if (!plan) { // planIdFromStore existe pero no es un ID de plan válido
        console.warn(`CountSelectionPage (cliente): planId "${planIdFromStore}" inválido. Redirigiendo a /planes...`);
        router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
        return; // Salir temprano
      }

      // Si llegamos aquí, planId, campaniaId y plan son válidos.
      // Procedemos a inicializar/ajustar selectedCount y actualizar el store si es necesario.
      const maxImagenes = plan.maxImages;
      let countParaEstadoYStore: number;

      if (screensCountFromStore === null || screensCountFromStore === undefined) {
        countParaEstadoYStore = 1; // Default a 1 si no está establecido en el store
      } else if (screensCountFromStore > maxImagenes) {
        countParaEstadoYStore = maxImagenes; // Limitar al máximo del plan
      } else if (screensCountFromStore < 1) {
        countParaEstadoYStore = 1; // Asegurar al menos 1
      } else {
        countParaEstadoYStore = screensCountFromStore; // Usar el valor del store si es válido
      }
      
      setSelectedCount(countParaEstadoYStore);

      // Actualizar el store solo si el valor efectivo es diferente del que está en el store,
      // o si el valor del store era null/undefined o estaba fuera de los límites.
      if (countParaEstadoYStore !== screensCountFromStore) {
        setScreensCountInStore(countParaEstadoYStore);
      }
    }
  }, [mounted, planIdFromStore, campaniaIdFromStore, plan, borradorId, router, screensCountFromStore, setScreensCountInStore]);


  const handleCountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (plan) { // Asegurarse que 'plan' está definido
      const newCount = parseInt(event.target.value, 10);
      // Validar que esté dentro de los límites del plan (1 a plan.maxImages)
      if (newCount >= 1 && newCount <= plan.maxImages) {
        setSelectedCount(newCount);
        // Opcional: Actualizar el store inmediatamente si se desea,
        // o esperar al 'handleNext' para hacerlo. Por ahora, solo estado local.
      }
    }
  };

  const handlePrevious = () => {
    // Navegar de vuelta a resumen, llevando el contexto necesario
    if (planIdFromStore && campaniaIdFromStore) {
      router.push(`/resumen?planId=${planIdFromStore}&campaniaId=${campaniaIdFromStore}${borradorId ? `&borradorId=${borradorId}` : ''}`);
    } else {
      // Fallback si faltan datos (no debería ocurrir si la lógica de redirección funciona)
      router.push('/planes');
    }
  };

  const handleNext = async () => {
    if (selectedCount === null || !plan || !campaniaIdFromStore) { // Chequeo adicional
      console.error('CountSelectionPage: No se puede continuar, faltan datos (selectedCount, plan o campaniaId).');
      return;
    }

    setIsLoadingUpdate(true);
    try {
      // Actualizar el store con el selectedCount final antes de navegar
      setScreensCountInStore(selectedCount);

      if (borradorId) {
        const updateData: Partial<Anuncio> = {
          maxScreens: selectedCount, // 'maxScreens' en el Anuncio parece ser el equivalente a 'screensCount' del store
        };
        await updateAnuncio(borradorId, updateData);
        console.log('CountSelectionPage: Borrador actualizado con la cantidad de imágenes.');
      }
      
      // Navegar al editor
      // Si es un borrador existente, ir a la edición de ese borrador.
      // Si es uno nuevo, se podría ir a una ruta como /editor/nuevo o /editor sin ID
      // y el editor se encargaría de crear el anuncio con los datos del store.
      // Por ahora, asumimos que si hay borradorId vamos a editar, si no, a crear nuevo.
      if (borradorId) {
        router.push(`/editor/${borradorId}`);
      } else {
        router.push('/editor/nuevo'); // O la ruta que corresponda para un nuevo anuncio
      }

    } catch (error) {
      console.error('CountSelectionPage: Error al actualizar el borrador o continuar:', error);
    } finally {
      setIsLoadingUpdate(false);
    }
  };
  
  // --- Estado de Carga ---
  // Muestra loader si:
  // - El componente no se ha montado.
  // - El 'plan' no se ha podido determinar (implica que planIdFromStore no está listo o es inválido).
  // - campaniaIdFromStore no está (para asegurar contexto completo).
  // - selectedCount aún no se ha inicializado (es null).
  if (!mounted || !plan || !campaniaIdFromStore || selectedCount === null) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando configuración de imágenes...</p>
      </div>
    );
  }

  // Si llegamos aquí, 'plan' está definido y 'selectedCount' tiene un valor numérico.
  const durationPerImage = plan.durationSeconds / selectedCount;

  return (
    <div className="min-h-screen bg-fondo text-texto p-4 flex flex-col items-center">
      
      {/* --- ENCABEZADO RESPONSIVO CON TÍTULO E ICONO ALINEADOS --- */}
      <div className="flex flex-col sm:flex-row items-center justify-center text-center gap-4 w-full mb-10 mt-8">
        <h1 className="text-3xl font-bold text-primario">
          ¿Cuántas Imágenes por Pantalla?
        </h1>
        <BotonAyuda>
          <AyudaCrearEditarAnuncio fase="fase1d" />
        </BotonAyuda>
      </div>

      <p className="text-center text-texto-secundario mb-8 max-w-xl">
        Para tu plan <span className="font-semibold">{plan.name}</span>, puedes elegir hasta{' '}
        <span className="font-semibold">{plan.maxImages}</span> imágenes que rotarán.
        Cada imagen se mostrará por aproximadamente{' '}
        <span className="font-semibold">
          {durationPerImage.toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})}
        </span> segundos.
      </p>

      {/* --- TARJETA PRINCIPAL CON ESTILO 3D --- */}
      <div className="w-full max-w-xl p-6 rounded-2xl bg-tarjeta
                     shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
        <div className="space-y-6">
          <label htmlFor="image-count-slider" className="block text-lg font-medium text-texto-principal text-center">
            Imágenes seleccionadas: <span className="text-2xl font-bold text-primario">{selectedCount}</span>
          </label>
          
          {/* --- SLIDER CON ESTILO 3D "HUNDIDO" --- */}
          <div className="relative h-2 w-full rounded-full bg-fondo shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
            <input
              id="image-count-slider"
              type="range"
              min="1"
              max={plan.maxImages}
              value={selectedCount}
              onChange={handleCountChange}
              className="absolute w-full h-full appearance-none bg-transparent cursor-pointer accent-primario"
              disabled={isLoadingUpdate}
            />
          </div>

          <div className="text-center pt-2">
            <p className="text-texto-secundario">
              <span className="font-medium text-texto-principal">
                Duración por imagen:
              </span>{' '}
              {durationPerImage.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })}{' '}
              segundos
            </p>
            <p className="text-sm text-texto-secundario opacity-80">
              Máximo permitido para tu plan ({plan.name}): {plan.maxImages} imágenes.
            </p>
            <p className="text-xs text-texto-secundario opacity-70 mt-1">
              Duración total del anuncio por ciclo de imágenes: {plan.durationSeconds} segundos.
            </p>
          </div>
        </div>
      </div>

      {/* --- BOTONES DE NAVEGACIÓN CON ESTILO 3D --- */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl mt-8">
        <button
          onClick={handlePrevious}
          disabled={isLoadingUpdate}
          className="
            inline-flex items-center justify-center
            px-4 py-2 rounded-xl text-sm font-medium text-texto-secundario
            bg-tarjeta
            shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
            transition-all duration-150 ease-in-out
            hover:text-primario hover:brightness-110
            active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Anterior
        </button>
        <button
          onClick={handleNext}
          disabled={isLoadingUpdate}
          className="btn-primary w-full sm:w-auto flex-grow"
        >
          {isLoadingUpdate ? 'Guardando...' : 'Continuar al Editor'}
        </button>
      </div>
    </div>
  );
}