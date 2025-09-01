// /app/components/forms/VerificadorCuit.tsx
'use client';

import { useState } from 'react';
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
  type RegisterOptions,
} from 'react-hook-form';
import type { InformacionFiscal } from '@/types/informacionFiscal';
import type { ParsedNombre } from '@/lib/parseNombreFromTusFacturasError';

/** Respuesta esperada del endpoint /api/verificar-cuit */
type ApiOk = { error?: false; data: InformacionFiscal };
type ApiErr = { error: true; message: string; extractedNombre?: ParsedNombre };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ApiResponse = ApiOk | ApiErr;

function isApiOk(x: unknown): x is ApiOk {
  return (
    typeof x === 'object' &&
    x !== null &&
    'data' in x &&
    // no validamos todo InformacionFiscal aquí para no sobre-tipar
    typeof (x as { data?: unknown }).data === 'object'
  );
}

function isApiErr(x: unknown): x is ApiErr {
  return (
    typeof x === 'object' &&
    x !== null &&
    'error' in x &&
    (x as { error?: unknown }).error === true &&
    typeof (x as { message?: unknown }).message === 'string'
  );
}

// Se usan genéricos para que el componente sea reutilizable y mantenga los tipos
interface VerificadorCuitProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>; // Path<T> asegura que el 'name' exista en los valores del formulario
  rules?: RegisterOptions<T, Path<T>>;
  nombre: string;
  apellido: string;
  onVerificationSuccess: (datos: InformacionFiscal) => void;
  onCuilNombreExtraido?: (p: ParsedNombre | null) => void; // ← NUEVO (opcional)
}

export default function VerificadorCuit<T extends FieldValues>({
  control,
  name,
  rules,
  nombre,
  apellido,
  onVerificationSuccess,
  onCuilNombreExtraido, // ← NUEVO
}: VerificadorCuitProps<T>) {
  const { field, fieldState } = useController({ name, control, rules });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerificar = async () => {
    const rawValue = String(field.value ?? '');
    const cuit = rawValue.replace(/\D/g, ''); // solo dígitos

    if (!cuit || cuit.length < 8 || !nombre || !apellido) {
      setStatus('error');
      setMessage('Por favor, completa tu nombre, apellido y un CUIL/CUIT válido.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/verificar-cuit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cuit, nombre, apellido }),
      });

      const json: unknown = await response.json();

      if (!response.ok) {
        const msg =
          (isApiErr(json) && json.message) ||
          'No se pudo verificar el CUIL/CUIT en este momento.';
        throw new Error(msg);
      }

      // Éxito normal (CUIT con padrón)
      if (isApiOk(json)) {
        setStatus('success');
        setMessage(`✔️ Verificado: ${json.data.razonSocial}`);
        onVerificationSuccess(json.data); // Notifica al formulario padre
        onCuilNombreExtraido?.(null); // ← NUEVO: limpiar valor previo de CUIL
        return;
      }

      // Caso CUIL: 200 + error:true + extractedNombre
      if (isApiErr(json) && json.extractedNombre) {
        setStatus('success');
        setMessage(`✔️ Coincidencia por CUIL: ${json.extractedNombre.nombreCompleto}`);
        onCuilNombreExtraido?.(json.extractedNombre); // ← NUEVO: emitir al padre
        return;
      }

      // Error “real” con mensaje
      if (isApiErr(json)) {
        throw new Error(json.message);
      }

      // Cualquier otra cosa es inesperada
      throw new Error('Respuesta inesperada del verificador.');
    } catch (error: unknown) {
      setStatus('error');
      setMessage(error instanceof Error ? `❌ ${error.message}` : '❌ Ocurrió un error inesperado.');
    }
  };

  return (
    <div>
      <label
        htmlFor={String(name)}
        className="block text-sm font-medium text-texto-secundario mb-2"
      >
        CUIL / CUIT
      </label>

      <div className="flex items-center space-x-2">
        <input
          id={String(name)}
          type="text"
          placeholder="Ingresa el nro y verifica"
          className="block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow"
          {...field}
          ref={field.ref}
          onChange={(e) => {
            // guardamos solo dígitos en el estado del form para evitar caracteres raros
            const onlyDigits = e.target.value.replace(/\D/g, '');
            field.onChange(onlyDigits);
          }}
          inputMode="numeric"
          autoComplete="off"
        />

        <button
          type="button"
          onClick={handleVerificar}
          disabled={status === 'loading'}
          className="btn-secondary px-4 py-3 shrink-0"
          aria-busy={status === 'loading'}
        >
          {status === 'loading' ? '...' : 'Verificar'}
        </button>
      </div>

      {fieldState.error && (
        <p className="text-sm text-error mt-1">{fieldState.error.message}</p>
      )}

      {message && (
        <p
          className={`text-sm mt-1 ${
            status === 'error' ? 'text-error' : 'text-success'
          }`}
          aria-live="polite"
        >
          {message}
        </p>
      )}
    </div>
  );
}
