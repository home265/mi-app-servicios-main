// src/app/(main)/mis-anuncios/components/AnuncioCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Anuncio } from '@/types/anuncio'; 
import { Edit3, Eye } from 'lucide-react'; // Trash2 no se usa actualmente

interface AnuncioConPreview extends Anuncio {
  previewImageUrl?: string;
  tiempoRestante?: string;
  nombrePlan?: string;
  nombreCampania?: string;
}

interface AnuncioCardProps {
  anuncio: AnuncioConPreview;
}

export default function AnuncioCard({ anuncio }: AnuncioCardProps) {
  const getStatusColor = (status: Anuncio['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pendingPayment': return 'bg-yellow-500';
      case 'draft': return 'bg-blue-500'; // Color distintivo para borradores
      case 'expired': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const statusText: Record<Anuncio['status'], string> = {
      active: "Activo",
      pendingPayment: "Pendiente de Pago",
      draft: "Borrador", // Texto para el estado draft
      expired: "Expirado",
      cancelled: "Cancelado"
  };

  if (!anuncio || !anuncio.id) {
    console.warn("AnuncioCard: Se intentó renderizar una card sin anuncio o ID de anuncio.");
    return null;
  }

  // Determinar el enlace de edición basado en el estado del anuncio
  const editHref = anuncio.status === 'draft' 
    ? `/planes?borradorId=${anuncio.id}` // Si es draft, va a planes para reconfigurar
    : `/editor/${anuncio.id}`; // Sino, va directo al editor

  const editText = anuncio.status === 'draft' ? 'Configurar Borrador' : 'Editar';
  const editTitle = anuncio.status === 'draft' ? 'Configurar Plan/Campaña del Borrador' : 'Editar Anuncio';


  return (
    <div className="rounded-lg shadow-lg overflow-hidden bg-[var(--color-tarjeta)] transition-shadow duration-300 ease-in-out hover:shadow-xl flex flex-col h-full">
      <Link href={`/preview/${anuncio.id}`} className="block" aria-label={`Ver vista previa de ${anuncio.nombrePlan || 'anuncio'}`}>
        <div className="relative aspect-[9/16] w-full bg-gray-100 dark:bg-gray-800">
          {anuncio.previewImageUrl ? (
            <Image
              src={anuncio.previewImageUrl}
              alt={`Vista previa de ${anuncio.nombrePlan || 'anuncio'}`}
              fill
              className="object-contain" 
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 45vw, (max-width: 1024px) 30vw, 25vw"
              priority={false} 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
          )}
           <span
            className={`absolute top-2 right-2 px-3 py-1 text-xs font-semibold text-white rounded-full shadow ${getStatusColor(anuncio.status)}`}
          >
            {statusText[anuncio.status] || anuncio.status}
          </span>
        </div>
      </Link>

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <h3 
            className="text-lg font-semibold text-[var(--color-texto-principal)] mb-1 truncate" 
            title={anuncio.nombrePlan || 'Anuncio sin nombre de plan'}
        >
          {anuncio.nombrePlan || 'Anuncio sin nombre de plan'}
        </h3>

        {anuncio.nombreCampania && (
          <p 
            className="text-sm text-[var(--color-texto-secundario)] mb-2 truncate" 
            title={anuncio.nombreCampania}
          >
            Campaña: {anuncio.nombreCampania}
          </p>
        )}

        {anuncio.tiempoRestante && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Tiempo restante: {anuncio.tiempoRestante}
          </p>
        )}

        <div className="flex-grow"></div>

        <div className="mt-auto pt-3 border-t border-[var(--color-borde-tarjeta)]">
          <div className="flex justify-between items-center space-x-2">
            <Link 
              href={`/preview/${anuncio.id}`}
              className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm text-[var(--color-texto-principal)] bg-[var(--color-fondo-sutil)] hover:bg-[var(--color-fondo-hover)] rounded-md transition-colors"
              title="Ver Previa"
            >
              <Eye size={16} className="mr-1 sm:mr-2"/>
              Previa
            </Link>
            <Link 
              href={editHref} // Usar la variable editHref
              className="flex items-center justify-center px-3 py-2 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              title={editTitle} // Usar la variable editTitle
            >
              <Edit3 size={16} className="mr-1 sm:mr-2" />
              {editText} {/* Usar la variable editText */}
            </Link>
            {/* Botón de eliminar comentado como en el original */}
          </div>
        </div>
      </div>
    </div>
  );
}