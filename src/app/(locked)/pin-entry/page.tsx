'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import bcrypt from 'bcryptjs';

import { useUserStore } from '@/store/userStore';
import PinInput from '@/app/components/forms/PinInput';
import Button from '@/app/components/ui/Button';

// NOTA: Asumimos que el LoginForm existe y puede recibir una prop onLoginSuccess.
// Este componente se mostrará cuando la cuenta se bloquee.
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
  
  // --- NUEVOS ESTADOS PARA BLOQUEO Y RECUPERACIÓN ---
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const MAX_ATTEMPTS = 5; // Constante para el número máximo de intentos

  /* para isotipo verde / amarillo */
  const { resolvedTheme } = useTheme();
  const logoClaro = '/MARCA_CODYS_13.png'; // verde
  const logoOscuro = '/MARCA_CODYS_14.png'; // amarillo

  /* ——— lógica existente, intacta ——— */
  useEffect(() => {
    if (isPinVerifiedForSession && currentUser) {
      router.replace('/bienvenida');
    }
    // Redirige al login si no hay usuario y la sesión no ha sido verificada con PIN
    if (!currentUser && !isPinVerifiedForSession) {
      router.replace('/login');
    }
  }, [currentUser, isPinVerifiedForSession, router]);

  useEffect(() => {
    // Limpia el error global de Zustand al montar y desmontar el componente
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
        // --- ÉXITO: PIN CORRECTO ---
        setPinVerified(true);
        setFailedAttempts(0); // Resetea el contador de intentos
      } else {
        // --- FALLO: PIN INCORRECTO ---
        const newAttemptCount = failedAttempts + 1;
        setFailedAttempts(newAttemptCount);
        setPin(''); // Limpia el input del PIN

        if (newAttemptCount >= MAX_ATTEMPTS) {
          setPageError(`Has superado los ${MAX_ATTEMPTS} intentos. Debes iniciar sesión de nuevo.`);
          setIsLocked(true); // Bloquea la vista de PIN
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

  // --- NUEVAS FUNCIONES PARA EL FLUJO DE RECUPERACIÓN ---

  /**
   * Inicia el flujo de recuperación de PIN forzando la re-autenticación.
   */
  const handleForgotPin = (): void => {
    setPageError("Para restablecer tu PIN, debes verificar tu identidad con tu contraseña.");
    setIsLocked(true);
  };

  /**
   * Callback para cuando el usuario se re-autentica exitosamente.
   * Redirige a la página para establecer un nuevo PIN.
   */
  const onReauthSuccess = (): void => {
    // Resetea el estado local antes de redirigir
    setFailedAttempts(0);
    setIsLocked(false);
    setPageError(null);
    // Redirige al usuario a la página dedicada para crear un nuevo PIN
    router.push('/auth/set-new-pin');
  };

  /* ——— RENDERIZADO CONDICIONAL ——— */

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-texto p-4">
        <p>Cargando…</p>
      </div>
    );
  }

  // --- VISTA DE CUENTA BLOQUEADA / RECUPERACIÓN DE PIN ---
  if (isLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">
        <div className="
          w-full max-w-md space-y-6 rounded-xl border
          border-borde-tarjeta bg-tarjeta p-6 shadow-xl md:p-8
        ">
          <h1 className="text-center text-2xl font-bold text-error">Acceso Bloqueado</h1>
          {pageError && <p className="text-center text-sm text-texto-secundario">{pageError}</p>}
          
          {/* Reutilizamos el LoginForm para la re-autenticación */}
          <LoginForm onLoginSuccess={onReauthSuccess} />
        </div>
      </div>
    );
  }

  // --- VISTA PRINCIPAL DE INGRESO DE PIN ---
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">
      <Image
        src={resolvedTheme === 'dark' ? logoOscuro : logoClaro}
        alt="Isotipo CODYS"
        width={120}
        height={120}
        priority
        className="mb-6 w-24 md:w-28 object-contain"
      />

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

        {/* --- NUEVO BOTÓN PARA "OLVIDÉ MI PIN" --- */}
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