// src/app/components/paginas-amarillas/SelectorHorariosAtencion.tsx
'use client';

import React, { useState, useCallback } from 'react';
import {
  HorariosDeAtencion,
  EstadoHorarioDia,
  DIAS_SEMANA_CONFIG_INICIAL,
} from '@/types/horarios';
import EditorDiaHorario from './EditorDiaHorario';
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
    <div
      className={`space-y-4 p-3 sm:p-4 border border-borde-tarjeta rounded-md shadow-sm bg-tarjeta ${
        className
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-fondo rounded-t-md -m-3 sm:-m-4 mb-3 sm:mb-4 border-b border-borde-tarjeta">
        <h3 className="font-semibold text-lg text-texto-principal mb-2 sm:mb-0">
          Horario de Atención
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="check-24h-global"
            checked={es24HorasGlobal}
            onCheckedChange={toggle24HorasGlobal}
            label="Todos los días 24hs"
            labelClassName="text-sm font-medium"
            containerClassName="flex-row-reverse sm:flex-row"
            inputClassName="ml-0 sm:ml-2 mr-2 sm:mr-0"
          />
        </div>
      </div>

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