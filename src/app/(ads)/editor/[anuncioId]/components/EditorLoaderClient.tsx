// src/app/(ads)/editor/[anuncioId]/components/EditorLoaderClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import NextDynamic from 'next/dynamic';
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService'; // Tus funciones de servicio
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio, Captura, Elemento, ReelAnimationEffectType } from '@/types/anuncio';
import type { Timestamp } from 'firebase/firestore'; // Importar Timestamp

// Re-exportar Elemento puede ser útil si EditorConCarga lo usa directamente.
export type { Elemento } from '@/types/anuncio';

// Esta interfaz define la estructura de los datos que EditorConCarga espera.
// La creamos aquí porque EditorLoaderClient es responsable de proveer estos datos.
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
}

// Props que este componente recibirá ahora de la página del servidor (solo anuncioId)
interface EditorLoaderClientProps {
  anuncioId: string;
}

// Cargar EditorConCarga dinámicamente
const EditorConCarga = NextDynamic(() => import('../../components/EditorConCarga'), { // Asegúrate que la ruta sea correcta
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
      <p className="ml-4 text-xl">Cargando editor...</p>
    </div>
  ),
});

export default function EditorLoaderClient({ anuncioId }: EditorLoaderClientProps) {
  // Estado para almacenar los datos del anuncio una vez cargados
  const [datosPreparados, setDatosPreparados] = useState<DatosAnuncioParaEditorConCarga | null>(null);
  // Estado para la carga de datos
  const [isLoading, setIsLoading] = useState(true);
  // Estado para manejar errores durante la carga
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
      setDatosPreparados(null); // Limpiar datos previos antes de una nueva carga

      try {
        console.log(`[CLIENT] EditorLoaderClient: Iniciando carga para anuncio ID: ${anuncioId}`);
        const anuncio = await getAnuncioById(anuncioId);

        if (!anuncio || !anuncio.id) {
          console.warn(`[CLIENT] EditorLoaderClient: Anuncio con ID ${anuncioId} no encontrado o sin 'id'.`);
          // Usamos el mismo formato de error que la imagen que me mostraste
          setError(`No se pudieron obtener los detalles necesarios para editar el anuncio (ID: ${anuncioId}). Detalle del error: Anuncio no encontrado. Esto puede deberse a que el anuncio no existe o a un problema de permisos.`);
          return;
        }
        console.log(`[CLIENT] EditorLoaderClient: Anuncio cargado: status=${anuncio.status}, creatorId=${anuncio.creatorId}, plan=${anuncio.plan}`);

        if (!anuncio.plan || !anuncio.provincia || !anuncio.localidad) {
            console.error(`[CLIENT] EditorLoaderClient: Datos críticos faltantes en el anuncio cargado (plan, provincia, o localidad). Anuncio:`, anuncio);
            setError(`Error: Datos incompletos en el anuncio cargado (ID: ${anuncioId}). Faltan plan, provincia o localidad.`);
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
          // Comprobación segura de la función toDate
          if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
            return (timestamp as Timestamp).toDate();
          }
          console.warn('[CLIENT] EditorLoaderClient: Tipo de fecha inesperado, no se pudo convertir:', timestamp);
          return undefined; // Devolver undefined si no se puede convertir
        };
        
        // Construir el objeto con los datos listos para EditorConCarga
        setDatosPreparados({
          id: anuncio.id as string, // anuncio.id ya fue validado arriba
          maxScreens: anuncio.maxScreens,
          elementosPorPantalla: anuncio.elementosPorPantalla || {},
          animationEffectsPorPantalla: animationEffectsPorPantalla,
          status: anuncio.status,
          startDate: convertTimestampToDate(anuncio.startDate),
          endDate: convertTimestampToDate(anuncio.endDate),
          plan: anuncio.plan, // Ya validado que existe
          campaniaId: anuncio.campaniaId, // Es opcional, puede ser undefined
          provincia: anuncio.provincia, // Ya validado que existe
          localidad: anuncio.localidad, // Ya validado que existe
        });

      } catch (err) {
        // Este catch es crucial para los errores de permisos de Firestore
        console.error(`[CLIENT] EditorLoaderClient: Error CRÍTICO al cargar datos para el anuncio ${anuncioId}:`, err);
        let detail = "Error desconocido.";
        if (err instanceof Error) {
            detail = err.message; // Este message contendrá "Missing or insufficient permissions"
        } else if (typeof err === 'string') {
            detail = err;
        }
        // Formateamos el error para que coincida con tu captura de pantalla
        setError(`No se pudieron obtener los detalles necesarios para editar el anuncio (ID: ${anuncioId}). Detalle del error: ${detail}. Esto puede deberse a un problema de permisos o a que el anuncio no existe. Por favor, verifica las reglas de seguridad de Firebase o contacta a soporte.`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdData();
  }, [anuncioId]); // El useEffect se re-ejecuta si anuncioId cambia

  // Estado de Carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
        <p className="ml-4 text-xl">Cargando datos del anuncio...</p>
      </div>
    );
  }

  // Estado de Error (muestra el mensaje como en tu captura)
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error al Cargar Datos del Anuncio</h1>
        {/* Mostramos el mensaje de error formateado */}
        <p className="text-texto-secundario whitespace-pre-line">{error}</p>
      </div>
    );
  }

  // Si no hay datos preparados (y no hay error ni está cargando)
  if (!datosPreparados) {
    // Esto podría ser un estado transitorio o un error no manejado explícitamente arriba.
    // Es una salvaguarda.
    console.error("EditorLoaderClient: No hay datos preparados para renderizar y no hay error explícito.");
    return (
        <div className="flex items-center justify-center h-screen text-orange-500">
            <p>Advertencia: No se pudieron preparar los datos del anuncio para el editor.</p>
        </div>
    );
  }
  
  // Si todo está bien y los datos están listos, renderizar EditorConCarga
  return (
    <div className="editor-page-layout">
      <EditorConCarga anuncioParaCargar={datosPreparados} />
    </div>
  );
}