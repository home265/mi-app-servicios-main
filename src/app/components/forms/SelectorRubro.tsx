// src/app/components/forms/SelectorRubro.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  error?: string;
  onRubroChange: (seleccion: RubroSeleccionado | null) => void;
  initialValue?: RubroSeleccionado | null;
  labelColor?: string; // Prop para consistencia con SelectorCategoria
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
  labelColor = '#F9F3D9', // Valor por defecto para consistencia
}) => {
  // --- Estados para la UI y la lógica del componente ---
  const [openRubroPanel, setOpenRubroPanel] = useState(false);
  const [openSubRubroPanel, setOpenSubRubroPanel] = useState(false);
  const [search, setSearch] = useState('');
  const [rubro, setRubro] = useState(initialValue?.rubro || '');
  const [subrubro, setSubrubro] = useState(initialValue?.subrubro || '');
  const [subrubrosDisponibles, setSubrubrosDisponibles] = useState<string[]>([]);

  // --- Constantes de estilo para replicar el look de SelectorCategoria ---
  const highlight = '#EFC71D';
  const borderColor = '#2F5854';
  const cardBg = 'rgba(0,0,0,0)';
  const hoverBg = 'rgba(255,255,255,0.1)';

  // Clases de botones para consistencia visual
  const selectorBtn =
    'inline-flex items-center justify-start px-3 py-1 text-sm rounded-md border transition whitespace-normal';
  const listBtn =
    'h-16 flex items-center justify-center px-3 py-2 text-sm rounded-md border transition w-full whitespace-normal break-words';

  // --- Lógica de filtrado de rubros ---
  const rubrosFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? todosLosRubros.filter((r) => r.nombre.toLowerCase().includes(q))
      : todosLosRubros;
  }, [search]);

  // --- Efectos para manejar la lógica del componente ---

  // Al cambiar el rubro principal, resetear subrubro y cargar nuevas opciones
  useEffect(() => {
    setSubrubro(''); // Limpiar siempre el subrubro previo
    if (!rubro) {
      setSubrubrosDisponibles([]);
    } else {
      const found = todosLosRubros.find((r) => r.nombre === rubro);
      setSubrubrosDisponibles(found?.subrubros || []);
    }
    setOpenSubRubroPanel(false); // Cerrar el panel de subrubros
     
  }, [rubro]);

  // Notificar cambios al componente padre
  useEffect(() => {
    if (rubro) {
      onRubroChange({ rubro, subrubro: subrubro || null });
    } else {
      onRubroChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubro, subrubro]);

  return (
    <div className="space-y-4">
      {/* Selector de Rubro Principal */}
      <div>
        <label
          htmlFor={idRubro}
          className="block text-sm font-medium mb-1"
          style={{ color: labelColor }}
        >
          {labelRubro}
        </label>
        <button
          type="button"
          onClick={() => {
            setOpenRubroPanel((o) => !o);
            setOpenSubRubroPanel(false);
          }}
          className={selectorBtn}
          style={{
            backgroundColor: openRubroPanel ? hoverBg : cardBg,
            color: rubro ? highlight : labelColor,
            borderColor: highlight,
          }}
        >
          {rubro || '— ninguno —'}
        </button>

        {openRubroPanel && (
          <div className="relative mt-2">
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar rubro…"
              className="w-full px-4 py-2 mb-2 rounded-md focus:outline-none transition"
              style={{
                backgroundColor: cardBg,
                color: labelColor,
                border: `1px solid ${borderColor}`,
              }}
            />
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-auto">
              {rubrosFiltrados.length ? (
                rubrosFiltrados.map((r) => (
                  <button
                    key={r.nombre}
                    type="button"
                    onClick={() => {
                      setRubro(r.nombre);
                      setOpenRubroPanel(false);
                      setSearch('');
                    }}
                    className={listBtn + ' hover:bg-white/10'}
                    style={{
                      backgroundColor: r.nombre === rubro ? highlight : cardBg,
                      color: r.nombre === rubro ? '#0F2623' : labelColor,
                      borderColor: highlight,
                    }}
                  >
                    {r.nombre}
                  </button>
                ))
              ) : (
                <p
                  className="col-span-3 text-center text-sm py-4"
                  style={{ color: labelColor, opacity: 0.6 }}
                >
                  Sin resultados
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selector de Subrubro */}
      {rubro && subrubrosDisponibles.length > 0 && (
        <div>
          <label
            htmlFor={idSubrubro}
            className="block text-sm font-medium mb-1"
            style={{ color: labelColor }}
          >
            {labelSubrubro}
          </label>
          <button
            type="button"
            onClick={() => setOpenSubRubroPanel((o) => !o)}
            className={selectorBtn}
            style={{
              backgroundColor: openSubRubroPanel ? hoverBg : cardBg,
              color: subrubro ? highlight : labelColor,
              borderColor: highlight,
            }}
          >
            {subrubro || '— ninguna —'}
          </button>

          {openSubRubroPanel && (
            <div className="grid grid-cols-3 gap-2 mt-2 max-h-60 overflow-auto">
              {subrubrosDisponibles.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSubrubro(s);
                    setOpenSubRubroPanel(false);
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

      {/* Muestra el mensaje de error si existe */}
      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
};

export default SelectorRubro;