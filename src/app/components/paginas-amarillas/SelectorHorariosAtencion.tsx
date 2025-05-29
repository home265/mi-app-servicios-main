// src/app/components/paginas-amarillas/SelectorHorariosAtencion.tsx
'use client';

import React, { useState, useCallback } from 'react';
import {
  HorariosDeAtencion,
  EstadoHorarioDia,
  DIAS_SEMANA_CONFIG_INICIAL,
  RangoHorario,
} from '@/types/horarios';
import EditorDiaHorario from './EditorDiaHorario';
import Checkbox from '@/app/components/ui/Checkbox';
import Button from '@/app/components/ui/Button';

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

  const [diaFuenteIndice, setDiaFuenteIndice] = useState<number | null>(null);

  const handleUpdateDia = useCallback(
    (diaIndiceActualizado: number, nuevoEstadoParaDia: EstadoHorarioDia) => {
      const nuevosHorarios = horarios.map(dia =>
        dia.diaIndice === diaIndiceActualizado
          ? { ...dia, estado: nuevoEstadoParaDia }
          : dia
      );
      setHorarios(nuevosHorarios);
      propsOnChange(nuevosHorarios);

      if (es24HorasGlobal) {
        const diaActualizado = nuevosHorarios.find(
          h => h.diaIndice === diaIndiceActualizado
        );
        if (diaActualizado && diaActualizado.estado !== 'abierto24h') {
          setEs24HorasGlobal(false);
        }
      }
      if (Array.isArray(nuevoEstadoParaDia) && nuevoEstadoParaDia.length > 0) {
        setDiaFuenteIndice(diaIndiceActualizado);
      } else if (diaFuenteIndice === diaIndiceActualizado) {
        setDiaFuenteIndice(null);
      }
    },
    [horarios, propsOnChange, es24HorasGlobal, diaFuenteIndice]
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
      setDiaFuenteIndice(null);
    },
    [horarios, propsOnChange]
  );

  const aplicarHorarioFuenteADiasConfigurables = useCallback(() => {
    if (diaFuenteIndice === null) return;
    const horarioFuenteDia = horarios.find(
      h => h.diaIndice === diaFuenteIndice
    );
    if (
      !horarioFuenteDia ||
      !Array.isArray(horarioFuenteDia.estado) ||
      horarioFuenteDia.estado.length === 0
    )
      return;

    const rangosFuente = horarioFuenteDia.estado as RangoHorario[];
    const nuevosHorarios = horarios.map(dia => {
      if (
        dia.diaIndice !== diaFuenteIndice &&
        dia.estado !== 'cerrado' &&
        dia.estado !== 'abierto24h'
      ) {
        return { ...dia, estado: rangosFuente.map(r => ({ ...r })) };
      }
      return dia;
    });
    setHorarios(nuevosHorarios);
    propsOnChange(nuevosHorarios);
  },
  [diaFuenteIndice, horarios, propsOnChange]
  );

  const isAplicarDisabled =
    es24HorasGlobal ||
    diaFuenteIndice === null ||
    !Array.isArray(horarios.find(h => h.diaIndice === diaFuenteIndice)?.estado) ||
    (horarios.find(h => h.diaIndice === diaFuenteIndice)?.estado as RangoHorario[])
      .length === 0 ||
    !horarios.some(
      dia =>
        dia.diaIndice !== diaFuenteIndice &&
        dia.estado !== 'cerrado' &&
        dia.estado !== 'abierto24h'
    );

  return (
    <div
      className={`space-y-4 p-3 sm:p-4 border rounded-md shadow-sm bg-card ${
        className
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-t-md -m-3 sm:-m-4 mb-3 sm:mb-4 border-b dark:border-gray-700">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2 sm:mb-0">
          Horario de Atención
        </h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="check-24h-global"
            checked={es24HorasGlobal}
            onCheckedChange={toggle24HorasGlobal}
            label="Todos los días 24hs"
            labelClassName="text-sm font-medium text-gray-700 dark:text-gray-300"
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

      {!es24HorasGlobal &&
        diaFuenteIndice !== null &&
        horarios.find(
          h =>
            h.diaIndice === diaFuenteIndice &&
            Array.isArray(h.estado) &&
            h.estado.length > 0
        ) && (
          <div className="pt-3 mt-3 border-t dark:border-gray-700 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={aplicarHorarioFuenteADiasConfigurables}
              disabled={isAplicarDisabled}
              title={
                isAplicarDisabled
                  ? 'Define un horario específico para un día (que será la fuente) y asegúrate de que otros días no estén marcados como "Cerrado" o "24hs" para habilitar esta opción.'
                  : 'Aplica la configuración del día fuente a los demás días que permitan horarios específicos.'
              }
              className="text-xs px-2.5 py-1.5"
            >
              Aplicar horario fuente
            </Button>
          </div>
        )}
    </div>
  );
};

export default SelectorHorariosAtencion;
