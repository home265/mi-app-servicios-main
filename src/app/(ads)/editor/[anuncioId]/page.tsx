// src/app/(ads)/editor/[anuncioId]/page.tsx
// NINGÚN CAMBIO FUNCIONAL EN ESTE ARCHIVO. AÑADIDOS LOGS PARA DEPURAR PERMISOS.

import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { notFound, redirect } from 'next/navigation'; // Importar redirect
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService';
import type { Anuncio, Captura, ReelAnimationEffectType, Elemento } from '@/types/anuncio';
import type { Timestamp } from 'firebase/firestore';

// IMPORTAR EL COMPONENTE CLIENTE INTERMEDIARIO
import EditorLoaderClient from './components/EditorLoaderClient';

// (El resto de tus interfaces se mantienen igual)
interface EditarAnuncioPageProps {
  // ⬇️ params ahora es una Promesa, tal como exige PageProps en Next.js 15
  params: Promise<{
    anuncioId: string;
  }>;
}

interface DatosAnuncioParaEditor {
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

export const dynamic = 'force-dynamic';

export default async function EditarAnuncioPage({ params }: EditarAnuncioPageProps) {
  // Desempaqueta params como promesa y awaitea antes de usarlo
  const { anuncioId } = await params;

  console.log(`[SSR] EditarAnuncioPage: Iniciando para anuncioId: ${anuncioId}`);

  if (!anuncioId || typeof anuncioId !== 'string' || anuncioId.trim() === '') {
    console.error('[SSR] EditarAnuncioPage: anuncioId inválido o faltante.');
    notFound();
  }

  // Intenta obtener la sesión del usuario actual aquí si tu autenticación lo permite
  // Por ejemplo, con NextAuth.js:
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   console.log('[SSR] EditarAnuncioPage: Usuario no autenticado. Redirigiendo a login.');
  //   redirect('/login'); // O tu página de login
  // }
  // const currentUserId = session.user.id;
  // console.log(`[SSR] EditarAnuncioPage: Usuario actual (simulado para prueba): ${currentUserId}`);
  // Si no tienes una forma estándar de obtener el UID en Server Components que el SDK cliente de Firebase reconozca,
  // tus reglas que dependen de request.auth.uid fallarán desde el servidor.

  let anuncio: Anuncio | null = null;
  let capturasDelAnuncio: Captura[] = [];

  try {
    console.log(`[SSR] EditarAnuncioPage: Intentando cargar anuncio con ID: ${anuncioId}`);
    anuncio = await getAnuncioById(anuncioId); // Esta llamada usa el SDK cliente

    if (!anuncio || !anuncio.id) {
      console.warn(`[SSR] EditarAnuncioPage: Anuncio con ID ${anuncioId} no encontrado en DB o sin campo 'id'.`);
      notFound();
    }
    console.log(`[SSR] EditarAnuncioPage: Anuncio cargado: status=${anuncio.status}, creatorId=${anuncio.creatorId}`);

    // Comprobación simulada de permisos (esta lógica debería estar en tus reglas de Firebase)
    // if (anuncio.status !== 'active' && anuncio.creatorId !== currentUserId /* && !userIsAdmin */) {
    //   console.error(`[SSR] EditarAnuncioPage: PERMISO DENEGADO SIMULADO - El usuario ${currentUserId} no puede leer el anuncio ${anuncioId} con status ${anuncio.status}.`);
    //   // Aquí podrías lanzar un error o redirigir si la lógica de permisos se hiciera aquí
    //   // throw new Error("Permiso denegado para acceder a este borrador.");
    // }

    console.log(`[SSR] EditarAnuncioPage: Intentando cargar capturas para anuncio ID: ${anuncio.id}`);
    capturasDelAnuncio = await listCapturas(anuncio.id); // Esta llamada usa el SDK cliente
    console.log(`[SSR] EditarAnuncioPage: Capturas cargadas: ${capturasDelAnuncio.length}`);
  } catch (error) {
    console.error(`[SSR] EditarAnuncioPage: Error CRÍTICO al cargar datos para el anuncio ${anuncioId}:`, error);

    // Renderizar un mensaje de error más específico
    // No podemos usar hooks como useRouter aquí, pero podemos devolver un JSX de error.
    // Este bloque de error ya estaba en tu código y es bueno.
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error al Cargar Datos del Anuncio</h1>
        <p>No se pudieron obtener los detalles necesarios para editar el anuncio (ID: {anuncioId}).</p>
        <p className="text-sm mt-2">Detalle del error: {error instanceof Error ? error.message : String(error)}</p>
        <p className="text-sm mt-2">Esto puede deberse a un problema de permisos o a que el anuncio no existe.</p>
        <p className="text-sm mt-1">Por favor, verifica las reglas de seguridad de Firebase o contacta a soporte.</p>
      </div>
    );
  }

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
    if (typeof (timestamp as Timestamp).toDate === 'function') {
      return (timestamp as Timestamp).toDate();
    }
    console.warn('[SSR] EditarAnuncioPage: Se recibió un tipo de fecha inesperado que no se pudo convertir:', timestamp);
    return undefined;
  };

  const datosAnuncioParaEditor: DatosAnuncioParaEditor = {
    id: anuncio.id as string, // anuncio.id ya fue validado, por lo que no será null
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
  };

  return <EditorLoaderClient datosAnuncioParaEditor={datosAnuncioParaEditor} />;
}
