'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
// Se elimina la importación de bcryptjs.
// import bcrypt from 'bcryptjs';

import { useUserStore } from '@/store/userStore';
import PinInput from '@/app/components/forms/PinInput';
import Button from '@/app/components/ui/Button';
import LoginForm from '@/app/components/auth/LoginForm';

export default function PinEntryPage() {
  const router = useRouter();
  const {
    currentUser,
    isPinVerifiedForSession,
    setPinVerified,
    setUserError,
    userError
  } = useUserStore();

  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const MAX_ATTEMPTS = 5;

  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png';
  const darkLogo  = '/logo1.png';

  useEffect(() => {
    if (isPinVerifiedForSession && currentUser) {
      router.replace('/bienvenida');
    }
    if (!currentUser && !isPinVerifiedForSession) {
      router.replace('/login');
    }
  }, [currentUser, isPinVerifiedForSession, router]);

  useEffect(() => {
    setUserError(null);
    return () => setUserError(null);
  }, [setUserError]);

  const handlePinSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!pin || pin.length !== 4) {
      setPageError('Por favor, ingresa un PIN de 4 dígitos.');
      return;
    }
    if (!currentUser?.hashedPin) {
      setPageError('Error de sesión. No se encontró el PIN para verificar.');
      return;
    }

    setIsLoading(true);
    setPageError(null);

    try {
      // Se llama a la nueva API para verificar el PIN de forma segura.
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: pin,
          hashedPin: currentUser.hashedPin,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error en el servidor.');
      }

      if (result.isMatch) {
        setPinVerified(true);
        setFailedAttempts(0);
        // router.replace('/bienvenida') se maneja por el useEffect de arriba.
      } else {
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);
        setPin(''); // Limpia el input del PIN

        if (newAttemptCount >= MAX_ATTEMPTS) {
          setPageError(`Has superado los ${MAX_ATTEMPTS} intentos. Debes iniciar sesión de nuevo.`);
          setIsLocked(true);
        } else {
          setPageError(`PIN incorrecto. Te quedan ${MAX_ATTEMPTS - newAttemptCount} intentos.`);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ocurrió un error inesperado al verificar el PIN.';
      setPageError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPin = (): void => {
    setPageError("Para restablecer tu PIN, debes verificar tu identidad con tu contraseña.");
    setIsLocked(true);
  };

  const onReauthSuccess = (): void => {
    setFailedAttempts(0);
    setIsLocked(false);
    setPageError(null);
    router.push('/auth/set-new-pin');
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-texto p-4">
        <p>Cargando…</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">
        <div className="
          w-full max-w-md space-y-6 rounded-xl border
          border-borde-tarjeta bg-tarjeta p-6 shadow-xl md:p-8
        ">
          <h1 className="text-center text-2xl font-bold text-error">Acceso Bloqueado</h1>
          {pageError && <p className="text-center text-sm text-texto-secundario">{pageError}</p>}
          
          <LoginForm onLoginSuccess={onReauthSuccess} />
        </div>
      </div>
    );
  }

  return (
    // PASO 1: Hacemos que el contenedor principal sea 'relative' para
    // que el posicionamiento absoluto del logo funcione dentro de él.
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">
      
      {/* PASO 2: Envolvemos el logo en un nuevo 'div' con posicionamiento absoluto. */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
        <Image
          src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
          alt="Logo CODYS"
          width={360}
          height={204}
          priority
          // Limpiamos las clases de margen anteriores.
          className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
        />
      </div>

      {/* Como el logo ya no ocupa espacio en el flujo, el recuadro se centrará
          verticalmente en la pantalla por sí solo gracias a 'justify-center'. */}
      <div className="
        w-[90vw] sm:max-w-md md:max-w-lg
        space-y-6 rounded-xl border border-borde-tarjeta
        bg-tarjeta p-6 shadow-xl md:p-8
        text-center mt-30
      ">
        <h1 className="text-2xl font-bold text-primario">Ingresa tu PIN</h1>
        <p className="text-texto-secundario">
          Hola {currentUser.nombre || 'Usuario'}, por favor ingresa tu PIN para continuar.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <PinInput
            id="pin"
            length={4}
            value={pin}
            onChange={setPin}
            disabled={isLoading}
            ariaLabel="Ingreso de PIN"
          />

          {pageError && <p className="text-sm text-error">{pageError}</p>}
          {userError && !pageError && <p className="text-sm text-error">{userError}</p>}

          <Button
            type="submit"
            fullWidth
            disabled={isLoading || pin.length !== 4}
            className="!bg-[var(--color-primario)] !text-[var(--color-fondo)] !focus:shadow-none hover:!brightness-90"
          >
            {isLoading ? 'Verificando…' : 'Ingresar'}
          </Button>
        </form>

        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleForgotPin}
            className="text-sm font-medium text-texto-secundario hover:text-primario hover:underline"
          >
            Olvidé mi PIN
          </button>
        </div>
      </div>
    </div>
  );
}