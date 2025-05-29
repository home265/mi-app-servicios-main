// src/app/(ads)/pago/[anuncioId]/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';
import { getAnuncioById } from '@/lib/services/anunciosService';
import { planes, campanias, type Plan, type Campania } from '@/lib/constants/anuncios';
import type { Anuncio } from '@/types/anuncio';
import PagoSimuladorClient from '../components/PagoSimuladorClient';
import Card from '@/app/components/ui/Card';

/* ⬇️  params ahora es PROMISE, como exige Next.js 15 */
interface PagoPageProps {
  params: Promise<{
    anuncioId: string;
  }>;
}

export const dynamic = 'force-dynamic';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default async function PagoPage({ params }: PagoPageProps) {
  /* ⬇️  await params */
  const { anuncioId } = await params;

  if (!anuncioId) {
    console.warn('PagoPage: No se proporcionó anuncioId.');
    notFound();
  }

  let anuncioCargado: Anuncio | null = null;
  let planDetails: Plan | undefined;
  let campaniaDetails: Campania | undefined;
  let precioFinalCalculado = 0;
  let errorCarga: string | null = null;

  let nombrePlan = 'Desconocido';
  let nombreCampania = 'No especificada';
  let duracionCampaniaMeses = 1;

  try {
    anuncioCargado = await getAnuncioById(anuncioId);

    if (!anuncioCargado) {
      console.warn(`PagoPage: Anuncio con ID ${anuncioId} no encontrado.`);
      notFound();
    }

    planDetails = planes.find((p) => p.id === anuncioCargado!.plan);
    if (!planDetails) {
      throw new Error(
        `Los detalles del plan con ID '${anuncioCargado!.plan}' no fueron encontrados. Verifica la configuración.`
      );
    }
    nombrePlan = planDetails.name;

    if (anuncioCargado!.campaniaId) {
      campaniaDetails = campanias.find((c) => c.id === anuncioCargado!.campaniaId);
      if (!campaniaDetails) {
        console.warn(
          `Campaña con ID '${anuncioCargado!.campaniaId}' no encontrada. Se usará precio base.`
        );
        precioFinalCalculado = planDetails.priceARS;
        nombreCampania = 'Campaña no reconocida';
        duracionCampaniaMeses = 1;
      } else {
        nombreCampania = campaniaDetails.name;
        duracionCampaniaMeses = campaniaDetails.months;
        let precioBaseTotal = planDetails.priceARS;
        // ASUNCIÓN: priceARS es mensual; multiplicar por meses de la campaña
        if (campaniaDetails.months > 1) {
          precioBaseTotal = planDetails.priceARS * campaniaDetails.months;
        }
        precioFinalCalculado = precioBaseTotal * (1 - campaniaDetails.discount);
      }
    } else {
      console.warn(
        `El anuncio ${anuncioId} no tiene 'campaniaId'. Se usará precio base sin descuento.`
      );
      precioFinalCalculado = planDetails.priceARS;
      nombreCampania = 'No aplica (tarifa base)';
      duracionCampaniaMeses = 1;
    }

    precioFinalCalculado = Math.round(precioFinalCalculado * 100) / 100;
  } catch (error) {
    const err = error as Error;
    console.error(
      `Error al cargar datos para la página de pago (anuncio ${anuncioId}):`,
      err.message || err
    );
    errorCarga =
      'No se pudieron cargar los datos necesarios para el pago. Verifica que el anuncio exista y esté configurado correctamente, o inténtalo de nuevo más tarde.';
  }

  if (errorCarga) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center bg-[var(--color-fondo)]">
        <Card className="w-full max-w-md p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-red-500 mb-4">Error en la Página de Pago</h1>
          <p className="text-[var(--color-texto-secundario)]">{errorCarga}</p>
        </Card>
      </div>
    );
  }

  if (!anuncioCargado || !planDetails) {
    console.error(
      'PagoPage: Datos críticos del anuncio o plan son nulos después de la carga y sin errorCarga explícito.'
    );
    notFound();
  }

  const paymentSuccessUrl =
    process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL ||
    'https://onpaymentsuccess-b7pe6eykpa-uc.a.run.app';

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center min-h-screen bg-[var(--color-fondo)]">
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primario)] mb-6 sm:mb-8 text-center">
          Confirmar y Pagar Anuncio
        </h1>
        <PagoSimuladorClient
          anuncioId={anuncioId}
          nombrePlan={nombrePlan}
          nombreCampania={nombreCampania}
          duracionCampaniaMeses={duracionCampaniaMeses}
          precioFinal={precioFinalCalculado}
          precioFormateado={formatCurrency(precioFinalCalculado)}
          cloudFunctionUrl={paymentSuccessUrl}
          maxScreens={anuncioCargado.maxScreens}
        />
      </Card>
    </div>
  );
}
