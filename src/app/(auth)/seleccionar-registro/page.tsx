'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

export default function SeleccionarRegistroPage() {
  /* Logo distinto por tema (igual que en login) */
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png'; // logo modo claro
  const darkLogo  = '/logo1.png'; // logo modo oscuro

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">

      {/* Toggle discreto en la esquina */}
      <div className="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo centrado y grande */}
      <Image
        src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
        alt="Logo CODYS"
        width={300}
        height={170}
        priority
        className="mb-12 h-auto w-60 md:w-80 object-contain"
      />

      {/* Card con opciones de registro */}
      <div
        className={`
          w-full max-w-md space-y-6
          rounded-xl border border-borde-tarjeta shadow-card
          bg-tarjeta text-texto
          p-6 md:p-8
          dark:bg-tarjeta dark:text-texto
        `}
      >
        <h1 className="text-center text-3xl font-bold">Elige tu tipo de registro</h1>

        <div className="grid gap-4">
          <SeleccionRolCard rol="usuario" />
          <SeleccionRolCard rol="prestador" />
          <SeleccionRolCard rol="comercio" />
        </div>

        <p className="text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-secundario hover:underline dark:text-primario"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}