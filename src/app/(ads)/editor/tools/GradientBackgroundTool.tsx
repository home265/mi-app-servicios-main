// src/app/(ads)/editor/tools/GradientBackgroundTool.tsx
'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import type { GradientBackgroundElement } from '../hooks/useEditorStore';

interface GradientBackgroundToolProps {
  initial?: Partial<Omit<GradientBackgroundElement, 'id'>>;
  onConfirm: (element: Omit<GradientBackgroundElement, 'id'>) => void;
  onClose: () => void;
}

export default function GradientBackgroundTool({ initial, onConfirm, onClose }: GradientBackgroundToolProps) {
  const [color1, setColor1] = useState<string>(initial?.color1 ?? '#ffffff');
  const [color2, setColor2] = useState<string>(initial?.color2 ?? '#000000');
  const [orientation, setOrientation] = useState<GradientBackgroundElement['orientation']>(
    initial?.orientation ?? 'horizontal'
  );

  const handleConfirm = () => {
    onConfirm({
      tipo: 'gradient',
      xPct: initial?.xPct ?? 0,
      yPct: initial?.yPct ?? 0,
      widthPct: initial?.widthPct ?? 100,
      heightPct: initial?.heightPct ?? 100,
      color1,
      color2,
      orientation,
    });
    onClose();
  };

  return (
    <div className="absolute bottom-4 left-4 bg-black text-white p-4 rounded-lg shadow-lg w-full max-w-xs max-h-[80vh] overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Fondo degradado</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">Color 1:</label>
          <input
            type="color"
            value={color1}
            onChange={e => setColor1(e.target.value)}
            className="w-full h-10 p-0 border-0 bg-black"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Color 2:</label>
          <input
            type="color"
            value={color2}
            onChange={e => setColor2(e.target.value)}
            className="w-full h-10 p-0 border-0 bg-black"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Orientación:</label>
          <select
            value={orientation}
            onChange={e => setOrientation(e.target.value as GradientBackgroundElement['orientation'])}
            className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
            <option value="diagonal">Diagonal</option>
            <option value="radial">Radial</option>
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm}>Confirmar</Button>
      </div>
    </div>
  );
}
