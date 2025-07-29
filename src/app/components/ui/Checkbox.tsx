// src/app/components/ui/Checkbox.tsx
'use client';

import React, { InputHTMLAttributes } from 'react';

// Props que el componente aceptará, extendiendo los atributos estándar de un input
interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange' | 'onCheckedChange'> {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  labelClassName?: string;
  disabled?: boolean;
  /** Clases para el div contenedor del checkbox y el label */
  containerClassName?: string;
  /** Clases específicas para el elemento input del checkbox */
  inputClassName?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  id,
  checked = false,
  onCheckedChange,
  label,
  labelClassName = '',
  disabled = false,
  containerClassName = '',
  inputClassName = '',
  ...props // Resto de las props para el input, como 'name', 'value', etc.
}) => {
  // Genera un ID interno si no se provee uno y hay un label, para la asociación label-input
  const internalId = id || (label ? `checkbox-${label.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 7)}` : undefined);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onCheckedChange) {
      onCheckedChange(event.target.checked);
    }
  };

  // Clases del contenedor (sin cambios)
  const finalContainerClasses = `flex items-center ${containerClassName}`;

  // Clases del input refactorizadas para usar el tema unificado
  const finalInputClasses = `
    h-4 w-4 rounded border-borde-tarjeta bg-transparent
    text-primario focus:ring-2 focus:ring-primario focus:ring-offset-2 focus:ring-offset-fondo
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${inputClassName}
  `.trim().replace(/\s+/g, ' ');

  // Clases del label refactorizadas para usar el tema unificado
  const finalLabelClasses = `
    ml-2 text-sm font-medium
    ${disabled ? 'text-texto-secundario cursor-not-allowed' : 'text-texto-principal cursor-pointer'}
    ${labelClassName}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={finalContainerClasses}>
      <input
        type="checkbox"
        id={internalId}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className={finalInputClasses}
        {...props}
      />
      {label && (
        <label
          htmlFor={internalId}
          className={finalLabelClasses}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;