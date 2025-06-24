'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { TextElement } from '../hooks/useEditorStore';
import DeleteElementButton from '../components/ui/DeleteElementButton';

// PASO 1: Importar los datos de las fuentes
import fontsData from '@/data/fonts.json';

// (Opcional pero recomendado) Definir un tipo para los objetos de fuente
interface FontOption {
  name: string;
  categoria?: string;
  uso?: string;
}
const typedFontsData: FontOption[] = fontsData;

interface TextToolProps {
  initial?: TextElement;
  onConfirm: (element: Omit<TextElement, 'id' | 'tipo'> & { tipo: 'texto' }) => void;
  onClose: () => void;
}

export default function TextTool({ initial, onConfirm, onClose }: TextToolProps) {
  const [text, setText] = useState(initial?.text || '');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  // PASO 2: Actualizar el valor inicial de fontFamily para usar una fuente de tu JSON
  const [fontFamily, setFontFamily] = useState(
    initial?.fontFamily || (typedFontsData.length > 0 ? typedFontsData[0].name : 'Arial')
  );
  const [fontSizePct, setFontSizePct] = useState(initial?.fontSizePct ?? 5);

  const handleConfirm = () => {
    onConfirm({
      tipo: 'texto',
      xPct: initial?.xPct ?? 10,
      yPct: initial?.yPct ?? 10,
      // --- LÍNEAS MODIFICADAS ---
      widthPct: initial?.widthPct ?? 80,    // Valor anterior era 30
      heightPct: initial?.heightPct ?? 15,    // Valor anterior era 10
      // --------------------------
      text,
      color,
      fontFamily,
      fontSizePct,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[var(--color-tarjeta)] p-5 rounded-lg shadow-xl w-full max-w-sm text-[var(--color-texto-principal)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {initial ? 'Editar Texto' : 'Agregar Texto'}
          </h3>
          {initial?.id && (
            <DeleteElementButton
              elementId={initial.id}
              onElementDeleted={onClose}
            />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="text-tool-content"
              className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
            >
              Contenido:
            </label>
            <input
              id="text-tool-content"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] focus:ring-primario focus:border-primario placeholder-[var(--color-texto-secundario)] opacity-80"
              placeholder="Escribe algo..."
              spellCheck={true}
            />
          </div>
          <div>
            <label
              htmlFor="text-tool-color"
              className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
            >
              Color:
            </label>
            <input
              id="text-tool-color"
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-full h-10 p-0.5 rounded-md border border-[var(--color-borde-input)] bg-[var(--color-input)] cursor-pointer"
            />
          </div>
          <div>
            <label
              htmlFor="text-tool-font"
              className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
            >
              Fuente:
            </label>
            <select
              id="text-tool-font"
              value={fontFamily}
              onChange={e => setFontFamily(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] focus:ring-primario focus:border-primario"
            >
              {typedFontsData.map(font => (
                <option
                  key={font.name}
                  value={font.name}
                  style={{ fontFamily: font.name, fontSize: '1rem' }}
                >
                  {font.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="text-tool-size"
              className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
            >
              Tamaño (% del alto del canvas):{' '}
              <span className="font-semibold">{fontSizePct}%</span>
            </label>
            <input
              id="text-tool-size"
              type="range"
              min="1"
              max="25"
              step="0.5"
              value={fontSizePct}
              onChange={e => setFontSizePct(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primario"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            {initial ? 'Guardar Cambios' : 'Agregar Texto'}
          </Button>
        </div>
      </div>
    </div>
  );
}
