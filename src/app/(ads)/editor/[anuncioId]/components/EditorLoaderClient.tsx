// src/app/(ads)/editor/[anuncioId]/components/EditorLoaderClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import NextDynamic from 'next/dynamic';
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio, Captura, Elemento, ReelAnimationEffectType } from '@/types/anuncio';
import type { Timestamp } from 'firebase/firestore';

export type { Elemento } from '@/types/anuncio';

// Esta interfaz define la estructura de los datos que EditorConCarga espera.
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
  creatorId: string; // <--- Propiedad añadida
}

interface EditorLoaderClientProps {
  anuncioId: string;
}

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
  const [datosPreparados, setDatosPreparados] = useState<DatosAnuncioParaEditorConCarga | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!anuncioId) {
      setError("ID de anuncio no válido o no proporcionado.");
      setIsLoading(false);
      return;
    }

    const fetchAdData = async () => {
      setIsLoading(true);
      setError(null);
      setDatosPreparados(null);

      try {
        console.log(`[CLIENT] EditorLoaderClient: Iniciando carga para anuncio ID: ${anuncioId}`);
        const anuncio = await getAnuncioById(anuncioId);

        if (!anuncio || !anuncio.id) {
          console.warn(`[CLIENT] EditorLoaderClient: Anuncio con ID ${anuncioId} no encontrado o sin 'id'.`);
          setError(`No se pudieron obtener los detalles necesarios para editar el anuncio (ID: ${anuncioId}). Detalle del error: Anuncio no encontrado. Esto puede deberse a que el anuncio no existe o a un problema de permisos.`);
          setIsLoading(false); // Asegurar que isLoading se actualiza
          return;
        }
        console.log(`[CLIENT] EditorLoaderClient: Anuncio cargado: status=${anuncio.status}, creatorId=${anuncio.creatorId}, plan=${anuncio.plan}`);

        // Validar campos críticos, incluyendo creatorId
        if (!anuncio.plan || !anuncio.provincia || !anuncio.localidad || !anuncio.creatorId) {
            console.error(`[CLIENT] EditorLoaderClient: Datos críticos faltantes en el anuncio cargado (plan, provincia, localidad, o creatorId). Anuncio:`, anuncio);
            setError(`Error: Datos incompletos en el anuncio cargado (ID: ${anuncioId}). Faltan plan, provincia, localidad o creatorId.`);
            setIsLoading(false); // Asegurar que isLoading se actualiza
            return;
        }

        console.log(`[CLIENT] EditorLoaderClient: Intentando cargar capturas para anuncio ID: ${anuncio.id}`);
        const capturasDelAnuncio = await listCapturas(anuncio.id);
        console.log(`[CLIENT] EditorLoaderClient: Capturas cargadas: ${capturasDelAnuncio.length}`);

        const animationEffectsPorPantalla: Record<string, ReelAnimationEffectType | undefined> = {};
        if (capturasDelAnuncio.length > 0) {
          capturasDelAnuncio.forEach((captura) => {
            if (captura.animationEffect) {
              animationEffectsPorPantalla[String(captura.screenIndex)] = captura.animationEffect;
            }
          });
        }

        const convertTimestampToDate = (timestamp: Timestamp | Date | undefined): Date | undefined => {
          if (!timestamp) return undefined;
          if (timestamp instanceof Date) return timestamp;
          if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
            return (timestamp as Timestamp).toDate();
          }
          console.warn('[CLIENT] EditorLoaderClient: Tipo de fecha inesperado, no se pudo convertir:', timestamp);
          return undefined;
        };
        
        setDatosPreparados({
          id: anuncio.id, 
          maxScreens: anuncio.maxScreens,
          elementosPorPantalla: anuncio.elementosPorPantalla || {},
          animationEffectsPorPantalla: animationEffectsPorPantalla,
          status: anuncio.status,
          startDate: convertTimestampToDate(anuncio.startDate),
          endDate: convertTimestampToDate(anuncio.endDate),
          plan: anuncio.plan,
          campaniaId: anuncio.campaniaId,
          provincia: anuncio.provincia,
          localidad: anuncio.localidad,
          creatorId: anuncio.creatorId, // <--- CAMBIO: creatorId añadido al objeto
        });

      } catch (err) {
        console.error(`[CLIENT] EditorLoaderClient: Error CRÍTICO al cargar datos para el anuncio ${anuncioId}:`, err);
        let detail = "Error desconocido.";
        if (err instanceof Error) {
            detail = err.message;
        } else if (typeof err === 'string') {
            detail = err;
        }
        setError(`No se pudieron obtener los detalles necesarios para editar el anuncio (ID: ${anuncioId}). Detalle del error: ${detail}. Esto puede deberse a un problema de permisos o a que el anuncio no existe. Por favor, verifica las reglas de seguridad de Firebase o contacta a soporte.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdData();
  }, [anuncioId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
        <p className="ml-4 text-xl">Cargando datos del anuncio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error al Cargar Datos del Anuncio</h1>
        <p className="text-texto-secundario whitespace-pre-line">{error}</p>
      </div>
    );
  }

  if (!datosPreparados) {
    console.error("EditorLoaderClient: No hay datos preparados para renderizar y no hay error explícito, pero tampoco está cargando.");
    // Este caso podría indicar un flujo inesperado o un error no capturado que dejó datosPreparados como null.
    // Devolver un mensaje de error genérico o específico si se puede deducir más.
    return (
        <div className="flex items-center justify-center h-screen text-orange-500">
            <p>Advertencia: No se pudieron preparar completamente los datos del anuncio para el editor. Intenta recargar la página.</p>
        </div>
    );
  }
  
  return (
    <div className="editor-page-layout">
      <EditorConCarga anuncioParaCargar={datosPreparados} />
    </div>
  );
}