'use client';

import React from 'react';

interface BotonDeSeleccionProps {
  label: string;
  onClick: () => void;
  isSelected?: boolean;
  className?: string;
  // --- INICIO: NUEVA PROP AÑADIDA ---
  onMouseDown?: () => void; // Hacemos onMouseDown opcional
  // --- FIN: NUEVA PROP AÑADIDA ---
}

export default function BotonDeSeleccion({
  label,
  onClick,
  isSelected = false,
  className = '',
  onMouseDown, // Recibimos la nueva prop
}: BotonDeSeleccionProps) {
  const baseClasses = `
    relative flex items-center justify-center
    w-full h-16 px-3 py-2
    rounded-xl
    transition-all duration-150 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo focus:ring-primario
  `;

  const unselectedClasses = `
    bg-tarjeta text-texto-principal
    shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
    hover:brightness-110
    active:scale-95 active:brightness-90
  `;

  const selectedClasses = `
    bg-primario text-fondo
    shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5)]
    scale-95
  `;

  return (
    <button
      type="button"
      onMouseDown={onMouseDown} // La usamos aquí
      onClick={onClick}
      className={`
        ${baseClasses}
        ${isSelected ? selectedClasses : unselectedClasses}
        ${className}
      `}
    >
      <span className="text-sm text-center break-words">{label}</span>
    </button>
  );
}