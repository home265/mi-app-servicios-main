// src/app/(main)/paginas-amarillas/editar/[creatorId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import PaginaAmarillaEditarForm from './components/PaginaAmarillaEditarForm';
import { PaginaAmarillaData, SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import type { Metadata, ResolvingMetadata } from 'next';

type PageProps = {
  params: { creatorId: string };
};

export async function generateMetadata(
  { params }: PageProps,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { creatorId } = params;
  return {
    title: `Editar Publicación ${creatorId} | Páginas Amarillas`,
  };
}

export default async function EditarPaginaAmarillaPage({ params }: PageProps) {
  const { creatorId } = params;

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
    fechaCreacion: (publicacionDb.fechaCreacion as Timestamp).toDate().toISOString(),
    fechaExpiracion: (publicacionDb.fechaExpiracion as Timestamp).toDate().toISOString(),
    ultimaModificacion: publicacionDb.ultimaModificacion ? (publicacionDb.ultimaModificacion as Timestamp).toDate().toISOString() : new Date().toISOString(),
    inicioCicloEdiciones: publicacionDb.inicioCicloEdiciones ? (publicacionDb.inicioCicloEdiciones as Timestamp).toDate().toISOString() : new Date().toISOString(),
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <PaginaAmarillaEditarForm publicacionInicial={serializablePublicacion} />
    </div>
  );
}