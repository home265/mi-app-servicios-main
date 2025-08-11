'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

interface BotonVolverProps {
  /** La ruta a la que se quiere volver. Por defecto es '/bienvenida'. */
  href?: string;
}

export default function BotonVolver({ href = '/bienvenida' }: BotonVolverProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      aria-label="Volver a inicio"
      // 1. Usamos className para posicionamiento, tamaño y transiciones
      className="fixed bottom-6 right-4 md:bottom-8 md:left-6 z-40 h-12 w-12 rounded-full flex items-center justify-center transition active:scale-95 focus:outline-none"
      // 2. Usamos 'style' solo para los estilos visuales personalizados
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)', // Fondo blanco muy sutil
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.2)', // Sombra 3D
        backdropFilter: 'blur(10px)', // Efecto "glassmorphism"
      }}
    >
      <ChevronLeftIcon className="h-6 w-6 text-white" />
    </button>
  );
}