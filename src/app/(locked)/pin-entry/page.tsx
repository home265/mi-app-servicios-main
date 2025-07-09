// src/app/(locked)/pin-entry/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import bcrypt from 'bcryptjs';

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

  // --- INICIO: CAMBIO DEL LOGO ---
  // Se usan las mismas rutas y nombres de variables que en LoginPage
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png';
  const darkLogo  = '/logo1.png';
  // --- FIN: CAMBIO DEL LOGO ---

  /* ——— lógica existente, intacta ——— */
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
      setPageError('Error de sesión. Recarga la página.');
      return;
    }

    setIsLoading(true);
    setPageError(null);

    try {
      const isMatch = await bcrypt.compare(pin, currentUser.hashedPin);
      if (isMatch) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setPageError('Ocurrió un error al verificar el PIN.');
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

  /* ——— RENDERIZADO CONDICIONAL (Lógica sin cambios) ——— */

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">
      
      {/* --- INICIO: CAMBIO DEL COMPONENTE IMAGE --- */}
      {/* Se usa exactamente el mismo componente Image que en LoginPage para consistencia visual */}
      <Image
        src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
        alt="Logo CODYS"
        width={300}
        height={170}
        priority
        className="mb-8 h-auto w-52 flex-shrink-0 object-contain md:w-64"
      />
      {/* --- FIN: CAMBIO DEL COMPONENTE IMAGE --- */}

      <div className="
        w-[90vw] sm:max-w-md md:max-w-lg
        space-y-6 rounded-xl border border-borde-tarjeta
        bg-tarjeta p-6 shadow-xl md:p-8
        text-center
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
            className="!bg-[#307268] !text-white hover:!bg-[#276058] focus:!ring-[#307268]"
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