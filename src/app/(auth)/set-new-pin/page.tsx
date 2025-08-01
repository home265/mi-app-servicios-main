'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';

import { useUserStore } from '@/store/userStore';
// Se eliminan los imports de los componentes UI genéricos
// import Input from '@/app/components/ui/Input';
// import Button from '@/app/components/ui/Button';

// La definición de los valores del formulario no cambia.
type FormValues = {
  pin: string;
  repetirPin: string;
};

export default function SetNewPinPage() {
  const router = useRouter();
  const { currentUser, setPinVerified } = useUserStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      pin: '',
      repetirPin: '',
    },
  });

  const pinValue = watch('pin');

  // La lógica de envío no se modifica.
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError(null);

    if (!currentUser || !currentUser.uid || !currentUser.rol) {
      setServerError('No se pudo encontrar la información del usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    try {
      const response = await fetch('/api/auth/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: currentUser.uid,
          rol: currentUser.rol,
          newPin: data.pin,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ocurrió un error al intentar guardar tu nuevo PIN.');
      }
      
      setPinVerified(true);
      router.replace('/bienvenida');

    } catch (error) {
      console.error("Error al actualizar el PIN:", error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setServerError(errorMessage);
    }
  };

  if (!currentUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-fondo text-texto p-4">
            <p>Cargando información de usuario...</p>
        </div>
    );
  }

  // Estilo base para los inputs 3D
  const inputClassName = "block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">
      {/* --- TARJETA PRINCIPAL CON ESTILO 3D --- */}
      <div className="
        w-full max-w-md space-y-6 rounded-2xl
        bg-tarjeta p-6 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] md:p-8
        text-center
      ">
        <h1 className="text-2xl font-bold text-primario">Crea tu nuevo PIN</h1>
        <p className="text-texto-secundario">
          Tu identidad ha sido verificada. Por favor, establece un nuevo PIN de seguridad de 4 dígitos.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-texto-secundario mb-2 text-left">Nuevo PIN de Seguridad (4 dígitos)</label>
            <input
              id="pin"
              type="password"
              placeholder="Crea un PIN numérico"
              maxLength={4}
              inputMode="numeric"
              className={inputClassName}
              {...register('pin', {
                required: 'El nuevo PIN es obligatorio',
                minLength: { value: 4, message: 'El PIN debe tener 4 dígitos' },
                maxLength: { value: 4, message: 'El PIN debe tener 4 dígitos' },
                pattern: { value: /^\d{4}$/, message: 'El PIN solo debe contener números' },
              })}
            />
            {errors.pin && <p className="text-sm text-error mt-1 text-left">{errors.pin.message}</p>}
          </div>

          <div>
            <label htmlFor="repetirPin" className="block text-sm font-medium text-texto-secundario mb-2 text-left">Repetir Nuevo PIN</label>
            <input
              id="repetirPin"
              type="password"
              placeholder="Confirma tu nuevo PIN"
              maxLength={4}
              inputMode="numeric"
              className={inputClassName}
              {...register('repetirPin', {
                required: 'Debes confirmar el nuevo PIN',
                validate: (value) => value === pinValue || 'Los PINs no coinciden',
              })}
            />
            {errors.repetirPin && <p className="text-sm text-error mt-1 text-left">{errors.repetirPin.message}</p>}
          </div>
          
          {serverError && <p className="text-sm text-error text-center">{serverError}</p>}

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
              {isSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}