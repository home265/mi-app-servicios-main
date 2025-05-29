// src/app/(locked)/pin-entry/page.tsx
'use client';

import { useState, useEffect } from 'react'; // <--- CORRECCIÓN: useState y useEffect importados
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import bcrypt from 'bcryptjs';

import PinInput from '@/app/components/forms/PinInput';
import Button from '@/app/components/ui/Button';
import Image from 'next/image';

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
  const [isLoading, setIsLoading] = useState(false); // <--- setIsLoading ahora se usará
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (isPinVerifiedForSession && currentUser) {
      console.log("PinEntryPage: PIN ya verificado, redirigiendo a /bienvenida");
      router.replace('/bienvenida');
    }
    if (!currentUser && !isPinVerifiedForSession) { // Si no hay usuario y el PIN no está verificado (caso improbable aquí si Providers funciona bien)
        console.warn("PinEntryPage: No hay currentUser, redirigiendo a /login");
        router.replace('/login');
    }
  }, [currentUser, isPinVerifiedForSession, router]);

  useEffect(() => {
    setUserError(null);
    return () => {
      setUserError(null);
    };
  }, [setUserError]);


  const handlePinSubmit = async (event?: React.FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault(); 
    
    if (!pin || pin.length !== 4) {
      setPageError("Por favor, ingresa un PIN de 4 dígitos.");
      return;
    }
    if (!currentUser || !currentUser.hashedPin) {
      setPageError("Error: No se pudo verificar el PIN. Intenta recargar.");
      console.error("PinEntryPage: No hay currentUser o hashedPin para verificar.");
      return;
    }

    // --- CORRECCIÓN: Usar setIsLoading ---
    setIsLoading(true);
    setPageError(null); 

    try {
      const isMatch = await bcrypt.compare(pin, currentUser.hashedPin);

      if (isMatch) {
        console.log("PinEntryPage: PIN correcto.");
        setPinVerified(true); 
      } else {
        console.warn("PinEntryPage: PIN incorrecto.");
        setPageError("PIN incorrecto. Intenta de nuevo.");
        setPin(''); 
      }
    } catch (error) {
      console.error("PinEntryPage: Error al comparar PINs:", error);
      setPageError("Ocurrió un error al verificar el PIN.");
    } finally {
      // --- CORRECCIÓN: Usar setIsLoading ---
      setIsLoading(false);
    }
  };

  if (!currentUser) { // Esta guarda ayuda mientras isLoadingAuth de Providers puede estar resolviendo
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
            <p>Cargando...</p> {/* O un spinner más elaborado */}
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-tarjeta rounded-xl shadow-xl text-center">
        <Image 
            src="/logo.png" 
            alt="Logo de la App" 
            width={120} 
            height={80} 
            priority 
            className="mx-auto"
        />
        <h1 className="text-2xl font-bold text-primario">Ingresa tu PIN</h1>
        <p className="text-texto-secundario">
          Hola {currentUser?.nombre || 'Usuario'}, por favor ingresa tu PIN para continuar.
        </p>
        
        <form onSubmit={handlePinSubmit} className="space-y-6">
          <PinInput
            id="pin"
            length={4} 
            value={pin} 
            onChange={(newPin) => setPin(newPin)}
            disabled={isLoading}
            ariaLabel="Ingreso de PIN"
          />

          {pageError && (
            <p className="text-sm text-red-500">{pageError}</p>
          )}
          {userError && !pageError && (
            <p className="text-sm text-red-500">{userError}</p>
          )}

          <Button type="submit" fullWidth disabled={isLoading || pin.length !== 4}>
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </Button>
        </form>
      </div>
    </div>
  );
}