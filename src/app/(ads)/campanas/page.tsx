// Asumiendo que la ruta correcta es src/app/(ads)/campanas/page.tsx según el contexto
// Tu comentario original: // src/app/(main)/campanas/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/app/components/ui/Card'; // Asegúrate que la ruta a tu componente Card es correcta
import { campanias, planes, CampaniaId, PlanId } from '@/lib/constants/anuncios';
import { useAnuncioStore } from '@/store/anuncioStore';

export default function CampaniasPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  /* ---------- query-string ---------- */
  const borradorId = searchParams.get('borradorId');
  const planIdQP   = searchParams.get('planId') as PlanId | null; // planId desde el Query Param

  /* ---------- store ---------- */
  // Con 'persist' en useAnuncioStore, planIdFromStore se hidratará desde localStorage si existe.
  const planIdFromStore            = useAnuncioStore((s) => s.planId);
  const setPlanInStore             = useAnuncioStore((s) => s.setPlan);
  const setCampaniaInStore         = useAnuncioStore((s) => s.setCampania);
  const currentCampaniaIdFromStore = useAnuncioStore((s) => s.campaniaId);
  const setScreensCountInStore     = useAnuncioStore((s) => s.setScreensCount);

  /* ---------- mounted flag ---------- */
  // Este flag es crucial. Asegura que la lógica dependiente del store
  // o las redirecciones solo ocurran después del montaje en el cliente,
  // dando tiempo a que el store persistido se hidrate.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ------------------------------------------------------------------
   * 1) Hidratar el store con planId si viene sólo en la URL
   * (Esto puede actuar como un fallback o un setter inicial si el store aún no tiene planId)
   * ------------------------------------------------------------------ */
  useEffect(() => {
    // Solo si está montado, el store aún no tiene planId (post-hidratación inicial de persist),
    // pero sí tenemos un planId en la URL.
    if (mounted && !planIdFromStore && planIdQP) {
      console.log(`CAMPANAS_PAGE: Hidratando store con planId de URL: ${planIdQP}`);
      setPlanInStore(planIdQP); // Esto también actualizará localStorage debido a 'persist'.
    }
  }, [mounted, planIdFromStore, planIdQP, setPlanInStore]);

  /* ------------------------------------------------------------------
   * 2) Redirigir si no hay planId válido.
   * planSeleccionado se deriva usando planIdFromStore (que puede estar hidratado) o planIdQP.
   * ------------------------------------------------------------------ */
  // Se recalcula en cada render. Si planIdFromStore cambia por hidratación, esto se actualizará.
  const planSeleccionado = planes.find((p) => p.id === (planIdFromStore || planIdQP));

  useEffect(() => {
    if (mounted) {
      // Después del montaje, planIdFromStore debería reflejar el valor de localStorage (si lo hay).
      // Si, incluso después de eso y de considerar planIdQP, no hay un plan válido, redirigir.
      if (!planIdFromStore && !planIdQP) {
        console.warn('CAMPANAS_PAGE (cliente): No hay planId (ni en store ni en URL). Redirigiendo a /planes.');
        router.replace('/planes');
      } else if (!planSeleccionado) {
        // Esto cubre el caso donde planIdFromStore o planIdQP existe pero no es un ID de plan válido.
        console.warn(`CAMPANAS_PAGE (cliente): planId "${planIdFromStore || planIdQP}" no es válido. Redirigiendo a /planes.`);
        router.replace('/planes');
      }
    }
  }, [mounted, planIdFromStore, planIdQP, planSeleccionado, router]);

  /* ---------- selección de campaña ---------- */
  const handleSelectCampania = (selectedCampaniaId: CampaniaId) => {
    if (!planSeleccionado) {
      console.error('CAMPANAS_PAGE: No se puede seleccionar campaña sin un plan válido.');
      // Esta redirección es una seguridad adicional, el useEffect anterior ya debería haberlo manejado.
      router.replace('/planes');
      return;
    }
    setCampaniaInStore(selectedCampaniaId);

    if (planSeleccionado) {
      setScreensCountInStore(planSeleccionado.maxImages);
    }

    const campaniaPart = `&campaniaId=${selectedCampaniaId}`;
    const borradorPart = borradorId ? `&borradorId=${borradorId}` : '';
    router.push(`/resumen?planId=${planSeleccionado.id}${campaniaPart}${borradorPart}`);
  };

  /* ---------- loading / redirecting ---------- */
  // Muestra "Cargando..." mientras el componente no esté montado en el cliente,
  // o si aún no se ha determinado un planSeleccionado válido (lo que implica que
  // la hidratación o la lógica de redirección aún no se ha completado).
  if (!mounted || !planSeleccionado) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando campañas...</p>
      </div>
    );
  }

  /* ---------- render ---------- */
  const precioBasePlan = planSeleccionado.priceARS;

  return (
    <div className="min-h-screen bg-fondo text-texto p-4">
      <h1 className="text-3xl font-bold text-primario mb-2 text-center">
        Elige tu Campaña para el Plan: {planSeleccionado.name}
      </h1>
      <p className="text-center text-texto-secundario mb-8">
        Has seleccionado el plan <span className="font-semibold">{planSeleccionado.name}</span>.
        Ahora elige la duración de tu campaña.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanias.map((campania) => {
          const isSelected = campania.id === currentCampaniaIdFromStore;
          const totalWithDiscount = precioBasePlan * campania.months * (1 - campania.discount);

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
            // Si había un borradorId, se vuelve a planes con ese borradorId, si no, solo a planes.
            // Si planIdQP estaba en la URL, también se podría considerar pasarlo de vuelta.
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