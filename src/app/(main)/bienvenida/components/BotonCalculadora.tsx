// src/app/(main)/bienvenida/components/BotonCalculadora.tsx
'use client';

import React from 'react';
import { CalculatorIcon } from '@heroicons/react/24/outline';

interface BotonCalculadoraProps {
  label: string;
  href: string;
}

export default function BotonCalculadora({ label, href }: BotonCalculadoraProps) {
  const handleOpenUrl = () => {
    // Abre la URL en una nueva pestaña para no interrumpir la app
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleOpenUrl();
      }}
      onClick={handleOpenUrl}
      className="
        relative flex flex-col items-center justify-center
        aspect-square w-full max-w-[180px]
        rounded-xl text-texto-principal
        bg-tarjeta
        transition-all duration-150 ease-in-out
        shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
        hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]
        active:scale-95 active:brightness-90 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
      "
    >
      <CalculatorIcon className="w-10 h-10 mb-2 text-texto-principal" />
      <span className="text-sm text-center px-2">
        {label}
      </span>
    </div>
  );
}