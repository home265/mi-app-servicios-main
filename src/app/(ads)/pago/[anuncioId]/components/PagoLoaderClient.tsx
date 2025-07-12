// src/app/(ads)/pago/[anuncioId]/components/PagoLoaderClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notFound } from 'next/navigation'; // Útil si el anuncio no existe
import { getAnuncioById } from '@/lib/services/anunciosService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { planes, campanias, type Plan, type Campania } from '@/lib/constants/anuncios';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio } from '@/types/anuncio';
import PagoSimuladorClient from '../../components/PagoSimuladorClient'; // Ajusta la ruta si es necesario
import Card from '@/app/components/ui/Card'; // Para el mensaje de error
import { Loader2, AlertTriangle } from 'lucide-react'; // Para estados de carga y error
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';

interface PagoLoaderClientProps {
  anuncioId: string;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export default function PagoLoaderClient({ anuncioId }: PagoLoaderClientProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anuncioDataForSimulador, setAnuncioDataForSimulador] = useState<null | {
    nombrePlan: string;
    nombreCampania: string;
    duracionCampaniaMeses: number;
    precioFinal: number;
    precioFormateado: string;
    maxScreens: number;
  }>(null);

  useEffect(() => {
    if (!anuncioId) {
      setError("ID de anuncio no proporcionado.");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setAnuncioDataForSimulador(null);

      try {
        console.log(`[CLIENT /pago] Iniciando carga de anuncio para pago. ID: ${anuncioId}`);
        const anuncioCargado = await getAnuncioById(anuncioId);

        if (!anuncioCargado) {
          console.warn(`[CLIENT /pago] Anuncio con ID ${anuncioId} no encontrado.`);
          // setError puede causar un re-render que muestre el error, o podemos usar notFound() si es apropiado.
          // Por coherencia con el error que veías, usamos setError.
          setError('No se pudieron cargar los datos necesarios para el pago. Verifica que el anuncio exista y esté configurado correctamente, o inténtalo de nuevo más tarde.');
          setIsLoading(false);
          return;
        }
        console.log(`[CLIENT /pago] Anuncio cargado:`, anuncioCargado);

        const planDetails = planes.find((p) => p.id === anuncioCargado.plan);
        if (!planDetails) {
          throw new Error(
            `Los detalles del plan con ID '${anuncioCargado.plan}' no fueron encontrados. Verifica la configuración.`
          );
        }
        const nombrePlan = planDetails.name;
        let nombreCampania = 'No especificada';
        let duracionCampaniaMeses = 1; // Default
        let precioFinalCalculado = planDetails.priceARS; // Default si no hay campaña

        if (anuncioCargado.campaniaId) {
          const campaniaDetails = campanias.find((c) => c.id === anuncioCargado.campaniaId);
          if (!campaniaDetails) {
            console.warn(
              `[CLIENT /pago] Campaña con ID '${anuncioCargado.campaniaId}' no encontrada. Se usará precio base.`
            );
            nombreCampania = 'Campaña no reconocida';
          } else {
            nombreCampania = campaniaDetails.name;
            duracionCampaniaMeses = campaniaDetails.months;
            let precioBaseTotal = planDetails.priceARS;
            if (campaniaDetails.months > 1) {
              precioBaseTotal = planDetails.priceARS * campaniaDetails.months;
            }
            precioFinalCalculado = precioBaseTotal * (1 - campaniaDetails.discount);
          }
        } else {
          console.warn(
            `[CLIENT /pago] El anuncio ${anuncioId} no tiene 'campaniaId'. Se usará precio base sin descuento.`
          );
          nombreCampania = 'No aplica (tarifa base)';
        }

        precioFinalCalculado = Math.round(precioFinalCalculado * 100) / 100;

        setAnuncioDataForSimulador({
          nombrePlan,
          nombreCampania,
          duracionCampaniaMeses,
          precioFinal: precioFinalCalculado,
          precioFormateado: formatCurrency(precioFinalCalculado),
          maxScreens: anuncioCargado.maxScreens,
        });

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido";
        console.error(`[CLIENT /pago] Error al cargar datos para la página de pago (anuncio ${anuncioId}):`, errorMessage);
        setError(`No se pudieron cargar los datos necesarios para el pago. Detalle: ${errorMessage}. Verifica que el anuncio exista y esté configurado correctamente, o inténtalo de nuevo más tarde.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [anuncioId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin h-10 w-10 text-primario mb-4" />
        <p>Cargando datos para el pago...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <Card className="w-full max-w-md p-6 sm:p-8 bg-fondo-tarjeta-error"> {/* Asumiendo que tienes un color para errores */}
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-red-500 mb-4">Error en la Página de Pago</h1>
          <p className="text-texto-secundario whitespace-pre-line">{error}</p>
        </Card>
      </div>
    );
  }

  if (!anuncioDataForSimulador) {
    // Esto no debería ocurrir si isLoading es false y no hay error, pero es una salvaguarda.
    return (
        <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
             <Card className="w-full max-w-md p-6 sm:p-8">
                <h1 className="text-xl sm:text-2xl font-bold text-orange-500 mb-4">Advertencia</h1>
                <p className="text-texto-secundario">No se pudieron preparar los datos para el simulador de pago. Intenta recargar.</p>
            </Card>
        </div>
    );
  }

  // La URL de la Cloud Function se puede obtener de variables de entorno del cliente
  const paymentSuccessUrl =
    process.env.NEXT_PUBLIC_PAYMENT_SUCCESS_URL ||
    'https://onpaymentsuccess-b7pe6eykpa-uc.a.run.app'; // Fallback a tu URL actual

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 flex flex-col items-center min-h-screen bg-[var(--color-fondo)]">
      
      {/* Contenedor del encabezado con el título y el botón de ayuda */}
      <div className="relative w-full max-w-lg mb-6 text-center">
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <BotonAyuda>
            {/* La ayuda de la Fase 3 corresponde a esta pantalla */}
            <AyudaCrearEditarAnuncio fase="fase3" />
          </BotonAyuda>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-primario)]">
          Confirmar y Pagar Anuncio
        </h1>
      </div>

      {/* La Card ahora solo contiene el simulador de pago */}
      <Card className="w-full max-w-lg p-6 sm:p-8 shadow-xl">
        <PagoSimuladorClient
          anuncioId={anuncioId}
          nombrePlan={anuncioDataForSimulador.nombrePlan}
          nombreCampania={anuncioDataForSimulador.nombreCampania}
          duracionCampaniaMeses={anuncioDataForSimulador.duracionCampaniaMeses}
          precioFinal={anuncioDataForSimulador.precioFinal}
          precioFormateado={anuncioDataForSimulador.precioFormateado}
          cloudFunctionUrl={paymentSuccessUrl}
          maxScreens={anuncioDataForSimulador.maxScreens}
        />
      </Card>
    </div>
  );
}