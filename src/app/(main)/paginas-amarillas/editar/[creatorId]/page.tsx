// src/app/(main)/paginas-amarillas/editar/[creatorId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import PaginaAmarillaEditarForm from './components/PaginaAmarillaEditarForm';
import { PaginaAmarillaData, SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import type { Metadata, ResolvingMetadata } from 'next';

// Se ajusta el tipo para reflejar que `params` es una Promesa.
type PageProps = {
  params: Promise<{ creatorId: string }>;
};

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  // Se usa 'await' para resolver la promesa y obtener el creatorId.
  const { creatorId } = await params;
  return {
    title: `Editar Publicación ${creatorId} | Páginas Amarillas`,
  };
}

export default async function EditarPaginaAmarillaPage({ params }: PageProps) {
  // Se usa 'await' aquí también para obtener el creatorId.
  const { creatorId } = await params;

  if (!creatorId) {
    notFound();
  }

  const publicacionDb: PaginaAmarillaData | null = await getPaginaAmarilla(creatorId);
  if (!publicacionDb) {
    notFound();
  }

  // Serializa los Timestamps de Firebase a strings ISO para que el componente sea compatible con Server Components.
  const serializablePublicacion: SerializablePaginaAmarillaData = {
    ...publicacionDb,
    // Campos que ya se convertían
    fechaCreacion: (publicacionDb.fechaCreacion as Timestamp).toDate().toISOString(),
    fechaExpiracion: (publicacionDb.fechaExpiracion as Timestamp).toDate().toISOString(),
    inicioCicloEdiciones: (publicacionDb.inicioCicloEdiciones as Timestamp).toDate().toISOString(),

    // --- CORRECCIÓN APLICADA AQUÍ ---
    // Se añade una comprobación para manejar de forma segura los campos de fecha opcionales.
    ultimaModificacion: publicacionDb.ultimaModificacion ? (publicacionDb.ultimaModificacion as Timestamp).toDate().toISOString() : null,
    subscriptionStartDate: publicacionDb.subscriptionStartDate ? (publicacionDb.subscriptionStartDate as Timestamp).toDate().toISOString() : null,
    subscriptionEndDate: publicacionDb.subscriptionEndDate ? (publicacionDb.subscriptionEndDate as Timestamp).toDate().toISOString() : null,
    updatedAt: publicacionDb.updatedAt ? (publicacionDb.updatedAt as Timestamp).toDate().toISOString() : null,
    paymentConfirmedAt: publicacionDb.paymentConfirmedAt ? (publicacionDb.paymentConfirmedAt as Timestamp).toDate().toISOString() : null,
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 bg-fondo">
      <PaginaAmarillaEditarForm publicacionInicial={serializablePublicacion} />
    </div>
  );
}