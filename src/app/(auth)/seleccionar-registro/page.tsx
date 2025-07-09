// src/app/(auth)/seleccionar-registro/page.tsx

'use client';

// 1. IMPORTAMOS useState PARA MANEJAR EL ESTADO DEL CHECKBOX
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';

export default function SeleccionarRegistroPage() {
  /* Logo distinto por tema (igual que en login) */
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png'; // logo modo claro
  const darkLogo  = '/logo1.png'; // logo modo oscuro

  // 2. CREAMOS EL ESTADO PARA EL CHECKBOX (INICIA EN FALSO)
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">

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
          {/* 3. AHORA ENVOLVEMOS CADA TARJETA EN UN LINK CONDICIONAL */}
          <Link
            href={acceptedTerms ? "/registro/usuario" : "#"}
            className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
            onClick={(e) => !acceptedTerms && e.preventDefault()}
            aria-disabled={!acceptedTerms}
          >
            <SeleccionRolCard rol="usuario" />
          </Link>
          <Link
            href={acceptedTerms ? "/registro/prestador" : "#"}
            className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
            onClick={(e) => !acceptedTerms && e.preventDefault()}
            aria-disabled={!acceptedTerms}
          >
            <SeleccionRolCard rol="prestador" />
          </Link>
          <Link
            href={acceptedTerms ? "/registro/comercio" : "#"}
            className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
            onClick={(e) => !acceptedTerms && e.preventDefault()}
            aria-disabled={!acceptedTerms}
          >
            <SeleccionRolCard rol="comercio" />
          </Link>
        </div>

        {/* 4. AQUÍ AGREGAMOS LA SECCIÓN DEL CHECKBOX */}
        <div className="border-t border-borde-tarjeta pt-4">
            <div className="flex items-center justify-center space-x-3">
                <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="h-5 w-5 rounded-sm border-gray-300 text-secundario focus:ring-secundario"
                />
                <label htmlFor="terms" className="text-sm font-light text-gray-600 dark:text-gray-300">
                    Acepto los{' '}
                    <Link href="/terminos-y-condiciones" className="underline hover:text-secundario dark:hover:text-primario" target="_blank" rel="noopener noreferrer">
                        Términos
                    </Link>
                    {' y la '}
                    <Link href="/politica-de-privacidad" className="underline hover:text-secundario dark:hover:text-primario" target="_blank" rel="noopener noreferrer">
                        Política de Privacidad
                    </Link>.
                </label>
            </div>
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