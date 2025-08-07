'use client';

import React from 'react';
import { PaginaAmarillaData, RolPaginaAmarilla, SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { HorariosDeAtencion } from '@/types/horarios';
import PaginaAmarillaDisplayCard from './PaginaAmarillaDisplayCard';
import { Timestamp } from 'firebase/firestore';

export interface PaginaAmarillaFormValues {
  nombrePublico?: string | null;
  descripcion?: string | null;
  imagenPortadaUrl?: string | null;
  telefonoContacto?: string | null;
  emailContacto?: string | null;
  direccionVisible?: string | null;

  provincia?: string | null;
  localidad?: string | null;
  creatorRole?: RolPaginaAmarilla;

  rubro?: string | null;
  subRubro?: string | null;
  categoria?: string | null;
  subCategoria?: string | null;

  horarios?: HorariosDeAtencion;

  enlaceWeb?: string | null;
  enlaceInstagram?: string | null;
  enlaceFacebook?: string | null;
  realizaEnvios?: boolean | null;

  tituloCard?: string | null;
  subtituloCard?: string | null;
}

interface PaginaAmarillaFormPreviewProps {
  formData: PaginaAmarillaFormValues;
  className?: string;
}

const PaginaAmarillaFormPreview: React.FC<PaginaAmarillaFormPreviewProps> = ({
  formData,
  className = '',
}) => {
  // 1. Creamos un objeto de datos base con el formato original de Firestore
  const publicacionPreviewData: PaginaAmarillaData = {
    creatorId: 'preview-user-id',
    creatorRole: formData.creatorRole || 'comercio',
    nombrePublico: formData.nombrePublico || 'Nombre del Negocio',
    provincia: formData.provincia || 'Provincia Ejemplo',
    localidad: formData.localidad || 'Localidad Ejemplo',
    fechaCreacion: Timestamp.now(),
    fechaExpiracion: Timestamp.fromMillis(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ultimaModificacion: Timestamp.now(),
    contadorEdicionesAnual: 0,
    inicioCicloEdiciones: Timestamp.now(),
    activa: true,
    isActive: false, // <-- CAMBIO 1: Se añade el campo 'isActive' que faltaba

    tituloCard: formData.tituloCard,
    subtituloCard: formData.subtituloCard,
    descripcion: formData.descripcion,
    imagenPortadaUrl: formData.imagenPortadaUrl,
    telefonoContacto: formData.telefonoContacto,
    emailContacto: formData.emailContacto,
    direccionVisible: formData.direccionVisible,
    rubro: formData.rubro,
    subRubro: formData.subRubro,
    categoria: formData.categoria,
    subCategoria: formData.subCategoria,
    horarios: formData.horarios || [],
    enlaceWeb: formData.enlaceWeb,
    enlaceInstagram: formData.enlaceInstagram,
    enlaceFacebook: formData.enlaceFacebook,
    realizaEnvios: formData.realizaEnvios,
  };

  // 2. Creamos una versión "serializada" de los datos para pasarla al componente hijo
  const serializablePreviewData: SerializablePaginaAmarillaData = {
    ...publicacionPreviewData,
    fechaCreacion: publicacionPreviewData.fechaCreacion.toDate().toISOString(),
    fechaExpiracion: publicacionPreviewData.fechaExpiracion.toDate().toISOString(),
    ultimaModificacion: publicacionPreviewData.ultimaModificacion.toDate().toISOString(),
    inicioCicloEdiciones: publicacionPreviewData.inicioCicloEdiciones.toDate().toISOString(),
    // Añadimos valores por defecto para los campos opcionales que el tipo espera
    subscriptionStartDate: null,
    subscriptionEndDate: null,
    updatedAt: null,
    paymentConfirmedAt: null,
  };


  return (
    <div className={`sticky top-4 p-4 bg-tarjeta rounded-2xl 
                   shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] ${className}`}>
      <h3 className="text-lg font-semibold text-texto-principal mb-3 border-b border-borde-tarjeta pb-2">
        Vista Previa de la Tarjeta
      </h3>
      <div className="flex justify-center items-start">
        {/* 3. Pasamos la versión serializada de los datos */}
        <PaginaAmarillaDisplayCard publicacion={serializablePreviewData} />
      </div>
      <p className="text-xs text-texto-secundario mt-3 text-center">
        Así se verá tu publicación. El contenido se actualiza en tiempo real.
      </p>
    </div>
  );
};

export default PaginaAmarillaFormPreview;