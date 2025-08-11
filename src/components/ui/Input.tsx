// src/app/components/ui/Input.tsx
'use client';

import React, { forwardRef } from 'react';

// 1. Se añade la propiedad opcional 'error' a la interfaz.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  // 2. Se recibe la nueva prop 'error'.
  ({ label, id, className = '', error, ...props }, ref) => {
    return (
      <div className="mb-4 w-full">
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
          {label}
        </label>
        <input
          id={id}
          ref={ref}
          className={`
            block w-full px-3 py-2 
            bg-tarjeta 
            border 
            ${error ? 'border-error' : 'border-borde-tarjeta'} {/* 3. El color del borde cambia si hay un error. */}
            rounded-lg 
            placeholder-texto-secundario 
            focus:outline-none focus:ring-2 focus:ring-primario focus:ring-opacity-50 focus:border-primario 
            sm:text-base text-texto-principal 
            transition-all duration-200 ease-in-out
            ${className}
          `}
          {...props}
        />
        {/* 4. Si existe un error, se muestra el mensaje debajo del input. */}
        {error && <p className="text-sm text-error mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;