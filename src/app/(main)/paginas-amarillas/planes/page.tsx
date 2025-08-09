'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
// --- IMPORTS ACTUALIZADOS ---
import { PLANES, type Plan } from '@/lib/constants/planes';
import { PlanId } from '@/types/paginaAmarilla';
import AyudaPlanes from '@/app/components/ayuda-contenido/AyudaPlanes';
import useHelpContent from '@/lib/hooks/useHelpContent';

export default function PlanesPage() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const isLoadingAuth = useUserStore((s) => s.isLoadingAuth);
  useHelpContent(<AyudaPlanes />);
  const [existingPage, setExistingPage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState(false);

  // Carga inicial para saber si el usuario ya tiene una publicación (sin cambios)
  useEffect(() => {
    if (!isLoadingAuth && currentUser) {
      getPaginaAmarilla(currentUser.uid)
        .then((page) => setExistingPage(page !== null))
        .catch(() => setExistingPage(false))
        .finally(() => setLoading(false));
    } else if (!isLoadingAuth) {
      setLoading(false);
      setExistingPage(false);
    }
  }, [isLoadingAuth, currentUser]);

  // --- FUNCIÓN DE SELECCIÓN ACTUALIZADA ---
  // Al elegir un plan, ahora redirige a la página de selección de campañas.
  const handleSelectPlan = (planId: PlanId) => {
    if (busy) return;
    setSelectedPlanId(planId);
    setBusy(true);

    // Redirige a la página de campañas, pasando el plan seleccionado en la URL.
    router.push(`/paginas-amarillas/campanas?planId=${planId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando planes…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo text-texto">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="relative">
          <h1 className="text-3xl font-bold text-primario mb-8 text-center">
            {existingPage ? 'Selecciona un Nuevo Plan' : 'Elige tu Plan'}
          </h1>
        </div>

        {/* --- RENDERIZADO ACTUALIZADO PARA MOSTRAR LOS NUEVOS PLANES --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANES.map((plan: Plan) => {
            const isSelected = plan.id === selectedPlanId;
            const totalDurationSeconds = (plan.durationFrontMs + plan.durationBackMs) / 1000;

            return (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={busy}
                className={`
                  w-full rounded-2xl p-6 flex flex-col justify-between cursor-pointer
                  transition-all duration-200 bg-tarjeta text-left
                  shadow-[4px_4px_8px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
                  hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(249,243,217,0.08)]
                  active:scale-95
                  ${isSelected ? 'border-2 border-primario ring-2 ring-primario' : ''}
                `}
              >
                <div>
                  <h2 className="text-2xl font-semibold mb-4 text-center">
                    {plan.name}
                  </h2>
                  <p className="mb-2">
                    <span className="font-medium">Precio Base:</span> ${plan.priceARS.toLocaleString('es-AR')} ARS/mes
                  </p>
                  <p className="mb-2">
                    <span className="font-medium">Exposición Total:</span> {totalDurationSeconds} segundos
                  </p>
                  <p className="text-sm text-texto-secundario">
                    <span className="font-medium">Tipo:</span> {plan.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-4 pt-2 border-t border-primario/30 text-center">
                    <span className="text-sm font-semibold text-primario">Procesando...</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => router.push('/bienvenida')}
            disabled={busy}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm text-texto-secundario bg-tarjeta shadow-[2px_2px_5px_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-95"
          >
            Cancelar y Volver
          </button>
        </div>
      </div>
    </div>
  );
}