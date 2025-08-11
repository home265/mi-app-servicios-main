// src/app/components/paginas-amarillas/PaginaAmarillaDisplayCard.tsx
'use client';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import React, { useState } from 'react';
import {
  MapPinIcon,
} from '@heroicons/react/24/outline';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Card from '@/components/ui/Card';
import Avatar from '@/components/common/Avatar';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/components/ui/Button';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { PaginaAmarillaData } from '@/types/paginaAmarilla';
import { HorariosDeAtencion, RangoHorario } from '@/types/horarios';
import PaginaAmarillaContactoPopup from './PaginaAmarillaContactoPopup';

interface PaginaAmarillaDisplayCardProps {
  publicacion: SerializablePaginaAmarillaData; // <-- ASÍ DEBE QUEDAR
  className?: string;
}

// Helper para convertir los horarios en un array de líneas legibles
const obtenerLineasHorarios = (
  horarios?: HorariosDeAtencion | null
): string[] => {
  if (!horarios || horarios.length === 0) {
    return ['Consultar horarios'];
  }
  const diasAbiertos = horarios.filter(d => d.estado !== 'cerrado');
  if (diasAbiertos.length === 0) {
    return ['Cerrado'];
  }
  return diasAbiertos.map(dia => {
    const abrev = dia.diaAbreviatura;
    if (dia.estado === 'abierto24h') {
      return `${abrev}: 24hs`;
    }
    if (Array.isArray(dia.estado) && dia.estado.length > 0) {
      const rangos = (dia.estado as RangoHorario[])
        .map(r => `${r.de}-${r.a}`)
        .join(', ');
      return `${abrev}: ${rangos}`;
    }
    return `${abrev}: consultar`;
  });
};

const PaginaAmarillaDisplayCard: React.FC<PaginaAmarillaDisplayCardProps> = ({
  publicacion,
  className = '',
}) => {
  const [mostrarPopupContacto, setMostrarPopupContacto] = useState(false);
  const {
    nombrePublico,
    imagenPortadaUrl,
    direccionVisible,
    localidad,
    provincia,
    rubro,
    subRubro,
    categoria,
    subCategoria,
    creatorRole,
    descripcion,
    horarios,
    realizaEnvios,
  } = publicacion;

  const tituloCard = nombrePublico;
  const subtituloCard =
    creatorRole === 'comercio'
      ? `${rubro || ''}${subRubro ? ` / ${subRubro}` : ''}`
      : `${categoria || ''}${subCategoria ? ` / ${subCategoria}` : ''}`;

  const direccionCompleta =
    `${direccionVisible ? `${direccionVisible}, ` : ''}` +
    `${localidad}, ${provincia}`;

  const handleContactarClick = () => setMostrarPopupContacto(true);
  const handleCerrarPopup = () => setMostrarPopupContacto(false);

  const lineasHorarios = obtenerLineasHorarios(horarios);

  return (
    <>
      {/* --- TARJETA PRINCIPAL CON ESTILO 3D --- */}
      <div className={`max-w-md w-full overflow-hidden bg-tarjeta rounded-2xl p-5
                       shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] ${className}`}>
        
        {/* Encabezado con Avatar y Título */}
        <div className="flex items-center mb-4">
          <Avatar selfieUrl={imagenPortadaUrl} nombre={nombrePublico} size={80} />
          <div className="ml-4 flex-grow">
            <h2 className="text-xl font-bold text-texto-principal leading-tight">
              {tituloCard}
            </h2>
            {subtituloCard && (
              <p className="text-sm text-texto-secundario">{subtituloCard}</p>
            )}
          </div>
        </div>

        {/* Descripción (si existe) */}
        {descripcion && (
          <p className="text-texto-secundario text-sm mb-4">
            {descripcion}
          </p>
        )}

        {/* Separador visual */}
        {(direccionVisible || localidad || provincia) && <div className="border-t border-borde-tarjeta my-4"></div>}

        {/* Dirección */}
        {(direccionVisible || localidad || provincia) && (
          <div className="flex items-start text-sm text-texto-secundario mb-3">
            <MapPinIcon className="h-5 w-5 mr-3 mt-0.5 text-primario shrink-0" />
            <span>{direccionCompleta}</span>
          </div>
        )}

        {/* Horarios */}
        <div className="mb-3">
          <p className="text-sm font-medium text-texto-principal mb-1">Horarios:</p>
          <ul className="text-texto-secundario text-sm list-disc list-inside space-y-1">
            {lineasHorarios.map((linea, idx) => (
              <li key={idx}>{linea}</li>
            ))}
          </ul>
        </div>
        
        {/* Envíos (si aplica) */}
        {creatorRole === 'comercio' && (
          <div className="flex items-start text-sm text-texto-secundario mt-3">
            <span>Envíos: {realizaEnvios ? 'Sí' : 'No'}</span>
          </div>
        )}
        
        {/* Separador visual */}
        <div className="border-t border-borde-tarjeta my-4"></div>

        {/* --- BOTÓN "CONTACTAR" CON ESTILO UNIFICADO --- */}
        <button
          onClick={handleContactarClick}
          className="btn-primary w-full"
        >
          Contactar
        </button>

      </div>

      {/* El Popup de contacto no se modifica */}
      {mostrarPopupContacto && (
        <PaginaAmarillaContactoPopup
          publicacion={publicacion}
          onClose={handleCerrarPopup}
        />
      )}
    </>
  );
};

export default PaginaAmarillaDisplayCard;