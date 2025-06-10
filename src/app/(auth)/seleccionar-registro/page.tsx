// src/app/(auth)/seleccionar-registro/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';

export default function SeleccionarRegistroPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
      <div className="mb-8 md:mb-12">
        <Image
          src="/logo1.png"
          alt="Logo Mi App Servicios"
          width={263} // ANCHO REAL ORIGINAL de tu archivo logo1.png
          height={176} // ALTO REAL ORIGINAL de tu archivo logo1.png
          priority
          className="w-32 h-auto md:w-40 md:h-auto" // Tailwind: Ancho responsivo, alto automático
                                                   // w-32 (128px), md:w-40 (160px)
                                                   // Ajusta estos valores de 'w-' a tu gusto
        />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-primario mb-8 text-center">
        ¿Cómo quieres unirte?
      </h1>
      <div className="w-full max-w-md space-y-6">
        <SeleccionRolCard
          titulo="Registro como Usuario"
          href="/registro/usuario"
        />
        <SeleccionRolCard
          titulo="Registro como Prestador"
          descripcion="Albañil, mecánico, pintor, etc."
          href="/registro/prestador"
        />
        <SeleccionRolCard
          titulo="Registro Comercios y Profesionales"
          descripcion="Comercios, empresas, abogados, arquitectos, ingenieros, etc."
          href="/registro/comercio"
        />
      </div>
      <div className="mt-10">
        <Link href="/login" className="text-sm text-texto-secundario hover:underline">
          ¿Ya tienes una cuenta? Inicia Sesión
        </Link>
      </div>
    </div>
  );
}