// src/app/(main)/paginas-amarillas/editar/[creatorId]/page.tsx
import React from 'react';
import { notFound } from 'next/navigation';
import { Timestamp } from 'firebase/firestore';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import PaginaAmarillaEditarForm from './components/PaginaAmarillaEditarForm';
import { PaginaAmarillaData, SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import type { Metadata, ResolvingMetadata } from 'next';

type PagePropsAsync = {
  params: Promise<{ creatorId: string }>;
};

export async function generateMetadata(
  { params }: PagePropsAsync,
  _parent: ResolvingMetadata
): Promise<Metadata> {
  const { creatorId } = await params;
  return {
    title: `Editar Publicación ${creatorId} | Páginas Amarillas`,
  };
}

export default async function EditarPaginaAmarillaPage(
  { params }: PagePropsAsync
) {
  const { creatorId } = await params;

  if (!creatorId) {
    notFound();
  }

  const publicacionDb: PaginaAmarillaData | null = await getPaginaAmarilla(creatorId);
  if (!publicacionDb) {
    notFound();
  }

  const serializablePublicacion: SerializablePaginaAmarillaData = {
    creatorId: publicacionDb.creatorId,
    creatorRole: publicacionDb.creatorRole,
    nombrePublico: publicacionDb.nombrePublico,
    provincia: publicacionDb.provincia,
    localidad: publicacionDb.localidad,
    contadorEdicionesAnual: publicacionDb.contadorEdicionesAnual,
    activa: publicacionDb.activa,
    tituloCard: publicacionDb.tituloCard,
    subtituloCard: publicacionDb.subtituloCard,
    descripcion: publicacionDb.descripcion,
    imagenPortadaUrl: publicacionDb.imagenPortadaUrl,
    telefonoContacto: publicacionDb.telefonoContacto,
    emailContacto: publicacionDb.emailContacto,
    enlaceWeb: publicacionDb.enlaceWeb,
    enlaceInstagram: publicacionDb.enlaceInstagram,
    enlaceFacebook: publicacionDb.enlaceFacebook,
    direccionVisible: publicacionDb.direccionVisible,
    rubro: publicacionDb.rubro,
    subRubro: publicacionDb.subRubro,
    categoria: publicacionDb.categoria,
    subCategoria: publicacionDb.subCategoria,
    horarios: publicacionDb.horarios,
    realizaEnvios: publicacionDb.realizaEnvios,
    fechaCreacion: (publicacionDb.fechaCreacion as Timestamp).toDate().toISOString(),
    fechaExpiracion: (publicacionDb.fechaExpiracion as Timestamp).toDate().toISOString(),
    ultimaModificacion: (publicacionDb.ultimaModificacion as Timestamp).toDate().toISOString(),
    inicioCicloEdiciones: (publicacionDb.inicioCicloEdiciones as Timestamp).toDate().toISOString(),
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      <PaginaAmarillaEditarForm publicacionInicial={serializablePublicacion} />
    </div>
  );
}
