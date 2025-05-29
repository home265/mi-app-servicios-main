// src/app/components/ui/Card.tsx
'use client';

import React from 'react';

/**
 * Tarjeta con estilo coherente en toda la aplicación.
 * - Usa variables CSS definidas en globals.css para fondo, borde y texto.
 * - Admite className adicional para layout interno (flex, grid, etc.).
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', ...rest }) => (
  <div
    className={`
      bg-[var(--color-tarjeta)]
      text-[var(--color-texto-principal)]
      border border-[var(--color-borde-tarjeta)]
      rounded-xl shadow-md p-4
      ${className}
    `}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
