// src/app/components/ui/Card.tsx
'use client';

import React from 'react';

/**
 * Tarjeta con estilo coherente en toda la aplicación.
 * - Usa variables CSS definidas en globals.css para fondo, borde y texto, asegurando compatibilidad con modo claro/oscuro.
 * - Admite `className` adicional para aplicar estilos de layout internos (flex, grid, etc.) o cualquier estilo personalizado.
 * - Diseño minimalista con bordes sutiles y esquinas redondeadas.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode; // El contenido que se renderizará dentro de la tarjeta.
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
  <div
    // Clases de Tailwind CSS aplicadas a la tarjeta:
    // - `bg-[var(--color-tarjeta)]`: Establece el color de fondo de la tarjeta utilizando la variable CSS,
    //   asegurando que se adapte al tema (claro/oscuro).
    // - `text-[var(--color-texto-principal)]`: Define el color del texto principal dentro de la tarjeta,
    //   también adaptable al tema.
    // - `border border-[var(--color-borde-tarjeta)]`: Añade un borde de 1px con el color de borde de tarjeta,
    //   proporcionando una definición sutil sin ser demasiado prominente.
    // - `rounded-xl`: Aplica esquinas redondeadas generosas para un aspecto suave y amigable.
    // - `shadow-sm`: Una sombra sutil para dar una ligera profundidad a la tarjeta,
    //   manteniendo el enfoque minimalista sin ser intrusiva.
    // - `p-4`: Relleno interno de 16px en todos los lados para que el contenido tenga espacio suficiente.
    // - `transition-all duration-200 ease-in-out`: Añade una transición suave para cualquier cambio
    //   de estilo (por ejemplo, si se añaden efectos de hover o focus en el futuro a través de `className`).
    // - `${className}`: Permite a los componentes padres añadir clases adicionales, sobrescribiendo
    //   o extendiendo los estilos predeterminados de la tarjeta.
    className={`
      bg-[var(--color-tarjeta)]
      text-[var(--color-texto-principal)]
      border border-[var(--color-borde-tarjeta)]
      rounded-xl shadow-sm p-4
      transition-all duration-200 ease-in-out
      ${className}
    `}
    {...rest} // Pasa cualquier otra propiedad HTMLDivElement al div principal de la tarjeta.
  >
    {children} {/* Renderiza el contenido pasado como 'children' dentro de la tarjeta. */}
  </div>
);

export default Card;