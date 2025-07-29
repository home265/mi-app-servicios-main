// src/app/components/forms/SelectorCategoria.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import categoriasData from '@/data/categorias.json';

// Las interfaces y tipos de datos se mantienen sin cambios.
export interface CategoriaSeleccionada {
  categoria: string;
  subcategoria: string | null;
  requiereMatricula: boolean;
}

interface Categoria {
  nombre: string;
  subcategorias: string[];
  requiereMatricula: boolean;
}

interface SelectorCategoriaProps {
  idCategoria: string;
  idSubcategoria: string;
  labelCategoria?: string;
  labelSubcategoria?: string;
  onCategoriaChange: (seleccion: CategoriaSeleccionada | null) => void;
  initialValue?: { categoria: string, subcategoria: string | null };
  error?: string;
}

const todasLasCategorias: Categoria[] = categoriasData.categorias;

export default function SelectorCategoria({
  idCategoria,
  idSubcategoria,
  labelCategoria = 'Seleccionar categoría',
  labelSubcategoria = 'Seleccionar subcategoría',
  onCategoriaChange,
  initialValue,
  error,
}: SelectorCategoriaProps) {
  const [openCatPanel, setOpenCatPanel] = useState(false);
  const [openSubPanel, setOpenSubPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(initialValue?.subcategoria || null);

  // Lógica de filtrado y efectos (sin cambios)
  const catsFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? todasLasCategorias.filter(c => c.nombre.toLowerCase().includes(q))
      : todasLasCategorias;
  }, [search]);

  useEffect(() => {
    if (initialValue?.categoria) {
      const found = todasLasCategorias.find(c => c.nombre === initialValue.categoria);
      setCategoria(found || null);
    }
  }, [initialValue]);

  useEffect(() => {
    if (categoria) {
      setSubcategoria(prev => {
        const subsDisponibles = categoria.subcategorias || [];
        return subsDisponibles.includes(prev || '') ? prev : null;
      });
    }
    setOpenSubPanel(false);
  }, [categoria]);

  useEffect(() => {
    if (categoria) {
      onCategoriaChange({
        categoria: categoria.nombre,
        subcategoria: subcategoria || null,
        requiereMatricula: categoria.requiereMatricula,
      });
    } else {
      onCategoriaChange(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, subcategoria]);

  return (
    <div className="space-y-4">
      {/* Selector de categoría */}
      <div>
        <label
          htmlFor={idCategoria}
          className="block text-sm font-medium text-texto-principal mb-1"
        >
          {labelCategoria}
        </label>
        <button
          type="button"
          onClick={() => { setOpenCatPanel(o => !o); setOpenSubPanel(false); }}
          className={`inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal border-primario ${
            categoria?.nombre ? 'text-primario' : 'text-texto-principal'
          } ${openCatPanel ? 'bg-white/10' : 'bg-transparent'}`}
        >
          {categoria?.nombre || '— ninguna —'}
        </button>

        {openCatPanel && (
          <div className="relative mt-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoría…"
              className="w-full px-4 py-2 mb-2 rounded-md focus:outline-none transition bg-transparent text-texto-principal border border-borde-tarjeta"
            />
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
              {catsFiltradas.length ? (
                catsFiltradas.map(c => (
                  <button
                    key={c.nombre}
                    type="button"
                    onClick={() => {
                      setCategoria(c);
                      setSubcategoria(null);
                      setOpenCatPanel(false);
                      setSearch('');
                    }}
                    className={`h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words border-primario hover:bg-white/10 ${
                      c.nombre === categoria?.nombre
                        ? 'bg-primario text-fondo'
                        : 'bg-transparent text-texto-principal'
                    }`}
                  >
                    {c.nombre}
                  </button>
                ))
              ) : (
                <p className="col-span-3 text-center text-sm py-4 text-texto-secundario opacity-60">
                  Sin resultados
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selector de subcategoría */}
      {categoria && categoria.subcategorias.length > 0 && (
        <div>
          <label
            htmlFor={idSubcategoria}
            className="block text-sm font-medium text-texto-principal mb-1"
          >
            {labelSubcategoria}
          </label>
          <button
            type="button"
            onClick={() => setOpenSubPanel(o => !o)}
            className={`inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal border-primario ${
              subcategoria ? 'text-primario' : 'text-texto-principal'
            } ${openSubPanel ? 'bg-white/10' : 'bg-transparent'}`}
          >
            {subcategoria || '— ninguna —'}
          </button>

          {openSubPanel && (
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-auto">
              {categoria.subcategorias.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubcategoria(s);
                    setOpenSubPanel(false);
                  }}
                  className={`h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words border-primario hover:bg-white/10 ${
                    s === subcategoria
                      ? 'bg-primario text-fondo'
                      : 'bg-transparent text-texto-principal'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-error mt-1">
          {error}
        </p>
      )}
    </div>
  );
}