// src/app/components/paginas-amarillas/EditorDiaHorario.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ConfiguracionDia, RangoHorario, EstadoHorarioDia } from '@/types/horarios';
import { XCircleIcon, PlusCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '../ui/Button';
import BotonDeSeleccion from '../common/BotonDeSeleccion';

interface EditorDiaHorarioProps {
  configDia: ConfiguracionDia;
  onUpdate: (diaIndice: number, nuevoEstado: EstadoHorarioDia) => void;
  globalmenteDeshabilitado?: boolean;
}

const opcionesEstado = [
  { id: 'cerrado', label: 'Cerrado' },
  { id: 'abierto24h', label: 'Abierto 24hs' },
  { id: 'porRangos', label: 'Horario Específico' },
];

const EditorDiaHorario: React.FC<EditorDiaHorarioProps> = ({
  configDia,
  onUpdate,
  globalmenteDeshabilitado = false,
}) => {
  const { diaIndice, diaNombre, estado } = configDia;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const esPorRangos = Array.isArray(estado);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEstadoTipoChange = (nuevoTipo: 'cerrado' | 'abierto24h' | 'porRangos') => {
    setIsDropdownOpen(false);
    if (nuevoTipo === 'porRangos') {
      onUpdate(diaIndice, [{ de: '09:00', a: '17:00' }]);
    } else {
      onUpdate(diaIndice, nuevoTipo);
    }
  };

  const getLabelActual = () => {
    if (estado === 'cerrado') return 'Cerrado';
    if (estado === 'abierto24h') return 'Abierto 24hs';
    return 'Horario Específico';
  };

  const handleAddRango = () => {
    if (Array.isArray(estado)) {
      onUpdate(diaIndice, [...estado, { de: '09:00', a: '17:00' }]);
    }
  };

  const handleRangoChange = (rangoIndex: number, campo: keyof RangoHorario, valor: string) => {
    if (Array.isArray(estado)) {
      const valorFormateado = valor.replace(/[^0-9]/g, '').slice(0, 4);
      let finalValue = valorFormateado;
      if (valorFormateado.length > 2) {
        finalValue = `${valorFormateado.slice(0, 2)}:${valorFormateado.slice(2)}`;
      }
      const nuevosRangos = estado.map((rango, idx) =>
        idx === rangoIndex ? { ...rango, [campo]: finalValue } : rango
      );
      onUpdate(diaIndice, nuevosRangos);
    }
  };
  
  const handleRemoveRango = (rangoIndex: number) => {
    if (Array.isArray(estado)) {
      const nuevosRangos = estado.filter((_, idx) => idx !== rangoIndex);
      onUpdate(diaIndice, nuevosRangos.length > 0 ? nuevosRangos : 'cerrado');
    }
  };

  const inputsRangoDisabled = globalmenteDeshabilitado || !esPorRangos;

  return (
    <div className="flex flex-col gap-y-3 p-3 border-b border-borde-tarjeta last:border-b-0 hover:bg-white/5 transition-colors duration-150">
      <div className="flex items-center gap-x-4">
        <span className="font-medium w-28 shrink-0 text-texto-principal">{diaNombre}</span>
        
        <div className="relative w-full sm:w-auto" ref={dropdownRef}>
          {/* --- DESPLEGABLE DE ESTADO 3D --- */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={globalmenteDeshabilitado}
            className="flex items-center justify-between w-full rounded-xl bg-tarjeta px-4 py-2 text-left text-base text-texto-principal
                       disabled:opacity-60 disabled:cursor-not-allowed
                       shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
                       transition-all duration-150 ease-in-out
                       hover:brightness-110 active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
            aria-label={`Estado del horario para ${diaNombre}`}
          >
            <span>{getLabelActual()}</span>
            <ChevronDownIcon className={`h-5 w-5 ml-2 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-borde-tarjeta bg-tarjeta shadow-xl p-2 space-y-2">
              {opcionesEstado.map(op => (
                <BotonDeSeleccion
                  key={op.id}
                  label={op.label}
                  onClick={() => handleEstadoTipoChange(op.id as 'cerrado' | 'abierto24h' | 'porRangos')}
                  isSelected={getLabelActual() === op.label}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {esPorRangos && (
        <div className="pl-0 sm:pl-32 space-y-3">
          {(estado as RangoHorario[]).map((rango, rangoIdx) => (
            <div key={rangoIdx} className="flex items-center gap-x-2">
              {/* --- INPUTS DE HORA CON ESTILO "HUNDIDO" --- */}
              <input
                type="text"
                value={rango.de}
                placeholder="HH:MM"
                maxLength={5}
                onChange={(e) => handleRangoChange(rangoIdx, 'de', e.target.value)}
                disabled={inputsRangoDisabled}
                className="w-24 text-center text-base p-2 rounded-xl bg-tarjeta border-none text-texto-principal disabled:opacity-50
                           shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] focus:outline-none focus:ring-2 focus:ring-primario"
                aria-label={`Hora de inicio del turno ${rangoIdx + 1} para ${diaNombre}`}
              />
              <span className={`text-sm ${inputsRangoDisabled ? 'text-texto-secundario opacity-50' : 'text-texto-secundario'}`}>-</span>
              <input
                type="text"
                value={rango.a}
                placeholder="HH:MM"
                maxLength={5}
                onChange={(e) => handleRangoChange(rangoIdx, 'a', e.target.value)}
                disabled={inputsRangoDisabled}
                className="w-24 text-center text-base p-2 rounded-xl bg-tarjeta border-none text-texto-principal disabled:opacity-50
                           shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] focus:outline-none focus:ring-2 focus:ring-primario"
                aria-label={`Hora de fin del turno ${rangoIdx + 1} para ${diaNombre}`}
              />
              <button
                type="button"
                onClick={() => handleRemoveRango(rangoIdx)}
                disabled={inputsRangoDisabled}
                aria-label={`Eliminar turno ${rangoIdx + 1} para ${diaNombre}`}
                className="ml-auto p-1 rounded-full text-error hover:bg-error/10 disabled:text-texto-secundario disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>
          ))}
          {/* --- BOTÓN "AÑADIR TURNO" 3D SECUNDARIO --- */}
          <button
            type="button"
            onClick={handleAddRango}
            disabled={inputsRangoDisabled}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-tarjeta text-texto-secundario
                       disabled:opacity-60 disabled:cursor-not-allowed
                       shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
                       transition-all duration-150 ease-in-out
                       hover:text-texto-principal hover:brightness-110 active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Añadir Turno
          </button>
        </div>
      )}
    </div>
);
};

export default EditorDiaHorario;