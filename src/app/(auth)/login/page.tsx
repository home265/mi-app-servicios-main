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
  // Hacemos que el contenedor sea 'relative' y quitamos el 'gap'
  <div className="relative flex h-dvh min-h-[600px] w-full flex-col items-center justify-center bg-fondo p-5 text-texto">

    {/* PASO 1: Envolvemos el logo en un 'div' con posicionamiento absoluto */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
      <Image
        src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
        alt="Logo CODYS"
        width={360}
        height={204}
        priority
        // PASO 2: Usamos las mismas clases de tamaño que en la página de PIN
        className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
      />
    </div>

    {/* El resto del contenido se centrará automáticamente en el espacio restante */}
    <div className="flex w-full flex-col items-center">
      <div
        className={`
          login-card
          w-full max-w-md flex-shrink-0
          space-y-4
          rounded-xl border border-borde-tarjeta bg-tarjeta p-6 text-texto shadow-card dark:bg-tarjeta dark:text-texto
          md:p-8 mt-40
        `}
      >
        <h1 className="text-center text-2xl font-bold">Iniciar sesión</h1>
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

      <div className="mt-6 mb-0 flex-shrink-0 text-center">
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