// src/app/components/forms/SelectorRubro.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import rubrosData from '@/data/rubro.json';

// Las interfaces y tipos de datos se mantienen sin cambios.
interface Subrubro {
  nombre: string;
  requiereMatricula: boolean;
}

interface Rubro {
  nombre: string;
  subrubros: Subrubro[];
  requiereMatricula?: boolean;
}

export interface RubroSeleccionado {
  rubro: string;
  subrubro: Subrubro | null;
}

interface SelectorRubroProps {
  idRubro: string;
  idSubrubro: string;
  labelRubro?: string;
  labelSubrubro?: string;
  error?: string;
  onRubroChange: (seleccion: RubroSeleccionado | null) => void;
  initialValue?: RubroSeleccionado | null;
}

const todosLosRubros: Rubro[] = rubrosData.rubros;

const SelectorRubro: React.FC<SelectorRubroProps> = ({
  idRubro,
  idSubrubro,
  labelRubro = 'Rubro del Comercio/Profesional',
  labelSubrubro = 'Especialidad / Subrubro (si aplica)',
  error,
  onRubroChange,
  initialValue,
}) => {
  const [openRubroPanel, setOpenRubroPanel] = useState(false);
  const [openSubRubroPanel, setOpenSubRubroPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [rubro, setRubro] = useState<Rubro | null>(null);
  const [subrubro, setSubrubro] = useState<Subrubro | null>(initialValue?.subrubro || null);

  // Lógica de filtrado y efectos (sin cambios)
  const rubrosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? todosLosRubros.filter((r) => r.nombre.toLowerCase().includes(q))
      : todosLosRubros;
  }, [search]);

  useEffect(() => {
    if (initialValue?.rubro) {
      const found = todosLosRubros.find(r => r.nombre === initialValue.rubro);
      setRubro(found || null);
    }
  }, [initialValue]);

  useEffect(() => {
    if (rubro) {
      const subrubroValido = rubro.subrubros.find(s => s.nombre === subrubro?.nombre);
      setSubrubro(subrubroValido || null);
    } else {
      setSubrubro(null);
    }
    setOpenSubRubroPanel(false);
  }, [rubro, subrubro?.nombre]);

  useEffect(() => {
    if (rubro) {
      onRubroChange({
        rubro: rubro.nombre,
        subrubro: subrubro || null,
      });
    } else {
      onRubroChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubro, subrubro]);

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor={idRubro}
          className="block text-sm font-medium text-texto-principal mb-1"
        >
          {labelRubro}
        </label>
        <button
          type="button"
          onClick={() => {
            setOpenRubroPanel((o) => !o);
            setOpenSubRubroPanel(false);
          }}
          className={`inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal border-primario ${
            rubro?.nombre ? 'text-primario' : 'text-texto-principal'
          } ${openRubroPanel ? 'bg-white/10' : 'bg-transparent'}`}
        >
          {rubro?.nombre || '— ninguno —'}
        </button>

        {openRubroPanel && (
          <div className="relative mt-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar rubro…"
              className="w-full px-4 py-2 mb-2 rounded-md focus:outline-none transition bg-transparent text-texto-principal border border-borde-tarjeta"
            />
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
              {rubrosFiltrados.length ? (
                rubrosFiltrados.map((r) => (
                  <button
                    key={r.nombre}
                    type="button"
                    onClick={() => {
                      setRubro(r);
                      setSubrubro(null);
                      setOpenRubroPanel(false);
                      setSearch('');
                    }}
                    className={`h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words border-primario hover:bg-white/10 ${
                      r.nombre === rubro?.nombre
                        ? 'bg-primario text-fondo'
                        : 'bg-transparent text-texto-principal'
                    }`}
                  >
                    {r.nombre}
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

      {rubro && rubro.subrubros.length > 0 && (
        <div>
          <label
            htmlFor={idSubrubro}
            className="block text-sm font-medium text-texto-principal mb-1"
          >
            {labelSubrubro}
          </label>
          <button
            type="button"
            onClick={() => setOpenSubRubroPanel((o) => !o)}
            className={`inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal border-primario ${
              subrubro ? 'text-primario' : 'text-texto-principal'
            } ${openSubRubroPanel ? 'bg-white/10' : 'bg-transparent'}`}
          >
            {subrubro?.nombre || '— ninguna —'}
          </button>

          {openSubRubroPanel && (
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-auto">
              {rubro.subrubros.map((s) => (
                <button
                  key={s.nombre}
                  type="button"
                  onClick={() => {
                    setSubrubro(s);
                    setOpenSubRubroPanel(false);
                  }}
                  className={`h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words border-primario hover:bg-white/10 ${
                    s.nombre === subrubro?.nombre
                      ? 'bg-primario text-fondo'
                      : 'bg-transparent text-texto-principal'
                  }`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
};

export default SelectorRubro;