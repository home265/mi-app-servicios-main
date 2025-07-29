'use client';

import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  return (
    // El contenedor principal ya usa clases del tema, no necesita cambios.
    <div className="relative flex h-dvh min-h-[600px] w-full flex-col items-center justify-center bg-fondo p-5 text-texto-principal">
      {/* El logo ahora es estático */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
        <Image
          src="/logo1.png" // Se usa directamente el logo del tema oscuro.
          alt="Logo CODYS"
          width={360}
          height={204}
          priority
          className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
        />
      </div>

      <div className="flex w-full flex-col items-center">
        {/* Se eliminaron las clases dark:* del contenedor de la tarjeta */}
        <div
          className={`
            login-card
            w-full max-w-md flex-shrink-0
            space-y-4
            rounded-xl border border-borde-tarjeta bg-tarjeta p-6 text-texto-principal shadow-card
            md:p-8 mt-40
          `}
        >
          <h1 className="text-center text-2xl font-bold">Iniciar sesión</h1>
          <LoginForm />
          <p className="text-center text-sm">
            ¿No tienes cuenta?{' '}
            {/* Se eliminó la clase dark:* del enlace */}
            <Link
              href="/seleccionar-registro"
              className="font-medium text-secundario hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-6 mb-0 flex-shrink-0 text-center">
          {/* Se unificó el color del texto a text-texto-secundario */}
          <p className="text-xs font-light text-texto-secundario">
            Al iniciar sesión, aceptas nuestros{' '}
            <Link href="/terminos-y-condiciones" className="underline hover:text-texto-principal" target="_blank" rel="noopener noreferrer">
                Térmimos y Condiciones
            </Link>
            <br />
            y nuestra{' '}
            <Link href="/politica-de-privacidad" className="underline hover:text-texto-principal" target="_blank" rel="noopener noreferrer">
                Política de Privacidad
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
}