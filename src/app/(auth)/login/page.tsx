'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png';
  const darkLogo  = '/logo1.png';

  return (
  // 1. CAMBIO PRINCIPAL: Usamos 'justify-evenly' para distribuir el espacio verticalmente.
  //    Quitamos el padding superior (pt-20) que causaba el scroll.
  <div className="relative flex h-dvh min-h-[600px] w-full flex-col items-center justify-evenly bg-fondo p-4 text-texto">
    
    {/* 2. ESTRUCTURA SIMPLIFICADA: El logo y el contenedor del formulario son ahora
           hermanos directos para que 'justify-evenly' los pueda espaciar. */}
    
    {/* Logo */}
    <Image
      src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
      alt="Logo CODYS"
      width={300}
      height={170}
      priority
      className="h-auto w-52 flex-shrink-0 object-contain md:w-64"
    />

    {/* Contenedor del formulario y los links */}
    <div className="flex w-full flex-col items-center">
      {/* Card de login */}
      <div
        className={`
          login-card
          w-full max-w-md flex-shrink-0
          space-y-4
          rounded-xl border border-borde-tarjeta bg-tarjeta p-6 text-texto shadow-card dark:bg-tarjeta dark:text-texto
          md:p-8
        `}
      >
        <h1 className="text-center text-3xl font-bold">Iniciar sesión</h1>
        <LoginForm />
        <p className="text-center text-sm">
          ¿No tienes cuenta?{' '}
          <Link
            href="/seleccionar-registro"
            className="font-medium text-secundario hover:underline dark:text-primario"
          >
            Regístrate aquí
          </Link>
        </p>
      </div>

      {/* Enlaces legales */}
      <div className="mt-6 flex-shrink-0 text-center">
        <p className="text-xs font-light text-gray-500 dark:text-gray-400">
            Al iniciar sesión, aceptas nuestros{' '}
            <Link href="/terminos-y-condiciones" className="underline hover:text-texto" target="_blank" rel="noopener noreferrer">
                Térmimos y Condiciones
            </Link>
            <br />
            y nuestra{' '}
            <Link href="/politica-de-privacidad" className="underline hover:text-texto" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
            </Link>.
        </p>
      </div>
    </div>
      
  </div>
);
}