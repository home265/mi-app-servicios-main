// src/app/components/paginas-amarillas/SelectorHorariosAtencion.tsx
'use client';

import React, { useState, useCallback } from 'react';
import {
  HorariosDeAtencion,
  EstadoHorarioDia,
  DIAS_SEMANA_CONFIG_INICIAL,
} from '@/types/horarios';
import EditorDiaHorario from './EditorDiaHorario';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Checkbox from '@/app/components/ui/Checkbox';

interface SelectorHorariosAtencionProps {
  horariosIniciales?: HorariosDeAtencion;
  onChange: (horarios: HorariosDeAtencion) => void;
  className?: string;
}

const SelectorHorariosAtencion: React.FC<SelectorHorariosAtencionProps> = ({
  horariosIniciales,
  onChange: propsOnChange,
  className,
}) => {
  const [horarios, setHorarios] = useState<HorariosDeAtencion>(() => {
    if (horariosIniciales && horariosIniciales.length === 7) {
      const esValido = horariosIniciales.every(
        dia => typeof dia.diaIndice === 'number' && dia.estado !== undefined
      );
      if (esValido) {
        return horariosIniciales.map(dia => ({
          ...dia,
          estado: Array.isArray(dia.estado)
            ? dia.estado.map(r => ({ ...r }))
            : dia.estado,
        }));
      }
    }
    return DIAS_SEMANA_CONFIG_INICIAL.map(dia => ({
      ...dia,
      estado: Array.isArray(dia.estado) ? dia.estado.map(r => ({ ...r })) : dia.estado,
    }));
  });

  const [es24HorasGlobal, setEs24HorasGlobal] = useState<boolean>(() => {
    return horariosIniciales?.length === 7
      ? horariosIniciales.every(dia => dia.estado === 'abierto24h')
      : false;
  });

  const handleUpdateDia = useCallback(
    (diaIndiceActualizado: number, nuevoEstadoParaDia: EstadoHorarioDia) => {
      const nuevosHorarios = horarios.map(dia =>
        dia.diaIndice === diaIndiceActualizado
          ? { ...dia, estado: nuevoEstadoParaDia }
          : dia
      );
      setHorarios(nuevosHorarios);
      propsOnChange(nuevosHorarios);

      if (es24HorasGlobal && nuevoEstadoParaDia !== 'abierto24h') {
        setEs24HorasGlobal(false);
      }
    },
    [horarios, propsOnChange, es24HorasGlobal]
  );

  const toggle24HorasGlobal = useCallback(
    (checked: boolean) => {
      setEs24HorasGlobal(checked);
      const nuevoEstadoGlobal: EstadoHorarioDia = checked ? 'abierto24h' : 'cerrado';
      const nuevosHorarios = horarios.map(dia => ({
        ...dia,
        estado: nuevoEstadoGlobal,
      }));
      setHorarios(nuevosHorarios);
      propsOnChange(nuevosHorarios);
    },
    [horarios, propsOnChange]
  );

  return (
    // --- CONTENEDOR PRINCIPAL CON ESTILO 3D ---
    <div
      className={`space-y-4 rounded-2xl bg-tarjeta p-4
                 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] ${
        className
      }`}
    >
      {/* Encabezado de la sección */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-borde-tarjeta">
        <h3 className="font-semibold text-lg text-texto-principal mb-3 sm:mb-0">
          Horario de Atención
        </h3>
        
        {/* --- CHECKBOX MODERNO (INTERRUPTOR) --- */}
        <label htmlFor="check-24h-global" className="flex items-center cursor-pointer group">
          <span className="text-sm font-medium text-texto-principal mr-3 select-none">
            Todos los días 24hs
          </span>
          <div className="relative">
            <input
              type="checkbox"
              id="check-24h-global"
              className="sr-only peer" // Oculta el checkbox nativo
              checked={es24HorasGlobal}
              onChange={(e) => toggle24HorasGlobal(e.target.checked)}
            />
            {/* Base del interruptor */}
            <div className="w-12 h-7 bg-fondo rounded-full shadow-[inset_1px_1px_4px_rgba(0,0,0,0.6)] peer-checked:bg-primario transition-colors duration-300"></div>
            {/* Círculo del interruptor */}
            <div className="absolute left-1 top-1 w-5 h-5 bg-texto-secundario rounded-full transition-transform duration-300 ease-in-out
                           peer-checked:translate-x-5 peer-checked:bg-fondo"></div>
          </div>
        </label>
      </div>

      {/* Lista de editores de día (sin cambios en la lógica) */}
      <div className="space-y-1">
        {horarios.map(configDia => (
          <EditorDiaHorario
            key={configDia.diaIndice}
            configDia={configDia}
            onUpdate={handleUpdateDia}
            globalmenteDeshabilitado={es24HorasGlobal}
          />
        ))}
      </div>
    </div>
  );
};

export default SelectorHorariosAtencion;