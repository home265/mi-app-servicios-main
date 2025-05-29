// src/app/components/ui/Button.tsx
'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'; // 'outline' añadido
  isLoading?: boolean;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  className = '',
  ...props
}) => {
  // Clases base comunes a todos los botones
  const baseClasses = `
    px-4 py-2 rounded-md font-semibold shadow-sm 
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    transition-all duration-150 ease-in-out 
    disabled:opacity-50 disabled:cursor-not-allowed
    border-2 border-borde-tarjeta 
  `;

  const fullWidthClass = fullWidth ? 'w-full' : '';

  let variantClasses = '';
  switch (variant) {
    case 'secondary':
      variantClasses = 'bg-secundario text-white hover:bg-opacity-80 focus:ring-secundario';
      // El borde base 'border-borde-tarjeta' se aplicará.
      break;
    case 'danger':
      variantClasses = 'bg-error text-white hover:bg-opacity-80 focus:ring-error';
      // El borde base 'border-borde-tarjeta' se aplicará.
      break;
    case 'ghost':
      // Para ghost, queremos que el borde base sea el que se vea, o que no tenga borde si es solo texto/icono.
      // Si quieres que ghost no tenga el borde violeta base, necesitarías quitar 'border-borde-tarjeta' de baseClasses
      // y añadirlo específicamente a los variants que sí lo necesiten, o sobreescribirlo aquí con 'border-transparent'.
      // Por ahora, lo dejamos con el borde violeta como los demás.
      variantClasses = 'bg-transparent text-primario hover:bg-primario/10 focus:ring-primario';
      break;
    case 'outline': // NUEVO VARIANT
      // Fondo transparente, texto primario.
      // El borde será el 'border-borde-tarjeta' de baseClasses, pero cambiamos su color a primario.
      // Si quieres que el borde de 'outline' sea siempre '--color-primario' y no '--color-borde-tarjeta',
      // puedes añadir 'border-transparent' a baseClasses y luego 'border-primario' aquí.
      // O, como está ahora, 'border-borde-tarjeta border-[var(--color-primario)]' donde la última anula.
      // Para asegurar que el color del borde sea '--color-primario' y mantenga el 'border-2':
      variantClasses = 
        'bg-transparent text-[var(--color-primario)] !border-[var(--color-primario)] ' + // El '!' asegura que este color de borde anule el de baseClasses
        'hover:bg-primario/10 focus:ring-primario';
      break;
    case 'primary':
    default:
      variantClasses = 'bg-primario text-white hover:bg-opacity-80 focus:ring-primario';
      // El borde base 'border-borde-tarjeta' se aplicará.
      break;
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${fullWidthClass} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" role="status" aria-label="loading"></span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;