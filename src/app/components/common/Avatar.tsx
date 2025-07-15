// src/app/components/common/Avatar.tsx
'use client';

import Image from 'next/image';
import React from 'react';

interface AvatarProps {
  selfieUrl?: string | null;
  nombre?: string | null;
  size?: number;
  onClick?: () => void;
  clickable?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  selfieUrl,
  nombre,
  size = 96,
  onClick,
  clickable = false,
}) => {
  const placeholderInitial = nombre ? nombre.charAt(0).toUpperCase() : '?';

  return (
    <div
      onClick={clickable && onClick ? onClick : undefined}
      // 1. AÑADIDO: La clase 'relative' es necesaria para que la prop 'fill' de la imagen funcione.
      //    'flex-shrink-0' previene que el avatar sea comprimido por otros elementos.
      className={`
        relative flex-shrink-0
        rounded-full overflow-hidden 
        bg-primario/10 
        border-2 border-borde-tarjeta 
        shadow-md
        flex items-center justify-center
        transition-all duration-150 ease-in-out
        ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
      `}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {selfieUrl ? (
        <Image
          src={selfieUrl}
          alt={`Avatar de ${nombre || 'usuario'}`}
          // 2. CAMBIO: Se usa la prop 'fill' en lugar de width/height.
          //    Esto hace que la imagen se adapte al contenedor padre de forma absoluta.
          fill
          sizes={`${size}px`} // Ayuda a Next.js a optimizar la imagen correcta.
          // La clase 'object-cover' sigue siendo la clave para evitar la distorsión.
          className="object-cover"
          priority
        />
      ) : (
        <span
          className="text-texto-principal font-semibold"
          style={{ fontSize: `${size / 2.5}px` }}
        >
          {placeholderInitial}
        </span>
      )}
    </div>
  );
};

export default Avatar;