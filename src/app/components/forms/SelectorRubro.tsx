// src/app/components/forms/SelectorRubro.tsx
'use client';

import React, { useState, useEffect } from 'react';
import rubrosData from '@/data/rubro.json';

interface Rubro {
  nombre: string;
  subrubros: string[];
}

export interface RubroSeleccionado {
  rubro: string;
  subrubro: string | null;
}

interface SelectorRubroProps {
  idRubro: string;
  idSubrubro: string;
  labelRubro?: string;
  labelSubrubro?: string;
  error?: string; // <<--- CAMBIO AQUÍ
  onRubroChange: (seleccion: RubroSeleccionado | null) => void;
  initialValue?: RubroSeleccionado | null;
}

const todosLosRubros: Rubro[] = rubrosData.rubros;

const SelectorRubro: React.FC<SelectorRubroProps> = ({
  idRubro,
  idSubrubro,
  labelRubro = "Rubro del Comercio/Profesional",
  labelSubrubro = "Especialidad / Subrubro (si aplica)",
  error, // <<--- USAREMOS ESTA PROP
  onRubroChange,
  initialValue,
}) => {
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string>(initialValue?.rubro || '');
  const [subrubroSeleccionado, setSubrubroSeleccionado] = useState<string>(initialValue?.subrubro || '');
  const [subrubrosDisponibles, setSubrubrosDisponibles] = useState<string[]>([]);

  useEffect(() => {
    if (rubroSeleccionado) {
      const rubroActual = todosLosRubros.find(rub => rub.nombre === rubroSeleccionado);
      if (rubroActual && rubroActual.subrubros.length > 0) {
        setSubrubrosDisponibles(rubroActual.subrubros);
      } else {
        setSubrubrosDisponibles([]);
      }
      // No reseteamos subrubro aquí automáticamente si la categoría principal cambia,
      // para permitir que la validación actúe. El usuario deberá seleccionar una nueva.
      // Si la subcategoría inicial ya no es válida, la validación lo indicará.
    } else {
      setSubrubrosDisponibles([]);
      setSubrubroSeleccionado('');
    }
  }, [rubroSeleccionado]);

  useEffect(() => {
    // Sincronizar con valor inicial
     if (initialValue) {
        if (initialValue.rubro !== rubroSeleccionado) {
            setRubroSeleccionado(initialValue.rubro || '');
        }
        if (initialValue.subrubro !== subrubroSeleccionado) {
            setSubrubroSeleccionado(initialValue.subrubro || '');
        }
    }
  }, [initialValue, rubroSeleccionado, subrubroSeleccionado]);

  useEffect(() => {
    if (rubroSeleccionado) {
      onRubroChange({
        rubro: rubroSeleccionado,
        subrubro: subrubroSeleccionado || null,
      });
    } else {
      onRubroChange(null);
    }
  }, [rubroSeleccionado, subrubroSeleccionado, onRubroChange]);


  const handleRubroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRubroSeleccionado(e.target.value);
    setSubrubroSeleccionado(''); // Siempre resetear subrubro al cambiar el principal
  };

  const handleSubrubroChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSubrubroSeleccionado(e.target.value);
  };

  const selectBaseClasses = "block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark";

  return (
    <>
      <div className="mb-4">
        <label htmlFor={idRubro} className="block text-sm font-medium text-texto-secundario mb-1">
          {labelRubro}
        </label>
        <select
          id={idRubro}
          value={rubroSeleccionado}
          onChange={handleRubroChange}
          className={`${selectBaseClasses} ${error ? 'border-error focus:border-error focus:ring-error' : 'border-gray-300 dark:border-gray-600 focus:border-primario focus:ring-primario'}`}
        >
          <option value="">Selecciona un rubro...</option>
          {todosLosRubros.map((rub) => (
            <option key={rub.nombre} value={rub.nombre}>
              {rub.nombre}
            </option>
          ))}
        </select>
      </div>

      {subrubrosDisponibles.length > 0 && (
        <div className="mb-4">
          <label htmlFor={idSubrubro} className="block text-sm font-medium text-texto-secundario mb-1">
            {labelSubrubro}
          </label>
          <select
            id={idSubrubro}
            value={subrubroSeleccionado}
            onChange={handleSubrubroChange}
            className={`${selectBaseClasses} ${error && !subrubroSeleccionado ? 'border-error focus:border-error focus:ring-error' : 'border-gray-300 dark:border-gray-600 focus:border-primario focus:ring-primario'}`}
          >
            <option value="">Selecciona una especialidad...</option>
            {subrubrosDisponibles.map((subrub) => (
              <option key={subrub} value={subrub}>
                {subrub}
              </option>
            ))}
          </select>
        </div>
      )}
      {/* El mensaje de error general del Controller (pasado como prop 'error')
          será mostrado por el <p> debajo del Controller en RegistroForm.tsx.
          Si queremos mostrar el 'error' DENTRO de este componente, podríamos hacer:
      {error && <p className="text-sm text-error mt-1">{error}</p>}
      */}
    </>
  );
};

export default SelectorRubro;