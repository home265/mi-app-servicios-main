// src/app/components/paginas-amarillas/PaginaAmarillaDisplayCard.tsx
'use client';

import React, { useState } from 'react';
import {
  MapPinIcon,
} from '@heroicons/react/24/outline';

import Card from '@/app/components/ui/Card';
import Avatar from '@/app/components/common/Avatar';
import Button from '@/app/components/ui/Button';
import { PaginaAmarillaData } from '@/types/paginaAmarilla';
import { HorariosDeAtencion, RangoHorario } from '@/types/horarios';
import PaginaAmarillaContactoPopup from './PaginaAmarillaContactoPopup';

interface PaginaAmarillaDisplayCardProps {
  publicacion: PaginaAmarillaData;
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
      <Card className={`max-w-md w-full shadow-lg rounded-xl overflow-hidden ${className}`}>
        <div className="p-5">
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

          {descripcion && (
            <p className="text-texto-secundario text-sm mb-4">
              {descripcion}
            </p>
          )}

          {(direccionVisible || localidad || provincia) && (
            <div className="flex items-start text-sm text-texto-secundario mb-3">
              <MapPinIcon className="h-5 w-5 mr-2 mt-0.5 text-primario shrink-0" />
              <span>{direccionCompleta}</span>
            </div>
          )}

          <div className="mb-3">
            <p className="text-sm font-medium text-texto-principal mb-1">Horarios:</p>
            <ul className="text-texto-secundario text-sm list-disc list-inside">
              {lineasHorarios.map((linea, idx) => (
                <li key={idx}>{linea}</li>
              ))}
            </ul>
          </div>

          {/* --- INICIO DEL CAMBIO --- */}
          {/* Este bloque ahora solo se muestra si el rol es 'comercio' */}
          {creatorRole === 'comercio' && (
            <div className="flex items-start text-sm text-texto-secundario mb-4">
              <span>Envíos: {realizaEnvios ? 'Sí' : 'No'}</span>
            </div>
          )}
          {/* --- FIN DEL CAMBIO --- */}

          <Button variant="primary" fullWidth onClick={handleContactarClick}>
            Contactar
          </Button>
        </div>
      </Card>

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