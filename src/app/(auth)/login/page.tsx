// src/app/(auth)/login/page.tsx
import Link from 'next/link';
import Image from 'next/image';
import LoginForm from '@/app/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
      <div className="mb-8 md:mb-12">
        <Image
          src="/logo.png"
          alt="Logo Mi App Servicios"
          width={263} // ANCHO REAL ORIGINAL de tu archivo logo.png
          height={176} // ALTO REAL ORIGINAL de tu archivo logo.png
          priority
          className="w-32 h-auto md:w-40 md:h-auto" // Tailwind: Ancho responsivo, alto automático
                                                   // w-32 (128px), md:w-40 (160px)
                                                   // Ajusta estos valores de 'w-' a tu gusto
        />
      </div>
      <div className="w-full max-w-md p-6 md:p-8 space-y-6 bg-tarjeta rounded-xl shadow-xl">
        <h1 className="text-2xl md:text-3xl font-bold text-primario text-center">
          Iniciar Sesión
        </h1>
        <LoginForm />
        <p className="text-center text-sm text-texto-secundario">
          ¿No tienes cuenta?{' '}
          <Link href="/seleccionar-registro" className="font-medium text-secundario hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}