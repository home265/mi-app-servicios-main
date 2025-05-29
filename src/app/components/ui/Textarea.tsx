// src/app/components/ui/Textarea.tsx
import React, { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  id: string;
  error?: string;
  className?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  id,
  error,
  className = '',
  ...props
}) => {
  const baseClasses =
    'block w-full px-3 py-2 bg-[var(--color-fondo)] border rounded-md shadow-sm placeholder-[var(--color-texto-placeholder)] focus:outline-none sm:text-sm text-[var(--color-texto)] dark:text-[var(--color-texto-dark)]';
  const borderClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-[var(--color-borde-tarjeta)] focus:ring-[var(--color-primario)] focus:border-[var(--color-primario)]';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${baseClasses} ${borderClasses}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Textarea;