'use client';

import React, { useState } from 'react';
import type { ColorBackgroundElement } from '../hooks/useEditorStore';
import { HexColorPicker } from 'react-colorful'; // Se importa el nuevo selector de color
import ToolPanel from '../components/ui/ToolPanel'; // Se importa tu panel para la estética

// La interfaz de props no se modifica, es la misma que proporcionaste.
interface ColorToolProps {
  initial?: Partial<Omit<ColorBackgroundElement, 'id'>>;
  onConfirm: (element: Omit<ColorBackgroundElement, 'id'>) => void;
  onClose: () => void;
}

export default function ColorTool({ initial, onConfirm, onClose }: ColorToolProps) {
  // El estado y su tipo se mantienen exactamente igual.
  const [color, setColor] = useState<string>(initial?.color || '#ffffff');

  // Tu función original `handleConfirm` es correcta y no se altera.
  // Se ejecutará cuando el usuario presione el botón "Aplicar Color".
  const handleConfirm = () => {
    onConfirm({
      tipo: 'fondoColor',
      xPct: initial?.xPct ?? 0,
      yPct: initial?.yPct ?? 0,
      widthPct: initial?.widthPct ?? 100,
      heightPct: initial?.heightPct ?? 100,
      color: color,
    });
    onClose();
  };

  return (
    // 1. Se reemplaza el <div> exterior por tu componente ToolPanel.
    // Esto soluciona el problema del fondo negro y unifica el estilo.
    <ToolPanel
      title="Color de fondo"
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText="Aplicar Color"
    >
      {/* 2. El contenido de la herramienta ahora se renderiza dentro del ToolPanel. */}
      <div className="flex w-full flex-col items-center gap-4 py-2">
        {/*
          3. Aquí se reemplaza el <input> problemático por el HexColorPicker.
          Este componente se muestra dentro del panel y NUNCA tapará los botones.
          El `onChange` actualiza el estado 'color' de forma segura y tipada.
        */}
        <HexColorPicker
          color={color}
          onChange={setColor}
          className="w-full"
        />
        
        {/* Se añade un display para ver el código del color, mejorando la usabilidad. */}
        <div className="mt-2 w-full rounded-lg bg-fondo p-2 text-center shadow-inner">
          <span className="text-sm text-texto-secundario">Color: </span>
          <span className="font-mono font-semibold text-texto-principal">{color}</span>
        </div>
      </div>
    </ToolPanel>
  );
}