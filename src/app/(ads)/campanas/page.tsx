// src/app/(main)/campanas/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import { campanias, planes, CampaniaId, PlanId } from '@/lib/constants/anuncios';
import { useAnuncioStore } from '@/store/anuncioStore';

export default function CampaniasPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* ---------- query-string ---------- */
  const borradorId = searchParams.get('borradorId');
  const planIdQP   = searchParams.get('planId') as PlanId | null;

  /* ---------- store ---------- */
  const planIdFromStore            = useAnuncioStore((s) => s.planId);
  const setPlanInStore             = useAnuncioStore((s) => s.setPlan);
  const setCampaniaInStore         = useAnuncioStore((s) => s.setCampania);
  const currentCampaniaIdFromStore = useAnuncioStore((s) => s.campaniaId);
  const setScreensCountInStore     = useAnuncioStore((s) => s.setScreensCount);

  /* ---------- mounted flag ---------- */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* ------------------------------------------------------------------
   *  1) Hidratar el store con planId si viene sólo en la URL
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (mounted && !planIdFromStore && planIdQP) {
      setPlanInStore(planIdQP);
    }
  }, [mounted, planIdFromStore, planIdQP, setPlanInStore]);

  /* ------------------------------------------------------------------
   *  2) Cuando el componente está montado decidir si se debe redirigir
   * ------------------------------------------------------------------ */
  useEffect(() => {
    if (!mounted) return;

    if (!planIdFromStore && !planIdQP) {
      // No tenemos plan por ningún lado → volver a /planes
      router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
    }
  }, [mounted, planIdFromStore, planIdQP, borradorId, router]);

  /* ---------- loading mientras montamos / redirigimos ---------- */
  if (!mounted || (!planIdFromStore && !planIdQP)) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Redirigiendo…</p>
      </div>
    );
  }

  /* ---------- plan efectivo ---------- */
  const effectivePlanId = planIdFromStore ?? (planIdQP as PlanId);
  const plan = planes.find((p) => p.id === effectivePlanId);

  if (!plan) {
    console.error('CampaniasPage: No se encontró el plan con ID:', effectivePlanId);
    router.replace(
      borradorId
        ? `/planes?borradorId=${borradorId}&error=plan_no_encontrado`
        : '/planes?error=plan_no_encontrado'
    );
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Error: Plan no encontrado. Redirigiendo…</p>
      </div>
    );
  }

  /* ---------- handler selección de campaña ---------- */
  const handleSelectCampania = (selectedCampaniaId: CampaniaId) => {
  setCampaniaInStore(selectedCampaniaId);
  setScreensCountInStore(plan.maxImages);

  // armamos la URL con todos los IDs necesarios
  const base = `/resumen?planId=${effectivePlanId}&campaniaId=${selectedCampaniaId}`;
  const ruta = borradorId ? `${base}&borradorId=${borradorId}` : base;

  router.push(ruta);
};


  /* ---------- render ---------- */
  return (
    <div className="min-h-screen bg-fondo text-texto p-4">
      <h1 className="text-3xl font-bold text-primario mb-8 text-center">
        {borradorId ? 'Modifica tu Campaña' : 'Elige tu Campaña'}
      </h1>

      {borradorId && (
        <p className="text-center text-texto-secundario mb-8">
          Estás modificando la configuración de tu borrador existente.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanias.map((campania) => {
          const baseTotal         = plan.priceARS * campania.months;
          const totalWithDiscount = Math.round(baseTotal * (1 - campania.discount));
          const isSelected        = campania.id === currentCampaniaIdFromStore;

          return (
            <Card
              key={campania.id}
              onClick={() => handleSelectCampania(campania.id)}
              className={`cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between p-6
                          ${isSelected ? 'ring-2 ring-primario shadow-xl border-primario' : 'border-transparent'}`}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-center">{campania.name}</h2>

                <p className="mb-2">
                  <span className="font-medium">Duración:</span> {campania.months}{' '}
                  {campania.months > 1 ? 'meses' : 'mes'}
                </p>

                <p className="mb-2">
                  <span className="font-medium">Descuento:</span> {campania.discount * 100}%
                </p>

                <p className="mb-2">
                  <span className="font-medium">Precio total:</span>{' '}
                  ${totalWithDiscount.toLocaleString('es-AR')} ARS
                </p>
              </div>

              {isSelected && (
                <div className="mt-4 pt-2 border-t border-primario/30 text-center">
                  <span className="text-sm font-semibold text-primario">Campaña Actual</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={() =>
            borradorId ? router.push(`/planes?borradorId=${borradorId}`) : router.push('/planes')
          }
          className="text-texto-secundario hover:text-primario underline"
        >
          Volver a Planes
        </button>
      </div>
    </div>
  );
}
