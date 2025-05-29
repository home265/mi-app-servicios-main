// src/app/(ads)/editor/[anuncioId]/components/EditorLoaderClient.tsx
'use client';

import React from 'react';
import NextDynamic from 'next/dynamic';
import type { Anuncio, Elemento, ReelAnimationEffectType } from '@/types/anuncio';
// Re-exportar Elemento es una buena práctica si EditorConCarga lo usa directamente en su definición de props
// y quieres mantener los tipos centralizados o evitar importaciones relativas largas en EditorConCarga.
export type { Elemento } from '@/types/anuncio';

// Props que este componente recibirá de la página del servidor
interface EditorLoaderClientProps {
  datosAnuncioParaEditor: {
    id: string;
    maxScreens: number;
    elementosPorPantalla: Record<string, Elemento[]>;
    animationEffectsPorPantalla: Record<string, ReelAnimationEffectType | undefined>;
    status: Anuncio['status'];
    startDate?: Date;
    endDate?: Date;
    // --- CAMPOS AÑADIDOS PARA COINCIDIR CON LO QUE ENVÍA EditarAnuncioPage ---
    plan: Anuncio['plan'];
    campaniaId?: Anuncio['campaniaId']; // campaniaId es opcional en el tipo Anuncio
    provincia: string;
    localidad: string;
  };
}

// Cargar EditorConCarga dinámicamente DENTRO del componente cliente
const EditorConCarga = NextDynamic(() => import('../../components/EditorConCarga'), {
  ssr: false, // Ahora esto es permitido porque estamos en un Client Component
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="w-16 h-16 border-4 border-gray-300 border-t-primario rounded-full animate-spin"></div>
      <p className="ml-4 text-xl">Cargando editor...</p>
    </div>
  ),
});

export default function EditorLoaderClient({ datosAnuncioParaEditor }: EditorLoaderClientProps) {
  // Verificación robusta de que los datos necesarios están presentes
  if (
    !datosAnuncioParaEditor ||
    !datosAnuncioParaEditor.id ||
    !datosAnuncioParaEditor.plan || // Verificar campos ahora requeridos
    !datosAnuncioParaEditor.provincia ||
    !datosAnuncioParaEditor.localidad
  ) {
    console.error("EditorLoaderClient: Faltan datos críticos en datosAnuncioParaEditor", datosAnuncioParaEditor);
    return (
        <div className="flex items-center justify-center h-screen text-red-500">
            <p>Error: No se pudieron cargar completamente los datos del anuncio para el editor.</p>
        </div>
    );
  }

  return (
    <div className="editor-page-layout">
      {/* Ahora datosAnuncioParaEditor tiene la forma esperada por EditorConCarga */}
      <EditorConCarga anuncioParaCargar={datosAnuncioParaEditor} />
    </div>
  );
}