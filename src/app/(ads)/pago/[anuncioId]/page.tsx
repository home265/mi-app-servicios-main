// src/app/(ads)/pago/[anuncioId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
// Importamos el futuro PagoLoaderClient
import PagoLoaderClient from '../[anuncioId]/components/PagoLoaderClient'; // Crearemos este archivo

interface PagoPageProps {
  params: Promise<{ // params sigue siendo una Promesa
    anuncioId: string;
  }>;
}

export const dynamic = 'force-dynamic'; // Mantener si es necesario

// La función sigue siendo async debido a params: Promise
export default async function PagoPage({ params }: PagoPageProps) {
  const { anuncioId } = await params; // Extraer anuncioId

  console.log(`[PAGE SSR-SHELL /pago] Renderizando shell para anuncioId: ${anuncioId}`);

  if (!anuncioId || typeof anuncioId !== 'string' || anuncioId.trim() === '') {
    console.error('[PAGE SSR-SHELL /pago] anuncioId inválido o faltante.');
    notFound();
  }

  // Toda la lógica de cargar anuncio, planDetails, campaniaDetails, calcular precio, etc.,
  // se moverá a PagoLoaderClient.tsx.
  // Este Server Component ahora solo pasa el anuncioId.

  return <PagoLoaderClient anuncioId={anuncioId} />;
}