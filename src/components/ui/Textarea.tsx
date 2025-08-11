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
    'block w-full px-3 py-2 bg-fondo border rounded-md shadow-sm placeholder-texto-secundario focus:outline-none sm:text-sm text-texto-principal';
  
  const borderClasses = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-borde-tarjeta focus:ring-primario focus:border-primario';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`${baseClasses} ${borderClasses}`}
        spellCheck="true"
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Textarea;