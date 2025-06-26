'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';              /* ← nuevo */
import Image from 'next/image';
import bcrypt from 'bcryptjs';

import { useUserStore } from '@/store/userStore';
import PinInput from '@/app/components/forms/PinInput';
import Button from '@/app/components/ui/Button';

export default function PinEntryPage() {
  const router = useRouter();
  const {
    currentUser,
    isPinVerifiedForSession,
    setPinVerified,
    setUserError,
    userError
  } = useUserStore();

  const [pin, setPin]           = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  /* para isotipo verde / amarillo */
  const { resolvedTheme } = useTheme();
  const logoClaro  = '/MARCA_CODYS_13.png';   // verde
  const logoOscuro = '/MARCA_CODYS_14.png';   // amarillo

  /* ——— lógica existente, intacta ——— */
  useEffect(() => {
    if (isPinVerifiedForSession && currentUser) router.replace('/bienvenida');
    if (!currentUser && !isPinVerifiedForSession) router.replace('/login');
  }, [currentUser, isPinVerifiedForSession, router]);

  useEffect(() => {
    setUserError(null);
    return () => setUserError(null);
  }, [setUserError]);

  const handlePinSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!pin || pin.length !== 4) { setPageError('Por favor, ingresa un PIN de 4 dígitos.'); return; }
    if (!currentUser?.hashedPin) { setPageError('Error de sesión. Recarga la página.'); return; }

    setIsLoading(true); setPageError(null);
    try {
      const isMatch = await bcrypt.compare(pin, currentUser.hashedPin);
      if (isMatch) setPinVerified(true);
      else { setPageError('PIN incorrecto. Intenta de nuevo.'); setPin(''); }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setPageError('Ocurrió un error al verificar el PIN.');
    } finally { setIsLoading(false); }
  };

  if (!currentUser)
    return (
      <div className="flex min-h-screen items-center justify-center bg-fondo text-texto p-4">
        <p>Cargando…</p>
      </div>
    );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">

      {/* isotipo sobre la tarjeta */}
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

          <Button
  type="submit"
  fullWidth
  disabled={isLoading || pin.length !== 4}
  /* color verde fijo en modo claro ( #307268 ) */
  className="!bg-[#307268] !text-white hover:!bg-[#276058] focus:!ring-[#307268]"
>
  {isLoading ? 'Verificando…' : 'Ingresar'}
</Button>
        </form>
      </div>
    </div>
  );
}