// src/app/components/ui/Logo.tsx
'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export default function Logo() {
  const { resolvedTheme } = useTheme();
  // Estado para gestionar qué logo mostrar. Inicia con el de modo oscuro.
  const [logoSrc, setLogoSrc] = useState('/logo1.png');

  // Este efecto se ejecuta cuando el tema cambia para actualizar el logo.
  useEffect(() => {
    if (resolvedTheme) {
      setLogoSrc(resolvedTheme === 'dark' ? '/logo1.png' : '/logo2.png');
    }
  }, [resolvedTheme]);

  // Se quita el 'div' contenedor y la propiedad 'fill'.
  // Ahora el componente Image tiene su propio tamaño fijo y es autónomo.
  return (
    <Image
      src={logoSrc}
      alt="Logo de CODYS"
      width={80}  // Tamaño fijo de ancho
      height={80} // Tamaño fijo de alto
      style={{ objectFit: 'contain' }} // Asegura que la imagen no se deforme
      priority
    />
  );
}