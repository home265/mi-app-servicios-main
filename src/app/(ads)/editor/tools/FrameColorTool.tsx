'use client';

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../hooks/useEditorStore';
import type { EditorElement, ImageBackgroundElement } from '../hooks/useEditorStore';
import { X } from 'lucide-react';

/**
 * Props para el componente FrameColorTool.
 * @interface FrameColorToolProps
 * @property {ImageBackgroundElement} element - El elemento de fondo de imagen que se está editando.
 * @property {() => void} onClose - Función para cerrar la herramienta.
 */
interface FrameColorToolProps {
  element: ImageBackgroundElement;
  onClose: () => void;
}

/**
 * Una mini-herramienta contextual que aparece como un pequeño panel para
 * cambiar el color del marco de un elemento `ImageBackgroundElement`.
 */
export default function FrameColorTool({ element, onClose }: FrameColorToolProps) {
  const updateElement = useEditorStore((state) => state.updateElement);
  const [color, setColor] = useState<string>(element.frameColor || '#000000');

  useEffect(() => {
    if (element.frameColor !== color) {
      // =================================================================
      // === INICIO DE LA CORRECCIÓN =====================================
      // =================================================================
      // El error original ocurría aquí. La función `updateElement` espera un
      // objeto genérico que podría actualizar cualquier tipo de elemento.
      // Al pasarle una propiedad específica como `frameColor`, TypeScript
      // nos advierte.
      // Con `as Partial<EditorElement>`, le decimos explícitamente a TypeScript:
      // "Confía en nosotros, sabemos que este objeto es una actualización válida
      // para un miembro de la unión EditorElement".
      updateElement(element.id, { frameColor: color } as Partial<EditorElement>);
      // ===============================================================
      // === FIN DE LA CORRECCIÓN ========================================
      // ===============================================================
    }
  }, [color, element.id, element.frameColor, updateElement]);

  /**
   * Manejador que se activa cuando el valor del input de color cambia.
   * @param {React.ChangeEvent<HTMLInputElement>} e - El evento del cambio.
   */
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setColor(e.target.value);
  };

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <div className="bg-[var(--color-tarjeta)] text-[var(--color-texto-principal)] p-4 rounded-lg shadow-2xl w-full max-w-xs animate-fade-in-up">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-base font-semibold">Color del Marco</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-[var(--color-texto-secundario)]">
            Elige un color para rellenar los bordes de tu imagen.
          </p>
          <input
            type="color"
            value={color}
            onChange={handleColorChange}
            className="w-full h-10 p-0.5 rounded-md border border-[var(--color-borde-input)] bg-[var(--color-input)] cursor-pointer"
            aria-label="Selector de color del marco"
          />
        </div>
      </div>
    </div>
  );
}
