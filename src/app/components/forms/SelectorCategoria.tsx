// src/app/components/forms/SelectorCategoria.tsx
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import categoriasData from '@/data/categorias.json';

export interface CategoriaSeleccionada {
  categoria: string;
  subcategoria: string | null;
}

// 1. Se añade la propiedad 'error' a la interfaz.
interface SelectorCategoriaProps {
  idCategoria: string;
  idSubcategoria: string;
  labelCategoria?: string;
  labelSubcategoria?: string;
  onCategoriaChange: (seleccion: CategoriaSeleccionada | null) => void;
  initialValue?: CategoriaSeleccionada | null;
  labelColor?: string;
  error?: string; // Propiedad para el mensaje de error
}

interface Categoria {
  nombre: string;
  subcategorias: string[];
}

const todasLasCategorias: Categoria[] = categoriasData.categorias;

export default function SelectorCategoria({
  idCategoria,
  idSubcategoria,
  labelCategoria = 'Seleccionar categoría',
  labelSubcategoria = 'Seleccionar subcategoría',
  onCategoriaChange,
  initialValue,
  labelColor = '#F9F3D9',
  error, // 2. Se recibe la nueva prop 'error'.
}: SelectorCategoriaProps) {
  const [openCatPanel, setOpenCatPanel] = useState(false);
  const [openSubPanel, setOpenSubPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState(initialValue?.categoria || '');
  const [subcategoria, setSubcategoria] = useState(initialValue?.subcategoria || '');
  const [subcats, setSubcats] = useState<string[]>([]);

  const highlight = '#EFC71D';
  const borderColor = '#2F5854';
  const cardBg = 'rgba(0,0,0,0)';
  const hoverBg = 'rgba(255,255,255,0.1)';

  // Botones de selección
  const selectorBtn =
    'inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal';
  // Botones del listado con altura fija y texto centrado
  const listBtn =
    'h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words';

  // Filtrar categorías
  const catsFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? todasLasCategorias.filter(c => c.nombre.toLowerCase().includes(q))
      : todasLasCategorias;
  }, [search]);

  // Al cambiar categoría: resetear subcategoría y cargar nuevas subcats
  useEffect(() => {
    // Siempre limpiar subcategoría previa
    setSubcategoria('');
    if (!categoria) {
      setSubcats([]);
    } else {
      const found = todasLasCategorias.find(c => c.nombre === categoria);
      setSubcats(found?.subcategorias || []);
    }
    // Cerrar panel de subcategorías
    setOpenSubPanel(false);
  }, [categoria]);

  // Notificar cambios al padre
  useEffect(() => {
    if (categoria) {
      onCategoriaChange({ categoria, subcategoria: subcategoria || null });
    } else {
      onCategoriaChange(null);
    }
  }, [categoria, subcategoria]);

  return (
    <div className="space-y-4">
      {/* Selector de categoría */}
      <div>
        <label
          htmlFor={idCategoria}
          className="block text-sm font-medium mb-1"
          style={{ color: labelColor }}
        >
          {labelCategoria}
        </label>
        <button
          type="button"
          onClick={() => { setOpenCatPanel(o => !o); setOpenSubPanel(false); }}
          className={selectorBtn}
          style={{
            backgroundColor: openCatPanel ? hoverBg : cardBg,
            color: categoria ? highlight : labelColor,
            borderColor: highlight,
          }}
        >
          {categoria || '— ninguna —'}
        </button>

        {openCatPanel && (
          <div className="relative mt-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoría…"
              className="w-full px-4 py-2 mb-2 rounded-md focus:outline-none transition"
              style={{
                backgroundColor: cardBg,
                color: labelColor,
                border: `1px solid ${borderColor}`,
              }}
            />
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
              {catsFiltradas.length ? (
                catsFiltradas.map(c => (
                  <button
                    key={c.nombre}
                    type="button"
                    onClick={() => {
                      setCategoria(c.nombre);
                      setOpenCatPanel(false);
                      setSearch('');
                    }}
                    className={listBtn + ' hover:bg-white/10'}
                    style={{
                      backgroundColor: c.nombre === categoria ? highlight : cardBg,
                      color: c.nombre === categoria ? '#0F2623' : labelColor,
                      borderColor: highlight,
                    }}
                  >
                    {c.nombre}
                  </button>
                ))
              ) : (
                <p className="col-span-3 text-center text-sm py-4" style={{ color: labelColor, opacity: 0.6 }}>
                  Sin resultados
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selector de subcategoría */}
      {categoria && (
        <div>
          <label
            htmlFor={idSubcategoria}
            className="block text-sm font-medium mb-1"
            style={{ color: labelColor }}
          >
            {labelSubcategoria}
          </label>
          <button
            type="button"
            onClick={() => setOpenSubPanel(o => !o)}
            className={selectorBtn}
            style={{
              backgroundColor: openSubPanel ? hoverBg : cardBg,
              color: subcategoria ? highlight : labelColor,
              borderColor: highlight,
            }}
          >
            {subcategoria || '— ninguna —'}
          </button>

          {openSubPanel && (
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-auto">
              {subcats.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubcategoria(s);
                    setOpenSubPanel(false);
                  }}
                  className={listBtn + ' hover:bg-white/10'}
                  style={{
                    backgroundColor: cardBg,
                    color: labelColor,
                    borderColor: highlight,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Se muestra el mensaje de error si existe. */}
      {error && (
        <p className="text-sm text-error mt-1">
          {error}
        </p>
      )}
    </div>
  );
}