// src/app/(auth)/registro/[rol]/page.tsx
'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import RegistroForm from '@/app/components/auth/RegistroForm';

// 1. Define tu tipo específico para los roles válidos
type RolValido = "usuario" | "prestador" | "comercio";

// 2. Define el array de roles válidos (puedes usarlo también para la función de guarda)
const rolesValidosArray: RolValido[] = ['usuario', 'prestador', 'comercio'];

// 3. Crea la función de guarda de tipo (type guard) - CORREGIDA
function esRolValido(rol: string): rol is RolValido { // Cambiamos 'any' por 'string'
  // Comparamos 'rol' (que es un string) con los elementos de 'rolesValidosArray'.
  // El 'as RolValido' aquí ayuda a TypeScript a entender que estamos verificando
  // si 'rol' es uno de los valores permitidos en el array 'rolesValidosArray'.
  return rolesValidosArray.includes(rol as RolValido);
}

export default function RegistroRolPage() {
  const params = useParams();
  // params.rol puede ser string o string[]. Lo casteamos a string,
  // pero la guarda de tipo se encargará de la validación más fina.
  const rolParam = params.rol as string;

  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-fondo text-texto px-4 pt-8 pb-20 md:pt-12">
      <div className="mb-8">
        <Image
          src="/logo1.png"
          alt="Logo Mi App Servicios" // Posible línea para error de comillas si tus reglas son estrictas
          width={263}
          height={176}
          priority
          className="w-24 h-auto md:w-32 md:h-auto"
        />
      </div>

      <div className="w-full max-w-lg p-6 md:p-8 space-y-6 bg-tarjeta rounded-xl shadow-xl mb-8">
        {/* 4. Usa la función de guarda en la condición */}
        {esRolValido(rolParam) ? (
          <>
            <h1 className="text-2xl md:text-3xl font-bold text-primario text-center mb-6">
              {/* Ahora puedes usar rolParam directamente porque TypeScript sabe que es RolValido */}
              Registro como <span className="capitalize">{rolParam}</span>
            </h1>
            {/* TypeScript ahora está feliz porque rolParam tiene el tipo correcto */}
            <RegistroForm rol={rolParam} />
          </>
        ) : (
          <>
            {/* Si quieres mostrar el rol inválido que se intentó usar (opcional) */}
            <h1 className="text-2xl md:text-3xl font-bold text-primario text-center mb-6">
              Error en Registro
            </h1>
            <div className="text-center py-10">
              <p className="text-xl text-error mb-4">
                {/* Posible línea para error de comillas si tus reglas son estrictas */}
                El tipo de registro &quot;{rolParam}&quot; no es válido.
              </p>
              <p className="text-texto-secundario">
                Por favor, vuelve a la{' '}
                <Link href="/seleccionar-registro" className="font-semibold text-secundario hover:underline">
                  página de selección de rol
                </Link>
                .
              </p>
            </div>
          </>
        )}
      </div>

      <div className="text-center">
        {/* Puedes mantener esta lógica o ajustarla si prefieres no mostrar el enlace si el rol es inválido desde el inicio */}
        {esRolValido(rolParam) ? (
          <Link href="/seleccionar-registro" className="text-sm text-texto-secundario hover:underline">
            &larr; Volver a seleccionar tipo de registro
          </Link>
        ) : null}
      </div>
    </div>
  );
}