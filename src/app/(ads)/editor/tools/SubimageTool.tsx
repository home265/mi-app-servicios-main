'use client';

import React, { useState, useRef } from 'react';
import Button from '@/app/components/ui/Button';
import type { SubimageElement } from '../hooks/useEditorStore';
import Image from 'next/image';
import DeleteElementButton from '../components/ui/DeleteElementButton';
import { UploadCloud } from 'lucide-react';

interface SubimageToolProps {
  initial?: SubimageElement;
  onConfirm: (element: Omit<SubimageElement, 'id' | 'tipo'> & { tipo: 'subimagen' }) => void;
  onClose: () => void;
}

export default function SubimageTool({ initial, onConfirm, onClose }: SubimageToolProps) {
  const [src, setSrc] = useState(initial?.src || '');
  const [widthPct, setWidthPct] = useState(initial?.widthPct ?? 20);
  const [heightPct, setHeightPct] = useState(initial?.heightPct ?? 20);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') setSrc(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!src) {
      alert("Por favor, selecciona una imagen antes de confirmar.");
      return;
    }
    onConfirm({
      tipo: 'subimagen',
      xPct: initial?.xPct ?? 10,
      yPct: initial?.yPct ?? 10,
      widthPct,
      heightPct,
      src,
    });
    onClose();
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
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
            {initial ? 'Editar Subimagen' : 'Agregar Subimagen'}
          </h3>
          {initial?.id && (
            <DeleteElementButton elementId={initial.id} onElementDeleted={onClose} />
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="subimage-file-input"
              className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
            >
              Imagen:
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp, image/gif"
              onChange={handleFileChange}
              className="hidden"
              id="subimage-file-input"
            />
            <Button
              variant="outline"
              onClick={handleUploadButtonClick}
              fullWidth
              className="border-dashed border-[var(--color-borde-input)] hover:border-primario"
            >
              <UploadCloud size={18} className="mr-2 text-[var(--color-texto-secundario)]" />
              {src ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
            </Button>
            {src && (
              <p className="text-xs text-[var(--color-texto-secundario)] mt-1">
                Imagen cargada. Puedes cambiarla seleccionando otra.
              </p>
            )}
          </div>

          {src && (
            <div className="mt-3 mb-3 border border-[var(--color-borde-input)] rounded-md p-2 bg-[var(--color-fondo-sutil)]">
              <p className="text-xs text-[var(--color-texto-secundario)] mb-1 text-center">Vista previa:</p>
              <div className="w-full h-32 sm:h-40 relative rounded overflow-hidden">
                <Image
                  src={src}
                  alt="Preview subimagen"
                  fill
                  style={{ objectFit: 'contain' }}
                  unoptimized={typeof src === 'string' && src.startsWith('data:')}
                />
              </div>
            </div>
          )}

          {src && (
            <>
              <div>
                <label
                  htmlFor="subimage-width"
                  className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
                >
                  Ancho (% del canvas): <span className="font-semibold">{widthPct}%</span>
                </label>
                <input
                  id="subimage-width"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={widthPct}
                  onChange={e => setWidthPct(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primario"
                />
              </div>
              <div>
                <label
                  htmlFor="subimage-height"
                  className="block text-sm font-medium text-[var(--color-texto-secundario)] mb-1"
                >
                  Alto (% del canvas): <span className="font-semibold">{heightPct}%</span>
                </label>
                <input
                  id="subimage-height"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={heightPct}
                  onChange={e => setHeightPct(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primario"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!src}>
            {initial ? 'Guardar Cambios' : 'Agregar Subimagen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
