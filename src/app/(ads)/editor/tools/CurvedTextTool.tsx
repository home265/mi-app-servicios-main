'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful'; // 1. Se importa el nuevo selector
import type { CurvedTextElement } from '../hooks/useEditorStore';
import DeleteElementButton from '../components/ui/DeleteElementButton';
import fontsData from '@/data/fonts.json';
import FontSelector from '../components/ui/FontSelector';
import ToolPanel from '../components/ui/ToolPanel';

// Los tipos y constantes se mantienen sin cambios.
interface FontOption {
  name: string;
  categoria?: string;
  uso?: string;
}
const typedFontsData: FontOption[] = fontsData;

const curvePresets = [
  { id: 'arc-up', name: 'Arco Arriba', path: 'M10,80 Q100,20 190,80' },
  { id: 'arc-down', name: 'Arco Abajo', path: 'M10,40 Q100,100 190,40' },
  { id: 'wave', name: 'Onda Suave', path: 'M10,60 Q60,10 110,60 T190,60' },
  { id: 'circle', name: 'Círculo', path: 'M 50,60 A 50,50 0 1,1 150,60 A 50,50 0 1,1 50,60' },
];

// La interfaz de props no se modifica.
interface CurvedTextToolProps {
  initial?: CurvedTextElement;
  onConfirm: (
    element: Omit<CurvedTextElement, 'id' | 'tipo'> & { tipo: 'textoCurvo' }
  ) => void;
  onClose: () => void;
}

export default function CurvedTextTool({
  initial,
  onConfirm,
  onClose,
}: CurvedTextToolProps) {
  // Toda la lógica de estado original se mantiene intacta.
  const [text, setText] = useState(initial?.text || 'Texto Curvo');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  const [fontFamily, setFontFamily] = useState(
    initial?.fontFamily || (typedFontsData.length > 0 ? typedFontsData[0].name : 'Arial')
  );
  const [fontSizePct, setFontSizePct] = useState(initial?.fontSizePct ?? 8);
  const [curvePath, setCurvePath] = useState(
    initial?.curvePath || curvePresets[0].path
  );

  // La lógica de confirmación no se altera.
  const handleConfirm = () => {
    onConfirm({
      tipo: 'textoCurvo',
      xPct: initial?.xPct ?? 10,
      yPct: initial?.yPct ?? 50,
      widthPct: initial?.widthPct ?? 80,
      heightPct: initial?.heightPct ?? 25,
      text,
      color,
      fontFamily,
      fontSizePct,
      curvePath,
    });
  };

  // El estilo para el input de texto se mantiene.
  const inputClassName = "block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow";

  return (
    // El componente ya usa ToolPanel, lo cual es correcto.
    <ToolPanel
      title={initial ? 'Editar Texto Curvo' : 'Agregar Texto Curvo'}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText={initial ? 'Guardar Cambios' : 'Agregar Texto'}
      isConfirmDisabled={!text.trim()}
    >
      {/* Se ajusta el espaciado para mayor consistencia visual. */}
      <div className="space-y-5">
        {initial?.id && (
          <div className="absolute top-4 right-4">
            <DeleteElementButton
              elementId={initial.id}
              onElementDeleted={onClose}
            />
          </div>
        )}

        {/* El campo de Contenido no se altera. */}
        <div>
          <label htmlFor="curved-text-content" className="block text-sm font-medium text-texto-secundario mb-2">
            Contenido:
          </label>
          <input
            id="curved-text-content"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClassName}
            spellCheck={true}
          />
        </div>
        
        {/* 2. AQUÍ ESTÁ EL CAMBIO: Se reemplaza el input de color. */}
        <div className="flex flex-col items-center gap-3">
            <label className="w-full text-sm font-medium text-texto-secundario">
                Color: <span className="font-mono font-semibold text-texto-principal">{color}</span>
            </label>
            <HexColorPicker
                color={color}
                onChange={setColor}
                className="w-full"
            />
        </div>

        {/* El selector de fuentes no se altera. */}
        <FontSelector
          id="curved-text-font"
          options={typedFontsData}
          value={fontFamily}
          onChange={setFontFamily}
        />

        {/* El selector de tamaño no se altera. */}
        <div>
          <label htmlFor="curved-text-size" className="block text-sm font-medium text-texto-secundario mb-2">
            Tamaño (% del alto): <span className="font-semibold">{fontSizePct}%</span>
          </label>
          <div className="relative h-2 w-full rounded-full bg-fondo shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
            <input
              id="curved-text-size"
              type="range"
              min="2"
              max="25"
              step="0.5"
              value={fontSizePct}
              onChange={(e) => setFontSizePct(Number(e.target.value))}
              className="absolute w-full h-full appearance-none bg-transparent cursor-pointer accent-primario"
            />
          </div>
        </div>

        {/* El selector de forma de curva no se altera. */}
        <div>
          <label className="block text-sm font-medium text-texto-secundario mb-2">
            Forma de la Curva:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {curvePresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setCurvePath(preset.path)}
                title={preset.name}
                className={`h-16 rounded-xl flex items-center justify-center transition-all duration-150 ease-in-out
                  ${curvePath === preset.path
                    ? 'bg-primario/90 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.6)] scale-95'
                    : 'bg-tarjeta shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)] hover:brightness-110 active:scale-95'
                  }`}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 200 120"
                  className={`stroke-current ${curvePath === preset.path ? 'text-fondo' : 'text-texto-principal'}`}
                >
                  <path
                    d={preset.path}
                    strokeWidth="12"
                    fill="transparent"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </ToolPanel>
  );
}