// src/app/components/ui/Logo.tsx

'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// 1. Definimos las propiedades que el componente puede recibir
interface LogoProps {
  width?: number;
  height?: number;
}

// 2. Usamos las props y les damos un valor por defecto de 80
export default function Logo({ width = 80, height = 80 }: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [logoSrc, setLogoSrc] = useState('/logo1.png');

  useEffect(() => {
    if (resolvedTheme) {
      setLogoSrc(resolvedTheme === 'dark' ? '/logo1.png' : '/logo2.png');
    }
  }, [resolvedTheme]);

  return (
    <Image
      src={logoSrc}
      alt="Logo de CODYS"
      // 3. Usamos los valores recibidos en las props
      width={width}
      height={height}
      style={{ objectFit: 'contain' }}
      priority
    />
  );
}