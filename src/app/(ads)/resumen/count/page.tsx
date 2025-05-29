'use client';
import React, { useState, useEffect as ReactUseEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { useAnuncioStore } from '@/store/anuncioStore';
import { planes, Plan } from '@/lib/constants/anuncios';
import { updateAnuncio } from '@/lib/services/anunciosService';
import type { Anuncio } from '@/types/anuncio';

export default function CountSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const borradorId = searchParams.get('borradorId');

  // ─── Hooks antes de cualquier return condicional ───
  const planIdFromStore = useAnuncioStore((state) => state.planId);
  const campaniaIdFromStore = useAnuncioStore((state) => state.campaniaId);
  const screensCountFromStore = useAnuncioStore((state) => state.screensCount);
  const setScreensCountInStore = useAnuncioStore((state) => state.setScreensCount);

  const [isLoadingUpdate, setIsLoadingUpdate] = useState<boolean>(false);

  // ─── Plan seleccionado ───
  const plan: Plan | undefined = planes.find((p) => p.id === planIdFromStore);

  // ─── Cálculo de límites y estado local ───
  const maxImagenesPermitidas = plan?.maxImages ?? 1;
  const countInicial = Math.min(screensCountFromStore ?? 1, maxImagenesPermitidas);
  const [localCount, setLocalCount] = useState<number>(countInicial);

  // ─── Redirecciones si faltan datos ───
  if (planIdFromStore === null) {
    if (typeof window !== 'undefined') {
      router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
    }
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
  }
  if (campaniaIdFromStore === null) {
    if (typeof window !== 'undefined') {
      router.replace(borradorId ? `/campanas?borradorId=${borradorId}` : '/campanas');
    }
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
  }
  if (!plan) {
    if (typeof window !== 'undefined') {
      router.replace(
        borradorId
          ? `/planes?borradorId=${borradorId}&error=plan_invalido`
          : '/planes?error=plan_invalido'
      );
    }
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Error: Configuración de plan inválida. Redirigiendo...</p>
      </div>
    );
  }

  // ─── Sincronizar cuando cambie el valor en el store ───
  ReactUseEffect(() => {
    if (screensCountFromStore != null) {
      const val = Math.min(screensCountFromStore, maxImagenesPermitidas);
      setLocalCount(val);
    }
  }, [screensCountFromStore, maxImagenesPermitidas]);

  // ─── Ajustar si el máximo permitido baja por debajo del valor actual ───
  ReactUseEffect(() => {
    if (localCount > maxImagenesPermitidas) {
      setLocalCount(maxImagenesPermitidas);
    }
  }, [maxImagenesPermitidas]);

  // ─── Cálculo de duración por imagen ───
  const rawDuration = plan.durationSeconds / localCount;
  const durationPerImage = Math.max(0.5, Math.ceil(rawDuration * 2) / 2);

  // ─── Handlers de navegación ───
  const handlePrevious = () => {
    router.push(borradorId ? `/resumen?borradorId=${borradorId}` : '/resumen');
  };

  const handleNext = async () => {
    setScreensCountInStore(localCount);

    if (borradorId) {
      setIsLoadingUpdate(true);
      try {
        const datosActualizados: Partial<Omit<Anuncio, 'id' | 'creatorId' | 'createdAt'>> = {
          maxScreens: localCount,
        };
        await updateAnuncio(borradorId, datosActualizados);
        router.push(`/editor/${borradorId}`);
      } catch (error) {
        setIsLoadingUpdate(false);
        alert(
          `Error al guardar el número de imágenes: ${
            error instanceof Error ? error.message : 'Error desconocido'
          }`
        );
        return;
      }
    } else {
      router.push('/editor/nuevo');
    }
  };

  // ─── JSX ───
  return (
    <div className="min-h-screen bg-fondo text-texto p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-primario mb-8 text-center">
        ¿Cuántas imágenes usarás?
      </h1>
      {borradorId && (
        <p className="text-center text-texto-secundario mb-8">
          Ajusta la cantidad de imágenes para tu borrador. Esto está limitado por tu plan
          actual ({plan.name}).
        </p>
      )}
      <Card className="w-full max-w-xl p-6 mb-8 shadow-xl">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="font-medium text-texto-principal">Imágenes:</span>
            <span className="text-xl font-semibold text-primario">{localCount}</span>
          </div>
          <input
            type="range"
            min={1}
            max={maxImagenesPermitidas}
            value={localCount}
            onChange={(e) => {
              const nuevoValor = Number(e.target.value);
              if (nuevoValor >= 1 && nuevoValor <= maxImagenesPermitidas) {
                setLocalCount(nuevoValor);
              }
            }}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primario"
            disabled={isLoadingUpdate}
          />
          <div>
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
            <p className="text-sm text-texto-muted">
              Máximo permitido para tu plan ({plan.name}): {plan.maxImages} imágenes.
            </p>
            <p className="text-xs text-texto-muted mt-1">
              Duración total del anuncio: {plan.durationSeconds} segundos.
            </p>
          </div>
        </div>
      </Card>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isLoadingUpdate}
          className="w-full sm:w-auto"
        >
          Anterior
        </Button>
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={isLoadingUpdate}
          className="w-full sm:w-auto flex-grow"
        >
          {isLoadingUpdate ? 'Guardando...' : 'Continuar al Editor'}
        </Button>
      </div>
    </div>
  );
}
