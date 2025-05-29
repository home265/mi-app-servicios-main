// src/app/components/forms/SelectorCategoria.tsx
'use client';

import React, { useState, useEffect } from 'react';
import categoriasData from '@/data/categorias.json';

interface Categoria {
  nombre: string;
  subcategorias: string[];
}

export interface CategoriaSeleccionada {
  categoria: string;
  subcategoria: string | null;
}

interface SelectorCategoriaProps {
  idCategoria: string;
  idSubcategoria: string;
  labelCategoria?: string;
  labelSubcategoria?: string;
  error?: string; // <<--- CAMBIO AQUÍ: De errorCategoria/errorSubcategoria a solo 'error'
  onCategoriaChange: (seleccion: CategoriaSeleccionada | null) => void;
  initialValue?: CategoriaSeleccionada | null;
}

const todasLasCategorias: Categoria[] = categoriasData.categorias;

const SelectorCategoria: React.FC<SelectorCategoriaProps> = ({
  idCategoria,
  idSubcategoria,
  labelCategoria = "Categoría de Servicio",
  labelSubcategoria = "Subcategoría (si aplica)",
  error, // <<--- USAREMOS ESTA PROP
  onCategoriaChange,
  initialValue,
}) => {
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>(initialValue?.categoria || '');
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string>(initialValue?.subcategoria || '');
  const [subcategoriasDisponibles, setSubcategoriasDisponibles] = useState<string[]>([]);

  useEffect(() => {
    if (categoriaSeleccionada) {
      const categoriaActual = todasLasCategorias.find(cat => cat.nombre === categoriaSeleccionada);
      if (categoriaActual && categoriaActual.subcategorias.length > 0) {
        setSubcategoriasDisponibles(categoriaActual.subcategorias);
        // Si la subcategoría inicial ya no es válida para la nueva categoría, la reseteamos
        if (initialValue?.categoria !== categoriaSeleccionada || !categoriaActual.subcategorias.includes(subcategoriaSeleccionada)) {
            // No la reseteamos aquí para permitir que la validación de react-hook-form actúe
            // si la subcategoría se vuelve obligatoria y no está seleccionada.
            // El usuario deberá seleccionar una subcategoría válida.
        }
      } else {
        setSubcategoriasDisponibles([]);
        setSubcategoriaSeleccionada(''); // Resetear si no hay subcategorías
      }
    } else {
      setSubcategoriasDisponibles([]);
      setSubcategoriaSeleccionada('');
    }
  }, [categoriaSeleccionada, initialValue?.categoria, subcategoriaSeleccionada]); // Añadido initialValue?.categoria para re-evaluar si cambia

  useEffect(() => {
    // Sincronizar con valor inicial si cambia desde fuera (menos común para este uso)
    if (initialValue) {
        if (initialValue.categoria !== categoriaSeleccionada) {
            setCategoriaSeleccionada(initialValue.categoria || '');
        }
        if (initialValue.subcategoria !== subcategoriaSeleccionada) {
            setSubcategoriaSeleccionada(initialValue.subcategoria || '');
        }
    }
  }, [categoriaSeleccionada, initialValue, subcategoriaSeleccionada]);


  useEffect(() => {
    if (categoriaSeleccionada) {
      onCategoriaChange({
        categoria: categoriaSeleccionada,
        subcategoria: subcategoriaSeleccionada || null,
      });
    } else {
      onCategoriaChange(null);
    }
  }, [categoriaSeleccionada, subcategoriaSeleccionada, onCategoriaChange]);

  const handleCategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaSeleccionada(e.target.value);
    setSubcategoriaSeleccionada(''); // Siempre resetear subcategoría al cambiar la principal
  };

  const handleSubcategoriaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubcategoriaSeleccionada(e.target.value);
  };

  const selectBaseClasses = "block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark";

  return (
    <>
      <div className="mb-4">
        <label htmlFor={idCategoria} className="block text-sm font-medium text-texto-secundario mb-1">
          {labelCategoria}
        </label>
        <select
          id={idCategoria}
          value={categoriaSeleccionada}
          onChange={handleCategoriaChange}
          className={`${selectBaseClasses} ${error ? 'border-error focus:border-error focus:ring-error' : 'border-gray-300 dark:border-gray-600 focus:border-primario focus:ring-primario'}`}
        >
          <option value="">Selecciona una categoría...</option>
          {todasLasCategorias.map((cat) => (
            <option key={cat.nombre} value={cat.nombre}>
              {cat.nombre}
            </option>
          ))}
        </select>
        {/* El error principal se mostrará debajo de ambos o por el Controller */}
      </div>

      {subcategoriasDisponibles.length > 0 && (
        <div className="mb-4">
          <label htmlFor={idSubcategoria} className="block text-sm font-medium text-texto-secundario mb-1">
            {labelSubcategoria}
          </label>
          <select
            id={idSubcategoria}
            value={subcategoriaSeleccionada}
            onChange={handleSubcategoriaChange}
            className={`${selectBaseClasses} ${error && !subcategoriaSeleccionada ? 'border-error focus:border-error focus:ring-error' : 'border-gray-300 dark:border-gray-600 focus:border-primario focus:ring-primario'}`}
          >
            <option value="">Selecciona una subcategoría...</option>
            {subcategoriasDisponibles.map((subcat) => (
              <option key={subcat} value={subcat}>
                {subcat}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* El error general del Controller se mostrará fuera de este componente,
          o podrías mostrar `error` aquí si es un mensaje general para el conjunto.
          Ya que el Controller en RegistroForm.tsx mostrará errors.seleccionCategoria.message,
          no es estrictamente necesario repetirlo aquí a menos que quieras un estilo diferente.
      */}
      {/* {error && <p className="text-sm text-error mt-1">{error}</p>} */}
    </>
  );
};

export default SelectorCategoria;