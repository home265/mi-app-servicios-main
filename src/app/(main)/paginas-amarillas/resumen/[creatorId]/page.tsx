import React from 'react';
import { notFound } from 'next/navigation';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { Timestamp } from 'firebase/firestore';
import ResumenClient from './components/ResumenClient';

interface PageProps {
  // Corregido: params es una Promesa
  params: Promise<{ creatorId: string }>;
}

// Este componente busca los datos en el servidor
export default async function ResumenPage({ params }: PageProps) {
  // --- INICIO DE LA CORRECCIÓN ---
  // 'params' es una Promesa, por lo que debemos usar 'await' para obtener su valor.
  const { creatorId } = await params;
  // --- FIN DE LA CORRECCIÓN ---

  if (!creatorId) {
    notFound();
  }

  const publicacionDb = await getPaginaAmarilla(creatorId);
  if (!publicacionDb) {
    notFound();
  }

  // Serializamos TODOS los Timestamps a strings para pasarlos al componente de cliente
  const serializablePublicacion: SerializablePaginaAmarillaData = {
    ...publicacionDb,
    fechaCreacion: (publicacionDb.fechaCreacion as Timestamp).toDate().toISOString(),
    fechaExpiracion: (publicacionDb.fechaExpiracion as Timestamp).toDate().toISOString(),
    ultimaModificacion: publicacionDb.ultimaModificacion ? (publicacionDb.ultimaModificacion as Timestamp).toDate().toISOString() : null,
    inicioCicloEdiciones: (publicacionDb.inicioCicloEdiciones as Timestamp).toDate().toISOString(),
    subscriptionStartDate: publicacionDb.subscriptionStartDate ? (publicacionDb.subscriptionStartDate as Timestamp).toDate().toISOString() : null,
    subscriptionEndDate: publicacionDb.subscriptionEndDate ? (publicacionDb.subscriptionEndDate as Timestamp).toDate().toISOString() : null,
    updatedAt: publicacionDb.updatedAt ? (publicacionDb.updatedAt as Timestamp).toDate().toISOString() : null,
    paymentConfirmedAt: publicacionDb.paymentConfirmedAt ? (publicacionDb.paymentConfirmedAt as Timestamp).toDate().toISOString() : null,
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 bg-fondo">
      <ResumenClient publicacion={serializablePublicacion} />
    </div>
  );
}