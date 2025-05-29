// src/app/(ads)/editor/tools/AdvancedEffectsTool.tsx
'use client';

import React, { useState, useEffect } from 'react';
// Se elimina la importación de Image de 'next/image' ya que no se usará
import { useEditorStore, type EditorElement } from '../hooks/useEditorStore'; // Ajusta la ruta si es necesario
import type { ReelAnimationEffectType } from '@/types/anuncio'; // Ajusta la ruta si es necesario
import Button from '@/app/components/ui/Button'; // Ajusta la ruta si es necesario
import MiniCanvasPreview from '../components/previews/MiniCanvasPreview'; // Ajusta la ruta si es necesario

interface AdvancedEffectsToolProps {
  elementsForPreview: EditorElement[];
  baseCanvasWidth: number;
  baseCanvasHeight: number;
  onClose: () => void;
}

const animationEffectOptions: { id: ReelAnimationEffectType; label: string; /* previewUrl ya no es necesario aquí */ }[] = [
  { id: 'none', label: 'Sin Efecto' },
  { id: 'fadeIn', label: 'Aparecer' },
  { id: 'zoomIn', label: 'Zoom In' },
  { id: 'slideInFromLeft', label: 'Deslizar (Izq)' },
  { id: 'pulse', label: 'Latido' },
];

const PREVIEW_WIDTH = 224; // Ancho en píxeles para la MiniCanvasPreview

export default function AdvancedEffectsTool({
  elementsForPreview,
  baseCanvasWidth,
  baseCanvasHeight,
  onClose,
}: AdvancedEffectsToolProps) {
  const setAnimationEffectForCurrentScreen = useEditorStore(state => state.setAnimationEffectForCurrentScreen);
  const currentScreenIndex = useEditorStore(state => state.currentScreenIndex);
  const animationEffectsByScreen = useEditorStore(state => state.animationEffectsByScreen);

  const initiallySelectedEffect = animationEffectsByScreen[currentScreenIndex];
  const [hoveredEffect, setHoveredEffect] = useState<ReelAnimationEffectType | null | undefined>(null);
  const effectToDisplayInPreview = hoveredEffect !== null ? hoveredEffect : (initiallySelectedEffect || 'none');

  const handleSelectEffect = (effectId: ReelAnimationEffectType) => {
    setAnimationEffectForCurrentScreen(effectId);
    onClose();
  };

  useEffect(() => {
    setHoveredEffect(null);
  }, [initiallySelectedEffect]);

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white p-4 rounded-lg shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-center mb-2">
        Aplicar Efecto de Animación
      </h2>

      <div className="flex flex-col md:flex-row gap-4 flex-grow overflow-hidden">
        <div className="md:w-1/2 pr-2 overflow-y-auto max-h-[50vh] md:max-h-full custom-scrollbar">
          <div className="grid grid-cols-2 gap-3">
            {animationEffectOptions.map(option => (
              <button
                key={option.id}
                onMouseEnter={() => setHoveredEffect(option.id)}
                onMouseLeave={() => setHoveredEffect(null)}
                onClick={() => handleSelectEffect(option.id)}
                // Clases para el botón: ajusta h- (altura) y p- (padding) según necesites
                className={`flex flex-col items-center justify-center p-3 border-2 rounded-md hover:border-primario-hover transition-colors duration-150 h-20 
                            ${(effectToDisplayInPreview === option.id && hoveredEffect === option.id) || (initiallySelectedEffect === option.id && hoveredEffect === null)
                              ? 'border-primario bg-primario/30'
                              : 'border-gray-600 bg-gray-700 hover:bg-gray-600'}`}
                title={option.label}
              >
                {/* Ya NO se muestra la imagen/GIF aquí */}
                <span className="text-sm text-center block w-full">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:w-1/2 flex flex-col items-center justify-center p-2 bg-gray-900 rounded">
          <p className="text-xs text-gray-400 mb-2">Previsualización del efecto:</p>
          {baseCanvasWidth > 0 && baseCanvasHeight > 0 ? (
            <MiniCanvasPreview
              elements={elementsForPreview}
              baseWidth={baseCanvasWidth}
              baseHeight={baseCanvasHeight}
              previewWidth={PREVIEW_WIDTH}
              applyingEffect={effectToDisplayInPreview}
              backgroundColor="#000"
            />
          ) : (
            <div style={{width: PREVIEW_WIDTH, height: (PREVIEW_WIDTH * 9/16) }} // Altura fallback si no hay baseHeight/Width
                 className="flex items-center justify-center bg-black text-gray-500 text-xs">
              Cargando preview...
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto pt-3 flex justify-end border-t border-gray-700">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}