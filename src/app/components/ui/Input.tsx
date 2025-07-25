// src/app/components/ui/Input.tsx
'use client';

import React, { forwardRef } from 'react';

// Define las propiedades del componente Input.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

// Se usa `forwardRef` para permitir que los componentes padres obtengan una referencia
// al elemento <input> subyacente. Esto es crucial para funcionalidades como enfocar el input
// programáticamente.
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, id, className = '', ...props }, ref) => {
    return (
      // Contenedor principal para el label y el input, con un margen inferior para separación.
      <div className="mb-4 w-full">
        {/* Etiqueta para el input, con estilos para un texto pequeño, semi-negrita y color secundario,
          coherente con la jerarquía visual de un diseño minimalista. */}
        <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
          {label}
        </label>
        <input
          id={id}
          // La ref se pasa directamente al elemento input del DOM.
          ref={ref}
          // Clases de Tailwind CSS para estilizar el input:
          // - `block w-full`: El input ocupa todo el ancho disponible y se comporta como un bloque.
          // - `px-3 py-2`: Relleno horizontal y vertical para espacio interno.
          // - `bg-tarjeta`: Fondo del input, utilizando la variable CSS de tarjeta para adaptabilidad de tema.
          // - `border border-borde-tarjeta`: Borde delgado con el color de borde de tarjeta.
          // - `rounded-lg`: Esquinas suavemente redondeadas, consistente con otros elementos de UI.
          // - `placeholder-texto-secundario`: Color de texto para el placeholder, usando la variable secundaria
          //                                   para un contraste sutil pero legible.
          // - `focus:outline-none focus:ring-2 focus:ring-primario focus:ring-opacity-50 focus:border-primario`:
          //   Estilos de enfoque: elimina el contorno predeterminado, añade un anillo de enfoque de 2px
          //   con el color primario y 50% de opacidad, y cambia el color del borde a primario.
          //   Esto proporciona una retroalimentación visual clara y amigable al usuario.
          // - `sm:text-base`: Tamaño de texto base, adaptable a dispositivos pequeños.
          // - `text-texto-principal`: Color de texto principal para el contenido del input.
          // - `transition-all duration-200 ease-in-out`: Transiciones suaves para los cambios de estilo al enfocar.
          // - `${className}`: Permite sobrescribir o añadir clases personalizadas desde el componente padre.
          className={`
            block w-full px-3 py-2 
            bg-tarjeta 
            border border-borde-tarjeta 
            rounded-lg 
            placeholder-texto-secundario 
            focus:outline-none focus:ring-2 focus:ring-primario focus:ring-opacity-50 focus:border-primario 
            sm:text-base text-texto-principal 
            transition-all duration-200 ease-in-out
            ${className}
          `}
          {...props} // Pasa todas las demás propiedades HTML del input (como `type`, `placeholder`, `value`, `onChange`, `name`, etc.).
        />
      </div>
    );
  }
);

// Asignar un nombre para mostrar en las herramientas de desarrollo de React.
Input.displayName = 'Input';

export default Input;