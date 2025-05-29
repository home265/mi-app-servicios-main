// src/app/(ads)/pago/components/PagoSimuladorClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import { ArrowLeft, CheckCircle, ShieldCheck, AlertTriangle } from 'lucide-react';

interface PagoSimuladorClientProps {
  anuncioId: string;
  nombrePlan: string;
  nombreCampania: string;
  duracionCampaniaMeses: number;
  precioFinal: number; // Se recibe, aunque no se use directamente en el JSX
  precioFormateado: string;
  cloudFunctionUrl: string;
  maxScreens: number;
}

export default function PagoSimuladorClient({
  anuncioId,
  nombrePlan,
  nombreCampania,
  duracionCampaniaMeses,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  precioFinal, // Prop se recibe, pero no se usa directamente en el renderizado. Se usa precioFormateado.
                // Si tu linter sigue marcando error, puedes quitar esta línea de comentario y la prop si no la necesitas.
  precioFormateado,
  cloudFunctionUrl,
  maxScreens,
}: PagoSimuladorClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSimulatePayment = async () => {
    setIsLoading(true);
    setPaymentStatus('idle');
    setErrorMessage(null);

    if (!cloudFunctionUrl || cloudFunctionUrl.includes('URL_DE_TU_FUNCION') || cloudFunctionUrl.includes('_FICTICIA')) {
        console.error("URL de la Cloud Function no configurada o es un placeholder.");
        setErrorMessage("Error de configuración: La URL de pago no está disponible. Contacta al administrador.");
        setPaymentStatus('error');
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch(cloudFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ anuncioId }),
      });

      if (!response.ok) {
        let errorMsg = `Error al procesar el pago (HTTP ${response.status})`;
        try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.error || errorMsg;
         
        } catch (_e) { // Variable 'e' renombrada a '_e' para indicar que no se usa su valor
            // No se pudo parsear el JSON, usar el mensaje HTTP
            // console.warn("No se pudo parsear el JSON de error de la respuesta:", _e); // Opcional
        }
        throw new Error(errorMsg);
      }

      setPaymentStatus('success');

    } catch (error) {
      const err = error as Error;
      console.error('Error en la simulación de pago:', err.message || err); // Usamos err.message
      setErrorMessage(err.message || 'Ocurrió un error desconocido durante la simulación del pago.');
      setPaymentStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAfterSuccess = () => {
    router.push('/(main)/bienvenida'); // Ajusta esta ruta
  };

  return (
    <div className="space-y-6">
      <div className="p-4 border border-[var(--color-borde-tarjeta)] rounded-lg bg-gray-50 dark:bg-gray-800/30">
        <h2 className="text-lg font-semibold text-[var(--color-texto-principal)] mb-3">Resumen de tu Anuncio</h2>
        <div className="space-y-1 text-sm text-[var(--color-texto-secundario)]">
          <p><span className="font-medium text-[var(--color-texto-principal)]">Plan:</span> {nombrePlan}</p>
          <p><span className="font-medium text-[var(--color-texto-principal)]">Campaña:</span> {nombreCampania} ({duracionCampaniaMeses} {duracionCampaniaMeses > 1 ? 'meses' : 'mes'})</p>
          <p><span className="font-medium text-[var(--color-texto-principal)]">Pantallas/Imágenes:</span> {maxScreens}</p>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-[var(--color-texto-secundario)]">Total a Pagar (Simulado):</p>
        <p className="text-3xl sm:text-4xl font-bold text-[var(--color-primario)]">{precioFormateado}</p>
      </div>

      {paymentStatus === 'idle' && (
        <div className="mt-8 space-y-3">
          <Button
            variant="primary"
            onClick={handleSimulatePayment}
            disabled={isLoading}
            className="w-full text-lg py-3"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando Pago...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <ShieldCheck size={20} className="mr-2" />
                Simular Pago Exitoso
              </span>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/preview/${anuncioId}`)}
            disabled={isLoading}
            className="w-full"
          >
             <ArrowLeft size={18} className="mr-2" />
            Volver a Previsualización
          </Button>
        </div>
      )}

      {paymentStatus === 'success' && (
        <div className="mt-8 p-4 text-center bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
          <CheckCircle size={48} className="text-green-500 dark:text-green-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-green-700 dark:text-green-300">¡Pago Simulado Exitoso!</h3>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1 mb-4">
            Tu anuncio ha sido marcado como activo y comenzará pronto.
          </p>
          <Button variant="primary" onClick={handleContinueAfterSuccess} className="w-full sm:w-auto">
            Continuar
          </Button>
        </div>
      )}

      {paymentStatus === 'error' && errorMessage && (
        <div className="mt-8 p-4 text-center bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
          <AlertTriangle size={48} className="text-red-500 dark:text-red-400 mx-auto mb-3" />
          <h3 className="text-xl font-semibold text-red-700 dark:text-red-300">Error en el Pago</h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1 mb-4">
            {errorMessage}
          </p>
          <Button variant="secondary" onClick={() => setPaymentStatus('idle')} className="w-full sm:w-auto">
            Intentar de Nuevo
          </Button>
        </div>
      )}
    </div>
  );
}
