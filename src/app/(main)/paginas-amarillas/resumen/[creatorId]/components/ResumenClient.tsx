'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// --- NUEVOS IMPORTS ---
// Se importa el SDK de React de Mercado Pago para inicializarlo y usar el componente del botón.
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { PLANES } from '@/lib/constants/planes';
import { CAMPANAS } from '@/lib/constants/campanas';
import PaginaAmarillaDisplayCard from '@/components/paginas-amarillas/PaginaAmarillaDisplayCard';
import AnuncioAnimadoCard from '@/components/anuncios/AnuncioAnimadoCard';

// --- INICIALIZACIÓN DEL SDK ---
// Usamos la clave PÚBLICA que guardaste en tu archivo .env.local
// Esta línea se ejecuta una sola vez cuando el componente se carga en el navegador.
if (process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) {
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY);
} else {
  console.warn("La clave pública de Mercado Pago no está configurada. El botón de pago no funcionará.");
}

interface ResumenClientProps {
  publicacion: SerializablePaginaAmarillaData;
}

export default function ResumenClient({ publicacion }: ResumenClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // --- NUEVO ESTADO ---
  // Guardará el ID de la preferencia de pago que nos devuelva nuestro backend.
  // Es null al principio, y solo cuando tenga un valor, mostraremos el botón de Mercado Pago.
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  const planDetails = publicacion.planId ? PLANES.find(p => p.id === publicacion.planId) : null;
  const campanaDetails = publicacion.campaignId ? CAMPANAS.find(c => c.id === publicacion.campaignId) : null;

  if (!planDetails || !campanaDetails) {
    return (
      <div className="text-center text-error">
        Error: No se pudo cargar la información del plan o la campaña para esta publicación.
      </div>
    );
  }

  const finalPrice = planDetails.priceARS * campanaDetails.months * (1 - campanaDetails.discount);

  const handleEdit = () => {
    if (isLoading || preferenceId) return; // Evita editar si ya se inició el pago
    router.push(`/paginas-amarillas/editar/${publicacion.creatorId}`);
  };

  // --- LÓGICA DE PAGO ACTUALIZADA ---
  // Esta es la función clave que ha sido modificada.
  const handleCreatePreference = async () => {
    setIsLoading(true);
    setApiError(null);

    try {
      // 1. Llama a nuestro nuevo endpoint, no al antiguo.
      const response = await fetch('/api/mercado-pago/crear-preferencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 2. Envía los datos necesarios para que el backend calcule el precio y cree la preferencia.
        body: JSON.stringify({
          planId: publicacion.planId,
          campaignId: publicacion.campaignId,
          creatorId: publicacion.creatorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo iniciar el proceso de pago.');
      }

      const data: { id: string } = await response.json();

      // 3. Guarda el ID de la preferencia en nuestro estado. Esto provocará que se renderice el botón de Wallet.
      setPreferenceId(data.id);

    } catch (err) {
      // El casting a Error es seguro y evita el uso de 'any'.
      const error = err as Error;
      setApiError(error.message);
    } finally {
      // Importante: No ponemos setIsLoading(false) aquí para que el botón original
      // permanezca deshabilitado y sea reemplazado por el de Mercado Pago.
    }
  };

  return (
    <div className="space-y-12">
      <h1 className="text-3xl font-bold text-texto-principal text-center">Resumen y Previsualización</h1>

      {/* La sección de resumen y previsualización no cambia */}
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

      <section className="max-w-md mx-auto w-full pt-6 border-t border-borde-tarjeta">
  {apiError && <p className="text-sm text-center text-error mb-4">{apiError}</p>}
  
  {!preferenceId ? (
    <div className="flex flex-col sm:flex-row gap-4">
      <button onClick={handleEdit} disabled={isLoading} className="btn-secondary flex-1">
        Volver a Editar
      </button>
      <button onClick={handleCreatePreference} disabled={isLoading} className="btn-primary flex-1">
        {isLoading ? 'Inicializando pago...' : 'Pagar y Activar'}
      </button>
    </div>
  ) : (
    // SECCIÓN CORREGIDA DEFINITIVA
    <div id="wallet_container" className="w-full">
      <div id="wallet_container" className="w-full">
  <Wallet initialization={{ preferenceId: preferenceId }} />
</div>
    </div>
  )}
</section>
    </div>
  );
}