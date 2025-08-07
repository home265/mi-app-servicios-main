'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { PLANES } from '@/lib/constants/planes';
import { CAMPANAS } from '@/lib/constants/campanas';
import PaginaAmarillaDisplayCard from '@/app/components/paginas-amarillas/PaginaAmarillaDisplayCard';
import AnuncioAnimadoCard from '@/app/components/anuncios/AnuncioAnimadoCard';

interface ResumenClientProps {
  publicacion: SerializablePaginaAmarillaData;
}

export default function ResumenClient({ publicacion }: ResumenClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Encontramos los detalles del plan y la campaña a partir de los IDs guardados
  const planDetails = publicacion.planId ? PLANES.find(p => p.id === publicacion.planId) : null;
  const campanaDetails = publicacion.campaignId ? CAMPANAS.find(c => c.id === publicacion.campaignId) : null;

  // Si no se encuentra el plan o la campaña, mostramos un error.
  if (!planDetails || !campanaDetails) {
    return (
      <div className="text-center text-error">
        Error: No se pudo cargar la información del plan o la campaña para esta publicación.
      </div>
    );
  }

  // Calculamos el precio final
  const finalPrice = planDetails.priceARS * campanaDetails.months * (1 - campanaDetails.discount);

  const handleEdit = () => {
    router.push(`/paginas-amarillas/editar/${publicacion.creatorId}`);
  };

  const handlePayAndActivate = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      const res = await fetch('/api/onSubscriptionPayment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: publicacion.creatorId, plan: campanaDetails.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'No se pudo activar la suscripción.');
      }
      
      // Si todo sale bien, redirigimos a la bienvenida con un mensaje de éxito.
      router.push('/bienvenida?status=success');

    } catch (err) {
      const error = err as Error;
      setApiError(error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-texto-principal text-center">Resumen y Previsualización</h1>

      {/* Bloque de Resumen de Compra */}
      <section className="max-w-md mx-auto p-6 bg-tarjeta rounded-2xl shadow-lg">
        <h2 className="text-xl font-semibold text-primario mb-4 border-b border-borde-tarjeta pb-3">Tu Selección</h2>
        <div className="space-y-2">
          <p><span className="font-medium">Plan:</span> {planDetails.name}</p>
          <p><span className="font-medium">Campaña:</span> {campanaDetails.name} ({campanaDetails.months} {campanaDetails.months > 1 ? 'meses' : 'mes'})</p>
          <p className="text-2xl font-bold mt-4">
            Total a Pagar: ${finalPrice.toLocaleString('es-AR')}
          </p>
        </div>
      </section>

      {/* Bloque de Previsualizaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-texto-principal mb-4">Así se verá en la Guía Local</h2>
          <PaginaAmarillaDisplayCard publicacion={publicacion} />
        </div>
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold text-texto-principal mb-4">Así se verá como Anuncio</h2>
          <AnuncioAnimadoCard
            publicacion={publicacion}
            duracionFrente={planDetails.durationFrontMs}
            duracionDorso={planDetails.durationBackMs}
          />
        </div>
      </div>

      {/* Bloque de Acciones Finales */}
      <section className="max-w-md mx-auto w-full pt-6 border-t border-borde-tarjeta">
        {apiError && <p className="text-sm text-center text-error mb-4">{apiError}</p>}
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleEdit} disabled={isLoading} className="btn-secondary flex-1">
            Volver a Editar
          </button>
          <button onClick={handlePayAndActivate} disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? 'Procesando Pago...' : 'Pagar y Activar'}
          </button>
        </div>
      </section>
    </div>
  );
}