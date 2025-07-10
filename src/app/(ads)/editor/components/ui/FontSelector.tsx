// src/app/editor/components/ui/FontSelector.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';

// Interfaz para definir la estructura de cada opción de fuente.
// Corresponde a la estructura de tu archivo fonts.json.
interface FontOption {
  name: string;
  categoria?: string;
  uso?: string;
}

// Interfaz para definir las props que nuestro componente aceptará.
interface FontSelectorProps {
  id: string;
  options: FontOption[];
  value: string; // El nombre de la fuente actualmente seleccionada.
  onChange: (fontFamily: string) => void; // Función para notificar el cambio.
  label?: string; // Etiqueta opcional para el selector.
}

export default function FontSelector({
  id,
  options,
  value,
  onChange,
  label = 'Fuente:',
}: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (fontName: string) => {
    onChange(fontName);
    setIsOpen(false);
  };

  // Efecto para cerrar el dropdown si se hace clic fuera de él.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
      >
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          id={id}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] 
                     focus:ring-primario focus:border-primario text-left flex justify-between items-center"
        >
          {/* Muestra la fuente seleccionada con su propio estilo */}
          <span style={{ fontFamily: value, fontSize: '1.1rem' }}>
            {value}
          </span>
          <svg
            className={`w-5 h-5 text-[var(--color-texto-secundario)] transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <ul
            className="absolute z-20 w-full mt-1 bg-[var(--color-tarjeta)] border border-[var(--color-borde-input)] 
                       rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {options.map((font) => (
              <li
                key={font.name}
                onClick={() => handleSelect(font.name)}
                className="px-3 py-2 text-[var(--color-texto-principal)] cursor-pointer hover:bg-primario/20"
                // Aplica el estilo de cada fuente a su opción en la lista
                style={{ fontFamily: font.name, fontSize: '1.25rem' }}
              >
                {font.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}