// src/app/components/paginas-amarillas/EditorDiaHorario.tsx
'use client';

import React from 'react';
// import Checkbox from '@/app/components/ui/Checkbox'; // Eliminado ya que no se usa
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import { ConfiguracionDia, RangoHorario, EstadoHorarioDia } from '@/types/horarios';
import { XCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface EditorDiaHorarioProps {
  configDia: ConfiguracionDia;
  onUpdate: (diaIndice: number, nuevoEstado: EstadoHorarioDia) => void;
  globalmenteDeshabilitado?: boolean;
}

const EditorDiaHorario: React.FC<EditorDiaHorarioProps> = ({
  configDia,
  onUpdate,
  globalmenteDeshabilitado = false,
}) => {
  const { diaIndice, diaNombre, estado } = configDia;

  const esCerrado = estado === 'cerrado';
  const es24Horas = estado === 'abierto24h';
  const esPorRangos = Array.isArray(estado);

  const handleEstadoTipoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoTipo = e.target.value as 'cerrado' | 'abierto24h' | 'porRangos';
    if (nuevoTipo === 'cerrado') {
      onUpdate(diaIndice, 'cerrado');
    } else if (nuevoTipo === 'abierto24h') {
      onUpdate(diaIndice, 'abierto24h');
    } else {
      const rangosExistentes = Array.isArray(estado) ? estado : [];
      if (rangosExistentes.length === 0) {
        onUpdate(diaIndice, [{ de: '09:00', a: '17:00' }]);
      } else {
        onUpdate(diaIndice, rangosExistentes);
      }
    }
  };

  const handleAddRango = () => {
    if (Array.isArray(estado)) {
      const nuevosRangos = [...estado, { de: '', a: '' }];
      onUpdate(diaIndice, nuevosRangos);
    } else {
      onUpdate(diaIndice, [{ de: '09:00', a: '17:00' }]);
    }
  };

  const handleRangoChange = (
    rangoIndex: number,
    campo: keyof RangoHorario,
    valor: string
  ) => {
    if (Array.isArray(estado)) {
      const nuevosRangos = estado.map((rango, idx) =>
        idx === rangoIndex ? { ...rango, [campo]: valor } : rango
      );
      onUpdate(diaIndice, nuevosRangos);
    }
  };

  const handleRemoveRango = (rangoIndex: number) => {
    if (Array.isArray(estado)) {
      const nuevosRangos = estado.filter((_, idx) => idx !== rangoIndex);
      onUpdate(diaIndice, nuevosRangos);
    }
  };

  const selectorEstadoDisabled = globalmenteDeshabilitado;
  const inputsRangoDisabled = globalmenteDeshabilitado || !esPorRangos;

  return (
    <div className="flex flex-col gap-y-3 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150">
      <div className="flex items-center gap-x-4">
        <span className="font-medium w-28 shrink-0">{diaNombre}</span>
        <select
          value={esCerrado ? 'cerrado' : es24Horas ? 'abierto24h' : 'porRangos'}
          onChange={handleEstadoTipoChange}
          disabled={selectorEstadoDisabled}
          className="block w-full sm:w-auto rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 p-2 text-sm"
          aria-label={`Estado del horario para ${diaNombre}`}
        >
          <option value="cerrado">Cerrado</option>
          <option value="abierto24h">Abierto 24hs</option>
          <option value="porRangos">Horario Específico</option>
        </select>
      </div>

      {esPorRangos && (
        <div className="pl-0 sm:pl-8 space-y-3">
          {(estado as RangoHorario[]).map((rango, rangoIdx) => (
            <div key={rangoIdx} className="flex items-center gap-x-2">
              <div className="flex flex-col w-full">
                <Input
                  id={`dia-${diaIndice}-rango-${rangoIdx}-de`} // ID único añadido
                  type="time"
                  value={rango.de}
                  onChange={(e) => handleRangoChange(rangoIdx, 'de', e.target.value)}
                  disabled={inputsRangoDisabled}
                  className="w-full text-sm" // El mb-4 del Input lo hace un poco espaciado, ajustar si es necesario
                  aria-label={`Hora de inicio del turno ${rangoIdx + 1} para ${diaNombre}`}
                  label="" // Label vacío es válido para tu componente Input
                />
              </div>
              <span className={`text-sm ${inputsRangoDisabled ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
              <div className="flex flex-col w-full">
                <Input
                  id={`dia-${diaIndice}-rango-${rangoIdx}-a`} // ID único añadido
                  type="time"
                  value={rango.a}
                  onChange={(e) => handleRangoChange(rangoIdx, 'a', e.target.value)}
                  disabled={inputsRangoDisabled}
                  className="w-full text-sm" // El mb-4 del Input lo hace un poco espaciado
                  aria-label={`Hora de fin del turno ${rangoIdx + 1} para ${diaNombre}`}
                  label="" // Label vacío
                />
              </div>
              <Button
                type="button" // Buena práctica para botones que no envían formularios
                variant="ghost"
                onClick={() => handleRemoveRango(rangoIdx)}
                disabled={inputsRangoDisabled || (estado as RangoHorario[]).length <= 0}
                aria-label={`Eliminar turno ${rangoIdx + 1} para ${diaNombre}`}
                // Aplicar clases para tamaño de icono, p.ej. p-1 o p-2 si es necesario, o ajustar padding en el icono mismo
                className="text-red-500 hover:text-red-700 disabled:text-gray-400 p-1 rounded-full" // p-1 para hacerlo más pequeño
              >
                <XCircleIcon className="h-5 w-5" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={handleAddRango}
            disabled={inputsRangoDisabled}
            // Clases para hacerlo más pequeño (sm)
            className="mt-2 text-xs px-2.5 py-1.5"
          >
            <PlusCircleIcon className="h-4 w-4 mr-1" />
            Añadir Turno
          </Button>
        </div>
      )}
    </div>
  );
};

export default EditorDiaHorario;