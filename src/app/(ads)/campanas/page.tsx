// Asumiendo que la ruta correcta es src/app/(ads)/campanas/page.tsx según el contexto
// Tu comentario original: // src/app/(main)/campanas/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Card from '@/app/components/ui/Card'; // Asegúrate que la ruta a tu componente Card es correcta
import { campanias, planes, CampaniaId, PlanId } from '@/lib/constants/anuncios';
import { useAnuncioStore } from '@/store/anuncioStore';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';

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
    <div className="min-h-screen bg-fondo text-texto">
      {/* 1. Contenedor principal que limita y centra todo el contenido */}
      <div className="w-full max-w-5xl mx-auto px-4 py-8">

        {/* --- Encabezado actualizado con Flexbox --- */}
        <div className="flex items-center justify-center gap-4 mb-10 mt-8">
          <h1 className="text-3xl font-bold text-primario text-center">
            Elige tu Campaña
          </h1>
          <BotonAyuda>
            <AyudaCrearEditarAnuncio fase="fase1b" />
          </BotonAyuda>
        </div>

        <p className="text-center text-texto-secundario mb-8">
          Has seleccionado el plan <span className="font-semibold">{planSeleccionado.name}</span>.
          Ahora elige la duración de tu campaña.
        </p>

        {/* --- Tarjetas de Campaña como Botones 3D --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {campanias.map((campania) => {
            const isSelected = campania.id === currentCampaniaIdFromStore;
            const totalWithDiscount = precioBasePlan * campania.months * (1 - campania.discount);

            return (
              <button
                key={campania.id}
                onClick={() => handleSelectCampania(campania.id)}
                className={`
                  w-full rounded-2xl p-6 flex flex-col justify-between cursor-pointer text-left
                  transition-all duration-200
                  bg-tarjeta
                  shadow-[4px_4px_8px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
                  hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(249,243,217,0.08)] hover:-translate-y-1
                  active:scale-95 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
                  ${isSelected ? 'ring-2 ring-primario shadow-xl' : ''}
                `}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-center text-texto-principal">{campania.name}</h2>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Duración:</span> {campania.months}{' '}
                    {campania.months > 1 ? 'meses' : 'mes'}
                  </p>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Descuento:</span> {campania.discount * 100}%
                  </p>
                  <p className="mb-2 text-texto-principal">
                    <span className="font-medium">Precio total:</span>{' '}
                    ${totalWithDiscount.toLocaleString('es-AR')} ARS
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-4 pt-2 border-t border-primario/30 text-center">
                    <span className="text-sm font-semibold text-primario">Campaña Actual</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* --- Botón final con estilo 3D secundario --- */}
        <div className="text-center mt-12">
          <button
            onClick={() =>
              borradorId ? router.push(`/planes?borradorId=${borradorId}`) : router.push('/planes')
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
            Volver a Planes
          </button>
        </div>
      </div>
    </div>
  );
}