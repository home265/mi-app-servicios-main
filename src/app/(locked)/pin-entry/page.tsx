'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

import { useUserStore } from '@/store/userStore';
import PinInput from '@/app/components/forms/PinInput';
import LoginForm from '@/app/components/auth/LoginForm';
// Se elimina el import de Button, ya que usaremos un <button> estándar.
// import Button from '@/app/components/ui/Button';

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

  // Lógica de hooks y handlers (sin cambios)
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
      } else {
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);
        setPin('');

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
      <div className="flex min-h-screen items-center justify-center bg-fondo text-texto-principal p-4">
        <p>Cargando…</p>
      </div>
    );
  }

  // --- VISTA DE BLOQUEO CON TARJETA 3D ---
  if (isLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto-principal px-4">
        <div className="
          w-full max-w-md space-y-6 rounded-2xl
          bg-tarjeta p-6 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] md:p-8
        ">
          <h1 className="text-center text-2xl font-bold text-error">Acceso Bloqueado</h1>
          {pageError && <p className="text-center text-sm text-texto-secundario">{pageError}</p>}
          
          <LoginForm onLoginSuccess={onReauthSuccess} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto-principal px-2 py-6">
      
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
        <Image
          src="/logo1.png"
          alt="Logo CODYS"
          width={360}
          height={204}
          priority
          className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
        />
      </div>

      {/* --- TARJETA PRINCIPAL CON ESTILO 3D --- */}
      <div className="
        w-[90vw] sm:max-w-md md:max-w-lg
        space-y-6 rounded-2xl
        bg-tarjeta p-6 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] md:p-8
        text-center mt-32
      ">
        <h1 className="text-2xl font-bold text-primario">Ingresa tu PIN</h1>
        <p className="text-texto-secundario">
          Hola {currentUser.nombre || 'Usuario'}, por favor ingresa tu PIN para continuar.
        </p>

        <form onSubmit={handlePinSubmit} className="space-y-6">
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || pin.length !== 4}
              className="btn-primary w-full"
            >
              {isLoading ? 'Verificando…' : 'Ingresar'}
            </button>
          </div>
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