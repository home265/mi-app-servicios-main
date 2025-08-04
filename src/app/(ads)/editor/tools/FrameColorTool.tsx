'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import type { EditorElement, ImageBackgroundElement } from '../hooks/useEditorStore';
import ToolPanel from '../components/ui/ToolPanel'; // 1. IMPORTAMOS EL COMPONENTE BASE

interface FrameColorToolProps {
  element: ImageBackgroundElement;
  onClose: () => void;
}

export default function FrameColorTool({ element, onClose }: FrameColorToolProps) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const [color, setColor] = useState<string>(element.frameColor || '#000000');

  // La lógica del useEffect se mantiene intacta.
  useEffect(() => {
    if (element.frameColor !== color) {
      updateElement(element.id, { frameColor: color } as Partial<EditorElement>);
    }
  }, [color, element.id, element.frameColor, updateElement]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  // La función onConfirm aquí simplemente cierra el panel, ya que el color se actualiza en tiempo real.
  const handleConfirm = () => {
    onClose();
  };

  return (
    // Se envuelve en un div con posicionamiento para que aparezca en la esquina.
    <div className="absolute bottom-4 left-4 z-50">
      <ToolPanel
        title="Color del Marco"
        onConfirm={handleConfirm}
        onClose={onClose}
        confirmText="Aceptar" // Cambiamos el texto para que sea más adecuado.
      >
        <div className="space-y-2">
          <p className="text-xs text-texto-secundario">
            Elige un color para rellenar los bordes de tu imagen.
          </p>
          <div className="relative w-full h-10 rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] overflow-hidden">
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="absolute -top-2 -left-2 w-[calc(100%+1rem)] h-[calc(100%+1rem)] p-0 border-0 cursor-pointer"
              aria-label="Selector de color del marco"
            />
          </div>
        </div>
      </ToolPanel>
    </div>
  );
}