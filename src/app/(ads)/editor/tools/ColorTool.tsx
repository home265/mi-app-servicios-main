'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { ColorBackgroundElement } from '../hooks/useEditorStore';

interface ColorToolProps {
  initial?: Partial<Omit<ColorBackgroundElement, 'id'>>;
  onConfirm: (element: Omit<ColorBackgroundElement, 'id'>) => void;
  onClose: () => void;
}

export default function ColorTool({ initial, onConfirm, onClose }: ColorToolProps) {
  const [color, setColor] = useState(initial?.color || '#ffffff');

  const handleConfirm = () => {
    onConfirm({
      tipo: 'fondoColor',
      xPct: initial?.xPct ?? 0,
      yPct: initial?.yPct ?? 0,
      widthPct: initial?.widthPct ?? 100,
      heightPct: initial?.heightPct ?? 100,
      color,
    });
    onClose();
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-black text-white p-4 rounded-lg shadow-lg w-full max-w-xs max-h-[80vh] overflow-auto">
      <h2 className="text-lg font-semibold mb-2">Color de fondo</h2>
      <div className="mb-4">
        <label className="block text-sm mb-1">Seleccionar color:</label>
        <input
          type="color"
          value={color}
          onChange={e => setColor(e.target.value)}
          className="w-full h-10 p-0 border-0 bg-black"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
      </div>
    </div>
  );
}
