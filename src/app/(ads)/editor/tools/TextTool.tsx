'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful'; // 1. Se importa el nuevo selector
import type { TextElement } from '../hooks/useEditorStore';
import DeleteElementButton from '../components/ui/DeleteElementButton';
import fontsData from '@/data/fonts.json';
import FontSelector from '../components/ui/FontSelector';
import ToolPanel from '../components/ui/ToolPanel';

// Los tipos y datos de las fuentes se mantienen intactos.
interface FontOption {
  name: string;
  categoria?: string;
  uso?: string;
}
const typedFontsData: FontOption[] = fontsData;

// La interfaz de props no se altera.
interface TextToolProps {
  initial?: TextElement;
  onConfirm: (element: Omit<TextElement, 'id' | 'tipo'> & { tipo: 'texto' }) => void;
  onClose: () => void;
}

export default function TextTool({ initial, onConfirm, onClose }: TextToolProps) {
  // Toda la lógica de estado original se mantiene sin cambios.
  const [text, setText] = useState(initial?.text || '');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  const [fontFamily, setFontFamily] = useState(
    initial?.fontFamily || (typedFontsData.length > 0 ? typedFontsData[0].name : 'Arial')
  );
  const [fontSizePct, setFontSizePct] = useState(initial?.fontSizePct ?? 5);

  // La lógica de confirmación original no se modifica.
  const handleConfirm = () => {
    onConfirm({
      tipo: 'texto',
      xPct: initial?.xPct ?? 10,
      yPct: initial?.yPct ?? 10,
      widthPct: initial?.widthPct ?? 80,
      heightPct: initial?.heightPct ?? 15,
      text,
      color,
      fontFamily,
      fontSizePct,
    });
  };

  // El estilo para el input de texto se mantiene.
  const inputClassName = "block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow";

  return (
    // El componente ya usa ToolPanel, lo cual es correcto.
    <ToolPanel
      title={initial ? 'Editar Texto' : 'Agregar Texto'}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText={initial ? 'Guardar Cambios' : 'Agregar Texto'}
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
          <label htmlFor="text-tool-content" className="block text-sm font-medium text-texto-secundario mb-2">
            Contenido:
          </label>
          <input
            id="text-tool-content"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className={inputClassName}
            placeholder="Escribe algo..."
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
          id="text-tool-font"
          options={typedFontsData}
          value={fontFamily}
          onChange={setFontFamily}
        />

        {/* El selector de tamaño no se altera. */}
        <div>
          <label htmlFor="text-tool-size" className="block text-sm font-medium text-texto-secundario mb-2">
            Tamaño (% del alto del canvas): <span className="font-semibold">{fontSizePct}%</span>
          </label>
          <div className="relative h-2 w-full rounded-full bg-fondo shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
            <input
              id="text-tool-size"
              type="range"
              min="1"
              max="25"
              step="0.5"
              value={fontSizePct}
              onChange={(e) => setFontSizePct(Number(e.target.value))}
              className="absolute w-full h-full appearance-none bg-transparent cursor-pointer accent-primario"
            />
          </div>
        </div>
      </div>
    </ToolPanel>
  );
}