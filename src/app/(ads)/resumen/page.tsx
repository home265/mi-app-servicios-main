// src/app/(ads)/resumen/page.tsx
'use client';

import React, { useState, useEffect } from 'react'; // useEffect re-añadido
import { useRouter, useSearchParams } from 'next/navigation';
import { planes, campanias, Plan, Campania, PlanId, CampaniaId } from '@/lib/constants/anuncios'; // Tipos PlanId y CampaniaId importados para claridad
import { useAnuncioStore } from '@/store/anuncioStore';
import { updateAnuncio } from '@/lib/services/anunciosService';
import type { Anuncio } from '@/types/anuncio';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';


export default function ResumenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const borradorId = searchParams.get('borradorId');

  // Valores del store. Con 'persist', estos se hidratarán desde localStorage.
  const planIdFromStore: PlanId | null = useAnuncioStore(state => state.planId);
  const campaniaIdFromStore: CampaniaId | null = useAnuncioStore(state => state.campaniaId);
  const screensCountFromStore = useAnuncioStore(state => state.screensCount); // Para handleContinuar
  const resetAnuncioStore = useAnuncioStore(state => state.reset);

  const [isLoadingUpdate, setIsLoadingUpdate] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false); // Flag para el montaje en cliente

  useEffect(() => {
    setMounted(true); // Se activa solo en el cliente después del montaje inicial
  }, []);

  // Derivamos planSeleccionado y campaniaSeleccionada después del montaje
  // y cuando los IDs del store estén disponibles y sean válidos.
  // Estos serán undefined si los IDs son null o no válidos, lo que ayudará en la lógica de carga/redirección.
  const planSeleccionado: Plan | undefined = mounted
    ? planes.find(p => p.id === planIdFromStore)
    : undefined;
  const campaniaSeleccionada: Campania | undefined = mounted
    ? campanias.find(c => c.id === campaniaIdFromStore)
    : undefined;

  // useEffect para la lógica de redirección
  useEffect(() => {
    if (mounted) {
      if (!planIdFromStore) {
        console.log('ResumenPage (cliente): Falta planId, redirigiendo a /planes...');
        router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
      } else if (!campaniaIdFromStore) {
        console.log('ResumenPage (cliente): Falta campaniaId, redirigiendo a /campanas...');
        router.replace(borradorId ? `/campanas?borradorId=${borradorId}&planId=${planIdFromStore}` : `/campanas?planId=${planIdFromStore}`);
      } else if (!planSeleccionado) {
        // planIdFromStore existe pero no es un ID válido en `planes`
        console.error(`ResumenPage (cliente): planId "${planIdFromStore}" del store no es válido. Redirigiendo a /planes...`);
        router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
      } else if (!campaniaSeleccionada) {
        // campaniaIdFromStore existe pero no es un ID válido en `campanias`
        console.error(`ResumenPage (cliente): campaniaId "${campaniaIdFromStore}" del store no es válido. Redirigiendo a /campanas...`);
        router.replace(borradorId ? `/campanas?borradorId=${borradorId}&planId=${planIdFromStore}` : `/campanas?planId=${planIdFromStore}`);
      }
    }
  }, [mounted, planIdFromStore, campaniaIdFromStore, planSeleccionado, campaniaSeleccionada, borradorId, router]);

  const handleVolverACampanas = () => {
    // Aseguramos que planIdFromStore sea válido antes de usarlo en la URL
    if (planIdFromStore) {
      router.push(borradorId ? `/campanas?borradorId=${borradorId}&planId=${planIdFromStore}` : `/campanas?planId=${planIdFromStore}`);
    } else {
      // Si por alguna razón planIdFromStore es null aquí (no debería si la lógica de redirección funciona),
      // al menos redirigir a /planes para evitar errores.
      router.push(borradorId ? `/planes?borradorId=${borradorId}` : '/planes');
    }
  };

  const handleContinuar = async () => {
    if (!planSeleccionado || !campaniaSeleccionada || screensCountFromStore === null) {
      console.error('ResumenPage: Faltan datos para continuar (plan, campaña o screensCount).');
      // Podrías añadir una notificación al usuario aquí.
      return;
    }

    setIsLoadingUpdate(true);
    try {
      if (borradorId) {
        // Actualizar el borrador existente
        const updateData: Partial<Anuncio> = {
          plan: planSeleccionado.id,
          campaniaId: campaniaSeleccionada.id,
          maxScreens: screensCountFromStore, // Asumiendo que screensCountFromStore es el maxScreens deseado
          // campaignDurationDays se podría recalcular aquí si es necesario, o ya estar en el borrador
        };
        await updateAnuncio(borradorId, updateData);
        console.log('ResumenPage: Borrador actualizado con éxito.');
      }
      // Navegar a la siguiente página (selección de cantidad de imágenes/pantallas)
      // Llevamos todos los IDs relevantes en la URL para mantener el contexto.
      router.push(`/resumen/count?planId=${planSeleccionado.id}&campaniaId=${campaniaSeleccionada.id}${borradorId ? `&borradorId=${borradorId}` : ''}`);
    } catch (error) {
      console.error('ResumenPage: Error al actualizar el borrador o continuar:', error);
      // Aquí podrías mostrar una notificación de error al usuario.
    } finally {
      setIsLoadingUpdate(false);
    }
  };

  // Muestra el loader si el componente aún no se ha montado en el cliente,
  // o si planSeleccionado o campaniaSeleccionada aún no están definidos (lo que
  // indica que la data del store aún no está lista o es inválida, y una redirección
  // debería estar en proceso a través del useEffect).
  if (!mounted || !planSeleccionado || !campaniaSeleccionada) {
    return (
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p className="text-xl">Cargando resumen del anuncio...</p>
      </div>
    );
  }

  // Si llegamos aquí, planSeleccionado y campaniaSeleccionada están definidos y son válidos.
  const precioTotalConDescuento = planSeleccionado.priceARS * campaniaSeleccionada.months * (1 - campaniaSeleccionada.discount);

  return (
    <div className="min-h-screen bg-fondo text-texto p-4 flex flex-col items-center">
      
      {/* --- Encabezado con título y botón de ayuda alineados --- */}
      <div className="flex items-center justify-center gap-4 w-full mb-10 mt-8">
        <h1 className="text-3xl font-bold text-primario text-center">
          Resumen
        </h1>
        <BotonAyuda>
          <AyudaCrearEditarAnuncio fase="fase1c" />
        </BotonAyuda>
      </div>

      {/* --- Tarjeta de Resumen con estilo 3D --- */}
      <div className="w-full max-w-2xl p-6 bg-tarjeta rounded-2xl 
                     shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-texto-principal mb-2">Plan Seleccionado</h2>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Nombre:</span> {planSeleccionado.name}</p>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Precio Base Mensual:</span> ${planSeleccionado.priceARS.toLocaleString('es-AR')} ARS</p>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Imágenes Máximas por Pantalla:</span> {planSeleccionado.maxImages}</p>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Duración por Imagen:</span> {planSeleccionado.durationSeconds}s</p>
          </div>

          <div className="border-t border-borde-tarjeta"></div>

          <div>
            <h2 className="text-xl font-semibold text-texto-principal mb-2">Campaña Seleccionada</h2>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Tipo:</span> {campaniaSeleccionada.name}</p>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Duración:</span> {campaniaSeleccionada.months} {campaniaSeleccionada.months > 1 ? 'meses' : 'mes'}</p>
            <p className="text-texto-secundario"><span className="font-medium text-texto-principal">Descuento Aplicado:</span> {campaniaSeleccionada.discount * 100}%</p>
          </div>

          <div className="border-t border-borde-tarjeta"></div>

          <div>
            <h2 className="text-2xl font-bold text-primario mb-3">Costo Total Estimado</h2>
            <p className="text-3xl font-bold text-texto-principal mb-1">
              ${precioTotalConDescuento.toLocaleString('es-AR')} ARS
            </p>
            <p className="text-xs text-texto-secundario opacity-80">
              (Este es el costo total por {campaniaSeleccionada.months} {campaniaSeleccionada.months > 1 ? 'meses' : 'mes'} de servicio con el plan y campaña seleccionados)
            </p>
          </div>
        </div>
      </div>

      {/* --- Botones de Acción con estilo 3D --- */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mt-8">
        <button
          onClick={handleVolverACampanas}
          disabled={isLoadingUpdate}
          className="
            inline-flex items-center justify-center
            px-4 py-2 rounded-xl text-sm font-medium text-texto-secundario
            bg-tarjeta
            shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
            transition-all duration-150 ease-in-out
            hover:text-primario hover:brightness-110
            active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Volver a Campañas
        </button>
        <button
          onClick={() => {
            console.log('ResumenPage: Botón "Cancelar y Empezar de Nuevo" presionado.');
            resetAnuncioStore();
            router.replace('/bienvenida');
          }}
          disabled={isLoadingUpdate}
          className="
            inline-flex items-center justify-center
            px-4 py-2 rounded-xl text-sm font-medium text-texto-secundario
            bg-tarjeta
            shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
            transition-all duration-150 ease-in-out
            hover:text-primario hover:brightness-110
            active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          Cancelar y Empezar de Nuevo
        </button>
        <button
          onClick={handleContinuar}
          disabled={isLoadingUpdate}
          className="btn-primary w-full sm:w-auto flex-grow"
        >
          {isLoadingUpdate ? 'Guardando Cambios...' : (borradorId ? 'Guardar Cambios y Continuar' : 'Seleccionar Cantidad de Imágenes')}
        </button>
      </div>
    </div>
  );
}