// src/app/(ads)/editor/[anuncioId]/components/EditorLoaderClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import NextDynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'; // Importar useRouter
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio, Captura, Elemento, ReelAnimationEffectType } from '@/types/anuncio';
import type { Timestamp } from 'firebase/firestore';

export type { Elemento } from '@/types/anuncio';

// La interfaz de datos no cambia
interface DatosAnuncioParaEditorConCarga {
  id: string;
  maxScreens: number;
  elementosPorPantalla: Record<string, Elemento[]>;
  animationEffectsPorPantalla: Record<string, ReelAnimationEffectType | undefined>;
  status: Anuncio['status'];
  startDate?: Date;
  endDate?: Date;
  plan: Anuncio['plan'];
  campaniaId?: Anuncio['campaniaId'];
  provincia: string;
  localidad: string;
  creatorId: string;
}

interface EditorLoaderClientProps {
  anuncioId: string;
}

// La importación dinámica de EditorConCarga se mantiene igual
const EditorConCarga = NextDynamic(() => import('../../components/EditorConCarga'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
      <p className="ml-4 text-xl">Cargando editor...</p>
    </div>
  ),
});

export default function EditorLoaderClient({ anuncioId }: EditorLoaderClientProps) {
  // --- LÓGICA DE ESTADO SIMPLIFICADA ---
  const router = useRouter();
  const [datosPreparados, setDatosPreparados] = useState<DatosAnuncioParaEditorConCarga | null>(null);
  // Mantenemos isLoading para mostrar un spinner inicial y evitar un parpadeo.
  const [isLoading, setIsLoading] = useState(true);
  // Eliminamos el estado de 'error', ya que ahora solo redirigimos.

  useEffect(() => {
    // --- LÓGICA DE CARGA Y REDIRECCIÓN ROBUSTA ---
    let isMounted = true; // Flag para evitar actualizaciones en un componente desmontado

    const fetchAdData = async () => {
      // Si no hay anuncioId, no hay nada que hacer, redirigir inmediatamente.
      if (!anuncioId) {
        router.replace('/bienvenida');
        return;
      }

      try {
        console.log(`[CLIENT] Iniciando carga para anuncio ID: ${anuncioId}`);
        const anuncio = await getAnuncioById(anuncioId);

        // **Punto clave**: si el anuncio no existe, redirigir y no hacer nada más.
        if (!anuncio || !anuncio.id) {
          if (isMounted) {
            console.warn(`[CLIENT] Anuncio con ID ${anuncioId} no encontrado. Redirigiendo a bienvenida.`);
            router.replace('/bienvenida');
          }
          return;
        }

        // Si el anuncio existe pero le faltan datos críticos, también redirigir.
        if (!anuncio.plan || !anuncio.provincia || !anuncio.localidad || !anuncio.creatorId) {
          if (isMounted) {
            console.error(`[CLIENT] Faltan datos críticos en el anuncio ${anuncioId}. Redirigiendo.`);
            router.replace('/bienvenida');
          }
          return;
        }

        // --- Si todo está OK, proceder a preparar los datos ---
        const capturasDelAnuncio = await listCapturas(anuncio.id);
        const animationEffectsPorPantalla: Record<string, ReelAnimationEffectType | undefined> = {};
        capturasDelAnuncio.forEach((captura) => {
          if (captura.animationEffect) {
            animationEffectsPorPantalla[String(captura.screenIndex)] = captura.animationEffect;
          }
        });

        const convertTimestampToDate = (timestamp: Timestamp | Date | undefined): Date | undefined => {
          if (!timestamp) return undefined;
          if (timestamp instanceof Date) return timestamp;
          return (timestamp as Timestamp).toDate();
        };

        const datosParaEditor = {
          id: anuncio.id,
          maxScreens: anuncio.maxScreens,
          elementosPorPantalla: anuncio.elementosPorPantalla || {},
          animationEffectsPorPantalla,
          status: anuncio.status,
          startDate: convertTimestampToDate(anuncio.startDate),
          endDate: convertTimestampToDate(anuncio.endDate),
          plan: anuncio.plan,
          campaniaId: anuncio.campaniaId,
          provincia: anuncio.provincia,
          localidad: anuncio.localidad,
          creatorId: anuncio.creatorId,
        };
        
        // Solo actualizar el estado si el componente sigue montado.
        if (isMounted) {
          setDatosPreparados(datosParaEditor);
          setIsLoading(false);
        }

      } catch (err) {
        // Si cualquier parte del 'try' falla (ej. error de permisos), redirigir.
        if (isMounted) {
          console.error(`[CLIENT] Error CRÍTICO al cargar datos para el anuncio ${anuncioId}. Redirigiendo.`, err);
          router.replace('/bienvenida');
        }
      }
    };

    fetchAdData();

    // Función de limpieza para el useEffect
    return () => {
      isMounted = false;
    };
  }, [anuncioId, router]); // Dependencias del efecto

  // --- LÓGICA DE RENDERIZADO SIMPLIFICADA ---
  
  // Mientras isLoading es true, mostrar un spinner.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
        <p className="ml-4 text-xl">Cargando datos del anuncio...</p>
      </div>
    );
  }

  // Si la carga terminó y tenemos datos, renderizar el editor.
  if (datosPreparados) {
    return (
      <div className="editor-page-layout">
        <EditorConCarga anuncioParaCargar={datosPreparados} />
      </div>
    );
  }
  
  // En cualquier otro caso (como durante la redirección), no renderizar nada.
  return null;
}