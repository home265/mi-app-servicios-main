'use client';

import Image from 'next/image';

interface AvatarProps {
  selfieUrl?: string | null; // La URL de la selfie puede ser null o undefined
  nombre?: string | null;    // El nombre para el texto alternativo
  size?: number;             // Tamaño del avatar en píxeles
  onClick?: () => void;      // Función opcional al hacer click
  clickable?: boolean;       // Indica si el avatar es clickeable
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
      className={`
        rounded-full overflow-hidden bg-secundario/30 border-2 border-primario shadow-lg
        flex items-center justify-center
        ${clickable ? 'cursor-pointer hover:scale-105 transition-transform duration-150' : ''}
      `}
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {selfieUrl ? (
        <Image
          src={selfieUrl}
          alt={`Avatar de ${nombre || 'usuario'}`}
          width={size}
          height={size}
          className="object-cover rounded-full"
          priority
        />
      ) : (
        <span
          className="text-3xl font-semibold text-primario"
          style={{ fontSize: `${size / 2.5}px` }}
        >
          {placeholderInitial}
        </span>
      )}
    </div>
  );
};

export default Avatar;
