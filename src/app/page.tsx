
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
        <div className="relative w-52 h-36 md:w-64 md:h-44">
  <Image
    src="/logo1.png"
    alt="Logo Mi App Servicios"
    fill
    priority
    className="object-contain"
  />
</div>
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