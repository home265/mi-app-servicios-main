// src/app/components/forms/SelectorCategoria.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import categoriasData from '@/data/categorias.json';

// --- CORRECCIÓN 1: La interfaz ahora incluye la propiedad 'requiereMatricula' ---
// Esta es la información que se enviará al formulario padre.
export interface CategoriaSeleccionada {
  categoria: string;
  subcategoria: string | null;
  requiereMatricula: boolean;
}

// Interfaz para la data del JSON, que coincide con la estructura del archivo.
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
  initialValue?: { categoria: string, subcategoria: string | null }; // El tipo inicial no cambia
  labelColor?: string;
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
  labelColor = '#F9F3D9',
  error,
}: SelectorCategoriaProps) {
  const [openCatPanel, setOpenCatPanel] = useState(false);
  const [openSubPanel, setOpenSubPanel] = useState(false);
  const [search, setSearch] = useState('');
  
  // --- CORRECCIÓN 2: El estado ahora almacena el OBJETO Categoria completo, o null. ---
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [subcategoria, setSubcategoria] = useState<string | null>(initialValue?.subcategoria || null);

  const highlight = '#EFC71D';
  const borderColor = '#2F5854';
  const cardBg = 'rgba(0,0,0,0)';
  const hoverBg = 'rgba(255,255,255,0.1)';

  const selectorBtn =
    'inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal';
  const listBtn =
    'h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words';

  // Lógica de filtrado (sin cambios)
  const catsFiltradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? todasLasCategorias.filter(c => c.nombre.toLowerCase().includes(q))
      : todasLasCategorias;
  }, [search]);

  // Efecto para establecer el valor inicial si se proporciona
  useEffect(() => {
    if (initialValue?.categoria) {
      const found = todasLasCategorias.find(c => c.nombre === initialValue.categoria);
      setCategoria(found || null);
    }
  }, [initialValue]);

  // Al cambiar categoría: resetear subcategoría y cargar nuevas subcats
  useEffect(() => {
    // No reseteamos la subcategoría aquí para permitir la carga inicial
    if (categoria) {
      setSubcategoria(prev => {
        // Si la subcategoría previa no está en la lista de nuevas subcategorías, la limpiamos.
        const subsDisponibles = categoria.subcategorias || [];
        return subsDisponibles.includes(prev || '') ? prev : null;
      });
    }
    setOpenSubPanel(false);
  }, [categoria]);

  // Notificar cambios al padre
  useEffect(() => {
    if (categoria) {
      // --- CORRECCIÓN 3: Enviamos el objeto completo con 'requiereMatricula' ---
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
            // --- CORRECCIÓN 4: Leemos la propiedad .nombre del objeto categoria ---
            color: categoria?.nombre ? highlight : labelColor,
            borderColor: highlight,
          }}
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
                      // --- CORRECCIÓN 5: Guardamos el objeto 'c' completo, no solo su nombre ---
                      setCategoria(c);
                      setSubcategoria(null); // Reseteamos la subcategoría al cambiar la principal
                      setOpenCatPanel(false);
                      setSearch('');
                    }}
                    className={listBtn + ' hover:bg-white/10'}
                    style={{
                      // Leemos la propiedad .nombre del objeto categoria para la comparación
                      backgroundColor: c.nombre === categoria?.nombre ? highlight : cardBg,
                      color: c.nombre === categoria?.nombre ? '#0F2623' : labelColor,
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
      {/* --- CORRECCIÓN 6: Verificamos si hay subcategorías en el objeto 'categoria' --- */}
      {categoria && categoria.subcategorias.length > 0 && (
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
              {categoria.subcategorias.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubcategoria(s);
                    setOpenSubPanel(false);
                  }}
                  className={listBtn + ' hover:bg-white/10'}
                  style={{
                    backgroundColor: s === subcategoria ? highlight : cardBg,
                    color: s === subcategoria ? '#0F2623' : labelColor,
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

      {error && (
        <p className="text-sm text-error mt-1">
          {error}
        </p>
      )}
    </div>
  );
}