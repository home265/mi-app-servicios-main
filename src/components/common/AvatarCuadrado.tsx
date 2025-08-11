'use client';

import React from 'react';
import Image from 'next/image';

interface AvatarCuadradoProps {
  selfieUrl?: string;
  nombre: string;
  size?: number;
  className?: string; 
}

const AvatarCuadrado: React.FC<AvatarCuadradoProps> = ({
  selfieUrl,
  nombre,
  size = 90,
  className = '', 
}) => {
  const inicial = nombre?.charAt(0).toUpperCase() || '?';

  return (
    // El cambio principal está aquí: se usa 'rounded-2xl' en lugar de 'rounded-full'
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-600 rounded-2xl ${className}`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      {selfieUrl ? (
        <Image
          src={selfieUrl}
          alt={`Foto de ${nombre}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span
          className="font-bold text-gray-300"
          style={{ fontSize: `${size / 2.5}px` }}
        >
          {inicial}
        </span>
      )}
    </div>
  );
};

export default AvatarCuadrado;