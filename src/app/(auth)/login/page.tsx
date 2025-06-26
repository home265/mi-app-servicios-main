'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import LoginForm from '@/app/components/auth/LoginForm';
import ThemeToggle from '@/app/components/ui/ThemeToggle';

export default function LoginPage() {
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png'; // logo modo claro
  const darkLogo  = '/logo1.png'; // logo modo oscuro

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">

      {/* Toggle fuera del foco principal */}
      <div className="absolute bottom-4 right-4">
        <ThemeToggle />
      </div>

      {/* Logo centrado */}
      <Image
        src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
        alt="Logo CODYS"
        width={300}
        height={170}
        priority
        className="mb-12 h-auto w-60 md:w-80 object-contain"
      />

      {/* Card de login */}
      <div
        className={`
          login-card
          w-full max-w-md space-y-6
          rounded-xl border border-borde-tarjeta shadow-card
          bg-tarjeta text-texto
          p-6 md:p-8
          dark:bg-tarjeta dark:text-texto
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
    </div>
  );
}