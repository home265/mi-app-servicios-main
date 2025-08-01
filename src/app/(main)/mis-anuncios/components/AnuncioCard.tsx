// src/app/(main)/mis-anuncios/components/AnuncioCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Anuncio } from '@/types/anuncio'; 
import { Edit3, Eye } from 'lucide-react';

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
  // La función de color ahora usa nombres de color semánticos.
  const getStatusColor = (status: Anuncio['status']): string => {
    switch (status) {
      case 'active': return 'bg-green-500'; // El verde es universalmente entendido para "activo"
      case 'pendingPayment': return 'bg-yellow-500'; // Amarillo para advertencias
      case 'draft': return 'bg-blue-500'; // Azul para información/borradores
      case 'expired': return 'bg-error'; // Usa el color de error del tema
      case 'cancelled': return 'bg-gray-500'; // Gris para estados inactivos
      default: return 'bg-gray-400';
    }
  };

  const statusText: Record<Anuncio['status'], string> = {
      active: "Activo",
      pendingPayment: "Pendiente de Pago",
      draft: "Borrador",
      expired: "Expirado",
      cancelled: "Cancelado"
  };

  if (!anuncio || !anuncio.id) {
    console.warn("AnuncioCard: Se intentó renderizar una card sin anuncio o ID de anuncio.");
    return null;
  }

  const editHref = anuncio.status === 'draft' 
    ? `/planes?borradorId=${anuncio.id}`
    : `/editor/${anuncio.id}`;

  const editText = anuncio.status === 'draft' ? 'Configurar Borrador' : 'Editar';
  const editTitle = anuncio.status === 'draft' ? 'Configurar Plan/Campaña del Borrador' : 'Editar Anuncio';

  return (
    // --- TARJETA PRINCIPAL CON ESTILO 3D ---
    <div className="rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] overflow-hidden bg-tarjeta flex flex-col h-full">
      <Link href={`/preview/${anuncio.id}`} className="block" aria-label={`Ver vista previa de ${anuncio.nombrePlan || 'anuncio'}`}>
        <div className="relative aspect-[9/16] w-full bg-fondo">
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
              <svg className="w-12 h-12 text-texto-secundario opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
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
            className="text-lg font-semibold text-texto-principal mb-1 truncate" 
            title={anuncio.nombrePlan || 'Anuncio sin nombre de plan'}
        >
          {anuncio.nombrePlan || 'Anuncio sin nombre de plan'}
        </h3>

        {anuncio.nombreCampania && (
          <p 
            className="text-sm text-texto-secundario mb-2 truncate" 
            title={anuncio.nombreCampania}
          >
            Campaña: {anuncio.nombreCampania}
          </p>
        )}

        {anuncio.tiempoRestante && (
          <p className="text-xs text-texto-secundario mb-3">
            Tiempo restante: {anuncio.tiempoRestante}
          </p>
        )}

        <div className="flex-grow"></div>

        <div className="mt-auto pt-4 border-t border-borde-tarjeta">
          {/* --- BOTONES DE ACCIÓN CON ESTILO 3D SECUNDARIO --- */}
          <div className="flex justify-between items-center gap-3">
            <Link 
              href={`/preview/${anuncio.id}`}
              className="flex-1"
              title="Ver Previa"
            >
              <button className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-texto-secundario bg-tarjeta shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)] transition-all hover:text-primario hover:brightness-110 active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]">
                <Eye size={16} className="mr-1 sm:mr-2"/>
                Previa
              </button>
            </Link>
            <Link 
              href={editHref}
              className="flex-1"
              title={editTitle}
            >
              <button className="w-full inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-texto-secundario bg-tarjeta shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)] transition-all hover:text-primario hover:brightness-110 active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]">
                <Edit3 size={16} className="mr-1 sm:mr-2" />
                {editText}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}