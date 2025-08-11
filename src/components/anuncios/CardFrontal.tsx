'use client';

import React from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import AvatarCuadrado from '@/components/common/AvatarCuadrado';

interface Props {
  publicacion: SerializablePaginaAmarillaData;
}

const CardFrontal: React.FC<Props> = ({ publicacion }) => {
  const titulo = publicacion.nombrePublico;
  const categoriaPrincipal = publicacion.creatorRole === 'prestador' ? publicacion.categoria : publicacion.rubro;
  const ubicacion = `${publicacion.localidad}, ${publicacion.provincia}`;

  return (
    <div
      className="w-full h-full rounded-2xl flex flex-col items-center justify-center text-center p-6"
      style={{
        background: "url('/textura-oscura.png')",
        backgroundSize: 'cover',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div>
        <AvatarCuadrado
          selfieUrl={publicacion.imagenPortadaUrl ?? undefined}
          nombre={titulo}
          size={150}
        />
      </div>

      <div className="text-white mt-6">
        <h3 className="font-bold text-3xl">{titulo}</h3>
        {categoriaPrincipal && <p className="text-lg opacity-80 mt-1">{categoriaPrincipal}</p>}
        <p className="text-sm opacity-60 mt-4">{ubicacion}</p>
      </div>
    </div>
  );
};

export default CardFrontal;
