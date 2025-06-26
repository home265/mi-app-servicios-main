// src/app/components/ui/Button.tsx
'use client';

import React from 'react';

// Define las propiedades que acepta el componente Button, extendiendo las propiedades estándar de un botón HTML.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode; // Contenido del botón, puede ser texto, iconos, etc.
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'; // Define el estilo visual del botón.
  isLoading?: boolean; // Indica si el botón está en un estado de carga.
  fullWidth?: boolean; // Si es true, el botón ocupará todo el ancho disponible.
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary', // Variante por defecto es 'primary'.
  isLoading = false, // Por defecto no está cargando.
  fullWidth = false, // Por defecto no ocupa todo el ancho.
  className = '', // Clases adicionales que pueden pasarse al botón.
  ...props // Todas las demás propiedades HTML de un botón.
}) => {
  // Clases base que se aplican a todos los botones para una estética unificada.
  // - `px-4 py-2`: Espaciado interno consistente.
  // - `rounded-lg`: Esquinas más redondeadas para un tacto más suave y moderno.
  // - `font-semibold`: Texto en negrita para legibilidad.
  // - `focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo`:
  //   Estilo de enfoque claro y accesible, con un offset que usa el color de fondo para una integración sutil.
  // - `transition-all duration-150 ease-in-out`: Transiciones suaves para los estados de hover y focus.
  // - `disabled:opacity-50 disabled:cursor-not-allowed`: Estilos para botones deshabilitados.
  // - `relative overflow-hidden`: Preparación para futuros efectos visuales si se desean (e.g., ripples).
  const baseClasses = `
    px-4 py-2 rounded-lg font-semibold 
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo 
    transition-all duration-150 ease-in-out 
    disabled:opacity-50 disabled:cursor-not-allowed
    relative overflow-hidden
  `;

  // Clase condicional para que el botón ocupe todo el ancho.
  const fullWidthClass = fullWidth ? 'w-full' : '';

  let variantClasses = ''; // Almacena las clases específicas para cada variante.
  switch (variant) {
    case 'secondary':
      // Botón secundario: fondo amarillo, texto blanco.
      // Sutil oscurecimiento en hover y estado activo.
      variantClasses = `
        bg-secundario text-white 
        hover:bg-secundario/90 active:bg-secundario 
        focus:ring-secundario
      `;
      break;
    case 'danger':
      // Botón de peligro/acción destructiva: fondo rojo, texto blanco.
      // Sutil oscurecimiento en hover y estado activo.
      variantClasses = `
        bg-error text-white 
        hover:bg-error/90 active:bg-error 
        focus:ring-error
      `;
      break;
    case 'ghost':
      // Botón "fantasma": transparente, texto y anillo de enfoque en color primario.
      // Fondo muy sutil en hover y estado activo para una interacción limpia.
      variantClasses = `
        bg-transparent text-primario 
        hover:bg-primario/10 active:bg-primario/20 
        focus:ring-primario
      `;
      break;
    case 'outline':
      // Botón con contorno: fondo transparente, borde y texto en color primario.
      // Sutil fondo y oscurecimiento del texto en hover y estado activo.
      variantClasses = `
        bg-transparent text-primario border-2 border-primario 
        hover:bg-primario/10 active:bg-primario/20 
        focus:ring-primario
      `;
      break;
    case 'primary':
    default:
      // Botón primario (por defecto): fondo verde oscuro, texto blanco.
      // Sutil oscurecimiento en hover y estado activo.
      variantClasses = `
        bg-primario text-white 
        hover:bg-primario/90 active:bg-primario 
        focus:ring-primario
      `;
      break;
  }

  // Combina todas las clases: base, variante, ancho completo y clases personalizadas.
  // Se añade una sombra sutil en hover para dar una sensación de elevación y profundidad,
  // contribuyendo a la interactividad sin ser intrusivo.
  const finalClasses = `${baseClasses} ${variantClasses} ${fullWidthClass} ${className} hover:shadow-md`;

  return (
    <button
      className={finalClasses}
      disabled={isLoading || props.disabled} // El botón se deshabilita si está cargando o si la prop `disabled` es true.
      {...props} // Pasa cualquier otra propiedad al elemento botón HTML subyacente.
    >
      {isLoading ? (
        // Muestra un spinner de carga si `isLoading` es true.
        // El spinner usa `border-current` para tomar el color del texto del botón.
        <span className="animate-spin inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full" role="status" aria-label="Cargando"></span>
      ) : (
        // Muestra el contenido normal del botón si no está cargando.
        children
      )}
    </button>
  );
};

export default Button;