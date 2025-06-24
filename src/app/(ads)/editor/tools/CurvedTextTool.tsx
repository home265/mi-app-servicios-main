'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { CurvedTextElement } from '../hooks/useEditorStore';
import DeleteElementButton from '../components/ui/DeleteElementButton';
import fontsData from '@/data/fonts.json';

// Tipo para los objetos de fuente
interface FontOption {
  name: string;
  categoria?: string;
  uso?: string;
}
const typedFontsData: FontOption[] = fontsData;

// --- LISTA DE CURVAS MODIFICADA ---
// Se ha reemplazado "Inclinado Arriba" por "Círculo"
const curvePresets = [
  { id: 'arc-up', name: 'Arco Arriba', path: 'M10,80 Q100,20 190,80' },
  { id: 'arc-down', name: 'Arco Abajo', path: 'M10,40 Q100,100 190,40' },
  { id: 'wave', name: 'Onda Suave', path: 'M10,60 Q60,10 110,60 T190,60' },
  // La siguiente línea es la que ha sido reemplazada
  { id: 'circle', name: 'Círculo', path: 'M 50,60 A 50,50 0 1,1 150,60 A 50,50 0 1,1 50,60' },
];

interface CurvedTextToolProps {
  initial?: CurvedTextElement;
  onConfirm: (element: Omit<CurvedTextElement, 'id' | 'tipo'> & { tipo: 'textoCurvo' }) => void;
  onClose: () => void;
}

export default function CurvedTextTool({ initial, onConfirm, onClose }: CurvedTextToolProps) {
  const [text, setText] = useState(initial?.text || 'Texto Curvo');
  const [color, setColor] = useState(initial?.color || '#ffffff');
  const [fontFamily, setFontFamily] = useState(
    initial?.fontFamily || (typedFontsData.length > 0 ? typedFontsData[0].name : 'Arial')
  );
  const [fontSizePct, setFontSizePct] = useState(initial?.fontSizePct ?? 8);
  const [curvePath, setCurvePath] = useState(initial?.curvePath || curvePresets[0].path);

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
    onConfirm(curvedTextData);
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
            {initial ? 'Editar Texto Curvo' : 'Agregar Texto Curvo'}
          </h3>
          {initial?.id && (
            <DeleteElementButton
              elementId={initial.id}
              onElementDeleted={onClose}
            />
          )}
        </div>

        <div className="space-y-4">
          {/* Controles de Texto, Color, Fuente y Tamaño (sin cambios) */}
          <div>
            <label htmlFor="curved-text-content" className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1">Contenido:</label>
            <input
              id="curved-text-content"
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full p-2 rounded-md bg-[var(--color-input)] border border-[var(--color-borde-input)] focus:ring-primario focus:border-primario placeholder-[var(--color-texto-secundario)] opacity-80"
              spellCheck={true}
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

          {/* Botones visuales con la nueva opción "Círculo" */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-2">
              Forma de la Curva:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {curvePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setCurvePath(preset.path)}
                  title={preset.name} // Tooltip para accesibilidad
                  // =================================================================
                  // === INICIO DEL CAMBIO: CLASES DE CSS ACTUALIZADAS ================
                  // =================================================================
                  className={`h-16 border-2 rounded-md transition-all duration-200 flex items-center justify-center focus:outline-none ${
                    curvePath === preset.path
                      ? 'border-primario bg-primario/30 ring-2 ring-offset-2 ring-primario ring-offset-[var(--color-tarjeta)]'
                      : 'border-transparent bg-[var(--color-input)] hover:border-gray-500'
                  }`}
                  // ===============================================================
                  // === FIN DEL CAMBIO ==============================================
                  // ===============================================================
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 200 120" // Un canvas SVG interno consistente para todas las curvas
                    className="stroke-current text-[var(--color-texto-principal)]"
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
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!text.trim()}>
            {initial ? 'Guardar Cambios' : 'Agregar Texto Curvo'}
          </Button>
        </div>
      </div>
    </div>
  );

}