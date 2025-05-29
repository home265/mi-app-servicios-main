// src/app/(ads)/resumen/page.tsx
'use client';

import React, { useState } from 'react'; // useEffect eliminado, useState añadido para isLoading
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import { planes, campanias, Plan, Campania } from '@/lib/constants/anuncios';
import { useAnuncioStore } from '@/store/anuncioStore';
import { updateAnuncio } from '@/lib/services/anunciosService'; // Para actualizar el borrador
import type { Anuncio } from '@/types/anuncio'; // Para el tipo Anuncio

export default function ResumenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const borradorId = searchParams.get('borradorId');

  const planIdFromStore = useAnuncioStore(state => state.planId);
  const campaniaIdFromStore = useAnuncioStore(state => state.campaniaId);
  const resetAnuncioStore = useAnuncioStore(state => state.reset);

  const [isLoadingUpdate, setIsLoadingUpdate] = useState<boolean>(false); // Estado para la actualización

  // Redirecciones si faltan datos en el store (sin useEffect)
  if (planIdFromStore === null) {
    console.log('ResumenPage: Falta planId, redirigiendo a /planes...');
    if (typeof window !== 'undefined') {
      router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
    }
    return <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center"><p>Redirigiendo...</p></div>;
  }
  if (campaniaIdFromStore === null) {
    console.log('ResumenPage: Falta campaniaId, redirigiendo a /campanas...');
    if (typeof window !== 'undefined') {
      router.replace(borradorId ? `/campanas?borradorId=${borradorId}` : '/campanas');
    }
    return <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center"><p>Redirigiendo...</p></div>;
  }

  const plan: Plan | undefined = planes.find(p => p.id === planIdFromStore);
  const campania: Campania | undefined = campanias.find(c => c.id === campaniaIdFromStore);

  if (!plan || !campania) {
    console.error('ResumenPage: Plan o campaña no encontrados en las constantes. planId:', planIdFromStore, 'campaniaId:', campaniaIdFromStore);
    if (typeof window !== 'undefined') {
      // Redirigir a planes, manteniendo el borradorId si existe, ya que algo está mal con la selección
      router.replace(borradorId ? `/planes?borradorId=${borradorId}&error=configuracion_invalida` : '/planes?error=configuracion_invalida');
    }
    return <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center"><p>Error en la configuración. Redirigiendo...</p></div>;
  }

  const baseTotal = plan.priceARS * campania.months;
  const totalWithDiscount = Math.round(baseTotal * (1 - campania.discount));

  const handleContinuar = async () => {
    console.log('ResumenPage: handleContinuar - FUNCIÓN INVOCADA');
    
    // Si estamos editando un borrador existente, actualizamos su plan y campaña en Firebase
    if (borradorId) {
      setIsLoadingUpdate(true);
      try {
        // Preparamos los datos para actualizar.
        // Es crucial que maxScreens se actualice según el nuevo plan.
        const datosActualizados: Partial<Omit<Anuncio, "id" | "creatorId" | "createdAt">> = {
          plan: plan.id, // planIdFromStore es lo mismo que plan.id
          campaniaId: campania.id, // campaniaIdFromStore es lo mismo que campania.id
          maxScreens: plan.maxImages, // Actualizar maxScreens según el plan seleccionado
          // campaignDurationDays también podría recalcularse aquí si depende de la campaña
          campaignDurationDays: campania.months * 30, // Asumiendo 30 días por mes
        };

        console.log(`ResumenPage: Actualizando borrador ${borradorId} con:`, datosActualizados);
        await updateAnuncio(borradorId, datosActualizados);
        console.log(`ResumenPage: Borrador ${borradorId} actualizado exitosamente.`);
        
        // Aquí es donde se necesitaría la lógica compleja si maxScreens se reduce
        // y hay que limpiar elementosPorPantalla y capturas de pantallas sobrantes.
        // Por ahora, solo actualizamos los campos principales del Anuncio.

      } catch (error) {
        console.error("ResumenPage: Error al actualizar el borrador:", error);
        setIsLoadingUpdate(false);
        // Mostrar un mensaje de error al usuario es importante aquí
        alert(`Error al guardar los cambios en el borrador: ${error instanceof Error ? error.message : "Error desconocido"}`);
        return; // No continuar si la actualización falla
      }
      setIsLoadingUpdate(false);
    }
    
    const rutaSiguiente = borradorId ? `/resumen/count?borradorId=${borradorId}` : '/resumen/count';
    console.log(`ResumenPage: Navegando a ${rutaSiguiente}`);
    router.push(rutaSiguiente);
  };

  const handleVolverACampanas = () => {
    if (borradorId) {
      router.push(`/campanas?borradorId=${borradorId}`);
    } else {
      router.push('/campanas');
    }
  };

  return (
    <div className="min-h-screen bg-fondo text-texto p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-primario mb-8 text-center">
        {borradorId ? 'Confirma los Cambios del Anuncio' : 'Resumen de tu Selección'}
      </h1>
      <Card className="w-full max-w-2xl p-6 mb-8 shadow-xl">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-texto-principal">Plan: {plan.name}</h2>
            <p className="text-sm text-texto-secundario">Precio mensual: ${plan.priceARS.toLocaleString('es-AR')} ARS</p>
            <p className="text-sm text-texto-secundario">Duración anuncio (total): {plan.durationSeconds} segundos</p>
            <p className="text-sm text-texto-secundario">Imágenes máximas: {plan.maxImages}</p>
            <p className="text-sm text-texto-secundario">Se mostrará: {plan.displayMode === 'inicio' ? 'Al inicio de la app' : 'En secciones aleatorias'}</p>
          </div>
          <hr className="border-borde-tarjeta"/>
          <div>
            <h2 className="text-xl font-semibold text-texto-principal">Campaña: {campania.name}</h2>
            <p className="text-sm text-texto-secundario">Duración: {campania.months} {campania.months > 1 ? 'meses' : 'mes'}</p>
            <p className="text-sm text-texto-secundario">Descuento: {campania.discount * 100}%</p>
          </div>
          <hr className="border-borde-tarjeta"/>
          <div className="pt-2">
            <p className="text-lg font-semibold text-texto-principal">
              Total a pagar: <span className="text-primario">${totalWithDiscount.toLocaleString('es-AR')} ARS</span>
            </p>
            <p className="text-xs text-texto-muted">
              (Este es el costo total por {campania.months} {campania.months > 1 ? 'meses' : 'mes'} de servicio con el plan y campaña seleccionados)
            </p>
          </div>
        </div>
      </Card>
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
        <Button
          variant="outline"
          onClick={handleVolverACampanas}
          disabled={isLoadingUpdate}
          className="w-full sm:w-auto"
        >
          Volver a Campañas
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            console.log('ResumenPage: Botón "Cancelar y Empezar de Nuevo" presionado.');
            resetAnuncioStore(); // Limpia el store local
            // El borrador en Firebase NO se elimina aquí. Solo a través del editor.
            router.replace('/bienvenida'); // Usar replace para una "salida limpia" del flujo
          }}
          disabled={isLoadingUpdate}
          className="w-full sm:w-auto"
        >
          Cancelar y Empezar de Nuevo
        </Button>
        <Button
          variant="primary"
          onClick={handleContinuar}
          disabled={isLoadingUpdate}
          className="w-full sm:w-auto flex-grow"
        >
          {isLoadingUpdate ? 'Guardando Cambios...' : (borradorId ? 'Guardar Cambios y Continuar' : 'Seleccionar Cantidad de Imágenes')}
        </Button>
      </div>
    </div>
  );
}