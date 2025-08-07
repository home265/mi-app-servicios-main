'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';
import { PLANES, Plan } from '@/lib/constants/planes';
import { CAMPANAS, Campana } from '@/lib/constants/campanas';
import { CampaignId, PlanId } from '@/types/paginaAmarilla';

export default function CampanasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useUserStore((s) => s.currentUser);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [existingPage, setExistingPage] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<CampaignId | null>(null);
  const [busy, setBusy] = useState(false);

  // Efecto para inicializar la página, validar el plan y verificar si el usuario ya tiene una publicación
  useEffect(() => {
    const planId = searchParams.get('planId') as PlanId | null;
    const planData = planId ? PLANES.find((p) => p.id === planId) : null;

    // Si el planId no es válido o no existe, redirigir de vuelta a la página de planes
    if (!planData) {
      router.replace('/paginas-amarillas/planes');
      return;
    }

    setSelectedPlan(planData);

    // Verificar si el usuario ya tiene una página para saber si debe crear o editar
    if (currentUser) {
      getPaginaAmarilla(currentUser.uid)
        .then((page) => setExistingPage(page !== null))
        .catch(() => setExistingPage(false))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams, router, currentUser]);

  // Maneja la selección de una campaña y redirige al formulario final
  const handleSelectCampana = (campaignId: CampaignId) => {
    if (busy || !currentUser || !selectedPlan) return;
    setSelectedCampaignId(campaignId);
    setBusy(true);

    const destination = existingPage
      ? `/paginas-amarillas/editar/${currentUser.uid}`
      : '/paginas-amarillas/crear';

    // Construye la URL final con AMBOS parámetros: planId y campaignId
    const finalUrl = `${destination}?planId=${selectedPlan.id}&campaignId=${campaignId}`;

    router.push(finalUrl);
  };

  if (loading || !selectedPlan) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando campañas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo text-texto">
      <div className="w-full max-w-5xl mx-auto px-4 py-8">
        <div className="relative">
          <h1 className="text-3xl font-bold text-primario mb-2 text-center">
            Elige la Duración de tu Campaña
          </h1>
          <p className="text-center text-texto-secundario mb-8">
            Estás configurando el <span className="font-semibold text-texto-principal">{selectedPlan.name}</span>.
          </p>
          <div className="absolute top-0 right-0">
            <BotonAyuda>
              <AyudaCrearEditarAnuncio fase="fase1a" />
            </BotonAyuda>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CAMPANAS.map((campana: Campana) => {
            const isSelected = campana.id === selectedCampaignId;
            const finalPrice = selectedPlan.priceARS * campana.months * (1 - campana.discount);

            return (
              <button
                key={campana.id}
                onClick={() => handleSelectCampana(campana.id)}
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
                    {campana.name}
                  </h2>
                  <p className="mb-2">
                    <span className="font-medium">Duración:</span> {campana.months} {campana.months > 1 ? 'meses' : 'mes'}
                  </p>
                  {campana.discount > 0 && (
                    <p className="mb-2 text-green-400">
                      <span className="font-medium">Descuento:</span> {campana.discount * 100}%
                    </p>
                  )}
                  <p className="text-lg mt-4 font-bold">
                    <span className="font-medium">Precio Final:</span> ${finalPrice.toLocaleString('es-AR')}
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
            onClick={() => router.push('/paginas-amarillas/planes')}
            disabled={busy}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm text-texto-secundario bg-tarjeta shadow-[2px_2px_5px_rgba(0,0,0,0.4)] hover:brightness-110 active:scale-95"
          >
            Volver a Planes
          </button>
        </div>
      </div>
    </div>
  );
}