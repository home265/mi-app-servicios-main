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

  // Construcción de clases de forma manual
  const finalContainerClasses = `flex items-center ${containerClassName}`;

  const finalInputClasses = `
    h-4 w-4 rounded border-gray-300 dark:border-gray-600
    text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-0
    dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:bg-gray-700
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${inputClassName}
  `.trim().replace(/\s+/g, ' '); // Limpia espacios extra

  const finalLabelClasses = `
    ml-2 text-sm font-medium text-gray-900 dark:text-gray-300
    ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'cursor-pointer'}
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