// src/app/(ads)/editor/tools/AdvancedEffectsTool.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore, type EditorElement } from '../hooks/useEditorStore';
import type { ReelAnimationEffectType } from '@/types/anuncio';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button';
import MiniCanvasPreview from '../components/previews/MiniCanvasPreview';
import { X } from 'lucide-react'; // Se importa el ícono 'X'

// Dimensiones base del panel para el cálculo de la escala
const NATURAL_CONTENT_WIDTH = 440; // en píxeles
const PREVIEW_WIDTH_IN_PANEL = 200; // Ancho para la preview dentro del panel

interface AdvancedEffectsToolProps {
  elementsForPreview: EditorElement[];
  baseCanvasWidth: number;
  baseCanvasHeight: number;
  onClose: () => void;
}

const animationEffectOptions: {
  id: ReelAnimationEffectType;
  label: string;
}[] = [
  { id: 'none', label: 'Sin Efecto' },
  { id: 'fadeIn', label: 'Aparecer' },
  { id: 'zoomIn', label: 'Zoom In' },
  { id: 'slideInFromLeft', label: 'Deslizar (Izq)' },
  { id: 'pulse', label: 'Latido' },
];

export default function AdvancedEffectsTool({
  elementsForPreview,
  baseCanvasWidth,
  baseCanvasHeight,
  onClose,
}: AdvancedEffectsToolProps) {
  const setAnimationEffectForCurrentScreen = useEditorStore(
    (state) => state.setAnimationEffectForCurrentScreen
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentScreenIndex = useEditorStore((state) => state.currentScreenIndex);
  const currentSelectedEffect =
    useEditorStore(
      (state) => state.animationEffectsByScreen[state.currentScreenIndex]
    ) || 'none';

  // --- Lógica de escala del panel original (se mantiene) ---
  const panelWrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const wrapper = panelWrapperRef.current;
    if (!wrapper) return;
    const observer = new ResizeObserver(() => {
      const availableWidth = wrapper.offsetWidth;
      if (availableWidth < NATURAL_CONTENT_WIDTH) {
        setScale(availableWidth / NATURAL_CONTENT_WIDTH);
      } else {
        setScale(1);
      }
    });
    observer.observe(wrapper);
    const availableWidth = wrapper.offsetWidth;
    if (availableWidth < NATURAL_CONTENT_WIDTH) {
      setScale(availableWidth / NATURAL_CONTENT_WIDTH);
    }
    return () => observer.disconnect();
  }, []);

  const handleSelectEffect = (effectId: ReelAnimationEffectType) => {
    setAnimationEffectForCurrentScreen(effectId);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center pointer-events-none">
      <div
        ref={panelWrapperRef}
        className="w-[calc(100%-1rem)] max-w-[440px] pointer-events-auto"
      >
        <div
          style={{ transform: `scale(${scale})`, transformOrigin: 'bottom center' }}
        >
          <div className="bg-gray-800 text-white p-4 rounded-lg shadow-2xl flex flex-col gap-4">
            {/* --- MODIFICACIÓN CLAVE AQUÍ --- */}
            {/* Se reemplaza el <h2> por un div que contiene el título y el nuevo botón de cerrar */}
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-lg font-semibold">
                Aplicar Efecto de Animación
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
                aria-label="Cerrar"
                title="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Columna 1 - Preview */}
              <div className="flex flex-col items-center justify-center p-2 bg-gray-900 rounded-md">
                <p className="text-xs text-gray-400 mb-2">Previsualización:</p>
                {baseCanvasWidth > 0 && baseCanvasHeight > 0 ? (
                  <MiniCanvasPreview
                    elements={elementsForPreview}
                    baseWidth={baseCanvasWidth}
                    baseHeight={baseCanvasHeight}
                    previewWidth={PREVIEW_WIDTH_IN_PANEL}
                    applyingEffect={currentSelectedEffect}
                    backgroundColor="#000"
                  />
                ) : (
                  <div
                    style={{ width: PREVIEW_WIDTH_IN_PANEL }}
                    className="aspect-[9/16] bg-black"
                  />
                )}
              </div>

              {/* Columna 2 - Botones */}
              <div className="grid grid-cols-2 gap-3 content-start">
                {animationEffectOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectEffect(option.id)}
                    className={`flex items-center justify-center p-3 border-2 rounded-md h-20 transition-colors ${
                      currentSelectedEffect === option.id
                        ? 'border-primario bg-primario/30'
                        : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                    }`}
                    title={option.label}
                  >
                    <span className="text-sm text-center">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* --- SE ELIMINA EL ANTIGUO BOTÓN "CERRAR" DE AQUÍ --- */}
            {/* <div className="mt-auto pt-3 flex justify-end border-t border-gray-700">
                <Button variant="secondary" onClick={onClose}>Cerrar</Button>
              </div> 
            */}
          </div>
        </div>
      </div>
    </div>
  );
}