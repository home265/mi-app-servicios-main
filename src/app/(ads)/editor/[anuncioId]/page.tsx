// src/app/(ads)/editor/[anuncioId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation'; // redirect no se usa aquí ahora
// Ya no necesitamos getAnuncioById, listCapturas, ni los tipos Anuncio, Captura, Timestamp aquí
// porque el fetching se mueve al cliente.
// Elemento y ReelAnimationEffectType podrían seguir siendo necesarios si EditorLoaderClient los exporta
// o si se usan para definir props que se pasan indirectamente. Por ahora, los comentamos.
// import type { Anuncio, Captura, ReelAnimationEffectType, Elemento } from '@/types/anuncio';
// import type { Timestamp } from 'firebase/firestore';

// IMPORTAR EL COMPONENTE CLIENTE INTERMEDIARIO
import EditorLoaderClient from './components/EditorLoaderClient'; // Asegúrate que la ruta sea correcta

interface EditarAnuncioPageProps {
  // params sigue siendo una Promesa, como exige PageProps en Next.js 15
  // pero ahora solo necesitamos anuncioId de ella.
  params: Promise<{
    anuncioId: string;
  }>;
}

// La interfaz DatosAnuncioParaEditor ya no es necesaria aquí,
// ya que este componente no la construirá ni la pasará directamente.
// EditorLoaderClient se encargará de definir y obtener esos datos.

export const dynamic = 'force-dynamic'; // Mantener si quieres asegurar renderizado dinámico

// Ya no es una función async default, porque no hace await para el fetching aquí.
// Sigue siendo async por la prop `params: Promise`
export default async function EditarAnuncioPage({ params }: EditarAnuncioPageProps) {
  // Desempaqueta params como promesa y awaitea antes de usarlo
  const { anuncioId } = await params;

  console.log(`[PAGE SSR-Shell] EditarAnuncioPage: Renderizando shell para anuncioId: ${anuncioId}`);

  if (!anuncioId || typeof anuncioId !== 'string' || anuncioId.trim() === '') {
    console.error('[PAGE SSR-Shell] EditarAnuncioPage: anuncioId inválido o faltante.');
    notFound();
  }

  // Toda la lógica de fetching (try-catch, getAnuncioById, listCapturas, convertTimestampToDate, etc.)
  // se elimina de este Server Component.

  // Simplemente pasamos el anuncioId al componente cliente.
  // EditorLoaderClient se encargará de:
  // 1. Obtener los datos del anuncio y las capturas.
  // 2. Manejar los estados de carga y error.
  // 3. Preparar los datos para EditorConCarga.
  // 4. Renderizar EditorConCarga o los mensajes de carga/error.
  return <EditorLoaderClient anuncioId={anuncioId} />;
}