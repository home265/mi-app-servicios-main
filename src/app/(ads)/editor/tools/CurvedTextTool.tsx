'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { CurvedTextElement } from '../hooks/useEditorStore';
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

interface CurvedTextToolProps {
  initial?: CurvedTextElement;
  onConfirm: (element: Omit<CurvedTextElement, 'id' | 'tipo'> & { tipo: 'textoCurvo' }) => void;
  onClose: () => void;
}

export default function CurvedTextTool({ initial, onConfirm, onClose }: CurvedTextToolProps) {
  const [text, setText] = useState(initial?.text || 'Texto Curvo');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  // PASO 2: Actualizar el valor inicial de fontFamily para usar una fuente de tu JSON
  const [fontFamily, setFontFamily] = useState(
    initial?.fontFamily || (typedFontsData.length > 0 ? typedFontsData[0].name : 'Arial')
  );
  const [fontSizePct, setFontSizePct] = useState(initial?.fontSizePct ?? 8);
  const [curvePath, setCurvePath] = useState(initial?.curvePath || 'M10,70 Q90,10 190,70');

  const handleConfirm = () => {
    const curvedTextData = {
      tipo: 'textoCurvo' as const,
      xPct: initial?.xPct ?? 10,
      yPct: initial?.yPct ?? 50,
      widthPct: initial?.widthPct ?? 80,
      heightPct: initial?.heightPct ?? 25,
      text,
      color,
      fontFamily,
      fontSizePct,
      curvePath,
    };
    console.log("[CurvedTextTool.tsx] Datos enviados a onConfirm:", JSON.parse(JSON.stringify(curvedTextData)));
    onConfirm(curvedTextData);
    onClose();
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-[var(--color-tarjeta)] text-[var(--color-texto-principal)] p-4 rounded-lg shadow-lg w-full max-w-xs max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {initial ? 'Editar Texto Curvo' : 'Agregar Texto Curvo'}
        </h3>
        {initial?.id && (
          <DeleteElementButton
            elementId={initial.id}
            onElementDeleted={onClose}
          />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="curved-text-content" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">Contenido:</label>
          <input
            id="curved-text-content"
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] focus:ring-primario focus:border-primario placeholder-[var(--color-texto-secundario)] opacity-80"
          />
        </div>
        <div>
          <label htmlFor="curved-text-color" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">Color:</label>
          <input
            id="curved-text-color"
            type="color"
            value={color}
            onChange={e => setColor(e.target.value)}
            className="w-full h-10 p-0.5 rounded-md border border-[var(--color-borde-input)] bg-[var(--color-input)] cursor-pointer"
          />
        </div>
        <div>
          <label htmlFor="curved-text-font" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">Fuente:</label>
          <select
            id="curved-text-font"
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
          <label htmlFor="curved-text-size" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">
            Tamaño (relativo %): <span className="font-semibold">{fontSizePct}%</span>
          </label>
          <input
            id="curved-text-size"
            type="range"
            min="2"
            max="25"
            step="0.5"
            value={fontSizePct}
            onChange={e => setFontSizePct(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primario"
          />
        </div>
        <div>
          <label htmlFor="curved-text-path" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">Path de curva (SVG):</label>
          <textarea
            id="curved-text-path"
            value={curvePath}
            onChange={e => setCurvePath(e.target.value)}
            placeholder="Ej: M10,70 Q90,10 190,70"
            className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] text-sm resize-none focus:ring-primario focus:border-primario placeholder-[var(--color-texto-secundario)] opacity-80"
            rows={3}
          />
          <p className="text-xs text-[var(--color-texto-secundario)] opacity-80 mt-1">
            Ej: <code className="text-[var(--color-texto-principal)] opacity-90 bg-black/20 px-1 rounded">M10,70 Q90,10 190,70</code>
          </p>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!text.trim() || !curvePath.trim()}>
          {initial ? 'Guardar Cambios' : 'Agregar Texto Curvo'}
        </Button>
      </div>
    </div>
  );
}
