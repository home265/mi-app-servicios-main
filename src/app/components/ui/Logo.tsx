// src/app/components/ui/Logo.tsx
'use client';

import Image from 'next/image';

// La interfaz de props se mantiene para poder ajustar el tamaño
interface LogoProps {
  width?: number;
  height?: number;
}

// Se han eliminado los hooks useTheme, useEffect y useState
export default function Logo({ width = 80, height = 80 }: LogoProps) {
  return (
    <Image
      // La fuente del logo ahora es fija
      src="/logo1.png"
      alt="Logo de CODYS"
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}