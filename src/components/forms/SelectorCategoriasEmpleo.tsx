'use client';
import React from 'react';
import categoriasData from '@/data/categorias_empleo.json';

/** * El JSON puede ser un array de strings:
 * ["Administración","Atención al cliente",…]
 * o un objeto { categorias:[…] }. 
 * Detectamos ambos casos.
 */
type CategoriasFile = { categorias?: string[] };
const categorias: string[] = Array.isArray(categoriasData)
  ? (categoriasData as string[])
  : ((categoriasData as CategoriasFile).categorias ?? []);

interface Props {
  value   : string[];                 // rubros seleccionados
  onChange: (rubros: string[]) => void;
}

export default function SelectorCategoriasEmpleo({ value, onChange }: Props) {
  const toggle = (rubro: string) => {
    const next = value.includes(rubro)
      ? value.filter((r) => r !== rubro)
      : value.length < 4
        ? [...value, rubro]
        : value;                      // no más de 4
    onChange(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {categorias.map((rubro) => (
        <label key={rubro} className="flex items-center space-x-2 text-sm cursor-pointer text-texto-principal">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-borde-tarjeta bg-transparent text-primario focus:ring-2 focus:ring-primario focus:ring-offset-2 focus:ring-offset-fondo cursor-pointer"
            checked={value.includes(rubro)}
            onChange={() => toggle(rubro)}
          />
          <span>{rubro}</span>
        </label>
      ))}
    </div>
  );
}