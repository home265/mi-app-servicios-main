'use client';

import React, { useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import type { GradientBackgroundElement } from '../hooks/useEditorStore';
import ToolPanel from '../components/ui/ToolPanel';
import BotonDeSeleccion from '@/app/components/common/BotonDeSeleccion';

interface GradientBackgroundToolProps {
  initial?: Partial<Omit<GradientBackgroundElement, 'id'>>;
  onConfirm: (element: Omit<GradientBackgroundElement, 'id'>) => void;
  onClose: () => void;
}

const orientationOptions: { id: GradientBackgroundElement['orientation']; label: string }[] = [
    { id: 'horizontal', label: 'Horizontal' },
    { id: 'vertical', label: 'Vertical' },
    { id: 'diagonal', label: 'Diagonal' },
    { id: 'radial', label: 'Radial' },
];

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
  };

  return (
    <ToolPanel
      title="Fondo degradado"
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText="Aplicar Degradado"
    >
      {/* Se ajusta el espaciado para que se vea bien en el contenedor con scroll */}
      <div className="space-y-5">

        {/* Sección para el Color 1 */}
        <div className="flex flex-col items-center gap-3">
          <label className="w-full text-sm text-texto-secundario">
            Color 1: <span className="font-mono font-semibold text-texto-principal">{color1}</span>
          </label>
          <HexColorPicker
            color={color1}
            onChange={setColor1}
            className="w-full"
          />
        </div>

        {/* Sección para el Color 2 */}
        <div className="flex flex-col items-center gap-3">
          <label className="w-full text-sm text-texto-secundario">
            Color 2: <span className="font-mono font-semibold text-texto-principal">{color2}</span>
          </label>
          <HexColorPicker
            color={color2}
            onChange={setColor2}
            className="w-full"
          />
        </div>

        {/* La sección de Orientación se mantiene intacta. */}
        <div>
          <label className="block text-sm mb-2 text-texto-secundario">Orientación:</label>
          <div className="flex flex-col gap-2">
            {orientationOptions.map((option) => (
              <BotonDeSeleccion
                key={option.id}
                label={option.label}
                onClick={() => setOrientation(option.id)}
                isSelected={orientation === option.id}
              />
            ))}
          </div>
        </div>
      </div>
    </ToolPanel>
  );
}