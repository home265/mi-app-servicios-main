'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import RegistroForm from '@/app/components/auth/RegistroForm';

/* ─ utilidades ─ */
type RolValido = 'usuario' | 'prestador' | 'comercio';
const rolesValidos: RolValido[] = ['usuario', 'prestador', 'comercio'];
const esRolValido = (r: string): r is RolValido =>
  rolesValidos.includes(r as RolValido);
/* ─────────────── */

export default function RegistroRolPage() {
  const { rol } = useParams() as { rol: string };
  const { resolvedTheme } = useTheme();

  /* Logos decorativos (solo icono) */
  const logoClaro = '/logo2.png'; // verde
  const logoOscuro = '/logo3.png'; // amarillo

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4 py-12 overscroll-y-auto">

      {/* ──────────── Marca de agua ──────────── */}
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
        <Image
          src={resolvedTheme === 'dark' ? logoOscuro : logoClaro}
          alt=""
          width={300}
          height={300}
          priority
          className="w-80 opacity-5 select-none"
        />
      </div>

      {/* ──────────── Card principal ──────────── */}
      <div
        className="
          registro-card
          w-full max-w-lg space-y-6 mx-auto
          rounded-xl border border-borde-tarjeta shadow-card
          bg-tarjeta text-texto
          p-6 md:p-8
          dark:bg-tarjeta dark:text-texto
        "
      >
        {esRolValido(rol) ? (
          <>
            <h1 className="text-center text-3xl font-bold">
              Registro como <span className="capitalize">{rol}</span>
            </h1>

            <RegistroForm rol={rol} />
          </>
        ) : (
          <>
            <h1 className="text-center text-3xl font-bold text-error">
              Error en Registro
            </h1>

            <p className="text-center text-base">
              El tipo de registro “{rol}” no es válido.
              <br />
              <Link
                href="/seleccionar-registro"
                className="mt-4 inline-block font-semibold text-secundario hover:underline dark:text-primario"
              >
                Volver a seleccionar rol
              </Link>
            </p>
          </>
        )}
      </div>

      {/* Enlace retorno cuando el rol es válido */}
      {esRolValido(rol) && (
        <Link
          href="/seleccionar-registro"
          className="mt-6 text-sm text-texto-secundario hover:underline"
        >
          &larr; Volver a seleccionar tipo de registro
        </Link>
      )}
    </div>
  );
}