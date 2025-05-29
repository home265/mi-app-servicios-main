// src/app/page.tsx (Splash Screen)
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SplashScreenPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      router.push('/login');
    }, 4000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 overflow-hidden">
      <div
        className={`
          transition-all duration-1000 ease-out
          ${isMounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
        `}
      >
        <Image
          src="/logo.png"
          alt="Logo Mi App Servicios"
          width={263} // ANCHO REAL ORIGINAL de tu archivo logo.png
          height={176} // ALTO REAL ORIGINAL de tu archivo logo.png
          priority
          className="w-36 h-auto md:w-44 md:h-auto" // Tailwind: Ancho responsivo, alto automático
                                                   // w-36 (144px), md:w-44 (176px)
                                                   // Ajusta estos valores de 'w-' a tu gusto
                                                   // Dado que tu logo es más ancho que alto,
                                                   // puedes usar un ancho mayor si quieres que se vea más grande.
                                                   // Ejemplo: className="w-44 h-auto md:w-56 md:h-auto"
        />
      </div>
      <h1
        className={`
          mt-6 text-4xl font-bold text-primario
          transition-opacity duration-1000 ease-in delay-500
          ${isMounted ? 'opacity-100' : 'opacity-0'}
        `}
      >
        Mi App Servicios
      </h1>
      <p
        className={`
        mt-2 text-lg text-texto-secundario
        transition-opacity duration-1000 ease-in delay-1000
        ${isMounted ? 'opacity-100' : 'opacity-0'}
      `}
      >
        Cargando...
      </p>
    </div>
  );
}