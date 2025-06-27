// src/app/auth/set-new-pin/page.tsx
'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import bcrypt from 'bcryptjs';

import { useUserStore } from '@/store/userStore';
import { updateUserPin } from '@/lib/firebase/firestore'; // La función que creamos antes

import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

// Definimos los valores que tendrá nuestro formulario
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

  // Observamos el valor del primer PIN para poder compararlo con el segundo
  const pinValue = watch('pin');

  // Función que se ejecuta al enviar el formulario
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setServerError(null);

    if (!currentUser || !currentUser.uid || !currentUser.rol) {
      setServerError('No se pudo encontrar la información del usuario. Por favor, inicia sesión de nuevo.');
      return;
    }

    try {
      // 1. Hashear el nuevo PIN antes de guardarlo
      const salt = await bcrypt.genSalt(10);
      const newHashedPin = await bcrypt.hash(data.pin, salt);

      // 2. Llamar a la función para actualizar el PIN en Firestore
      await updateUserPin(currentUser.uid, currentUser.rol, newHashedPin);

      // 3. Si todo sale bien, marcamos la sesión como verificada con PIN
      setPinVerified(true);
      
      // 4. Redirigimos al usuario a la página de bienvenida
      router.replace('/bienvenida');

    } catch (error) {
      console.error("Error al actualizar el PIN:", error);
      if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError('Ocurrió un error inesperado al intentar guardar tu nuevo PIN.');
      }
    }
  };

  if (!currentUser) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-fondo text-texto p-4">
            <p>Cargando información de usuario...</p>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-4">
      <div className="
        w-full max-w-md space-y-6 rounded-xl border
        border-borde-tarjeta bg-tarjeta p-6 shadow-xl md:p-8
        text-center
      ">
        <h1 className="text-2xl font-bold text-primario">Crea tu nuevo PIN</h1>
        <p className="text-texto-secundario">
          Tu identidad ha sido verificada. Por favor, establece un nuevo PIN de seguridad de 4 dígitos.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
          <Input
            id="pin"
            label="Nuevo PIN de Seguridad (4 dígitos)"
            type="password"
            placeholder="Crea un PIN numérico"
            maxLength={4}
            inputMode="numeric"
            {...register('pin', {
              required: 'El nuevo PIN es obligatorio',
              minLength: { value: 4, message: 'El PIN debe tener 4 dígitos' },
              maxLength: { value: 4, message: 'El PIN debe tener 4 dígitos' },
              pattern: { value: /^\d{4}$/, message: 'El PIN solo debe contener números' },
            })}
          />
          {errors.pin && <p className="text-sm text-error -mt-3 mb-2">{errors.pin.message}</p>}

          <Input
            id="repetirPin"
            label="Repetir Nuevo PIN"
            type="password"
            placeholder="Confirma tu nuevo PIN"
            maxLength={4}
            inputMode="numeric"
            {...register('repetirPin', {
              required: 'Debes confirmar el nuevo PIN',
              validate: (value) => value === pinValue || 'Los PINs no coinciden',
            })}
          />
          {errors.repetirPin && <p className="text-sm text-error -mt-3 mb-2">{errors.repetirPin.message}</p>}
          
          {serverError && <p className="text-sm text-error text-center">{serverError}</p>}

          <Button type="submit" isLoading={isSubmitting} fullWidth className="!mt-8">
            {isSubmitting ? 'Guardando...' : 'Guardar y Continuar'}
          </Button>
        </form>
      </div>
    </div>
  );
}