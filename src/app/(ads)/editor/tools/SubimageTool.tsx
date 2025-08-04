'use client';

import React, { useState, useRef } from 'react';
import type { SubimageElement } from '../hooks/useEditorStore';
import Image from 'next/image';
import DeleteElementButton from '../components/ui/DeleteElementButton';
import { UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ToolPanel from '../components/ui/ToolPanel'; // 1. IMPORTAMOS EL COMPONENTE BASE

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

  // --- Lógica de Manejo de Archivos y Confirmación (sin cambios) ---
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
      toast.error("Por favor, selecciona una imagen antes de confirmar.");
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
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    // 2. Usamos ToolPanel como el contenedor principal.
    <ToolPanel
      title={initial ? 'Editar Subimagen' : 'Agregar Subimagen'}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText={initial ? 'Guardar Cambios' : 'Agregar Subimagen'}
      isConfirmDisabled={!src}
    >
      {/* 3. Dentro, solo ponemos los controles específicos de esta herramienta. */}
      <div className="space-y-4">
        {initial?.id && (
            <div className="absolute top-4 right-4">
                <DeleteElementButton elementId={initial.id} onElementDeleted={onClose} />
            </div>
        )}

        <div>
          <label htmlFor="subimage-file-input" className="block text-sm font-medium text-texto-secundario mb-2">
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
          <button
            type="button"
            onClick={handleUploadButtonClick}
            className="
              w-full inline-flex items-center justify-center
              px-4 py-3 rounded-xl text-sm font-medium text-texto-secundario
              bg-tarjeta border border-dashed border-borde-tarjeta
              shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
              transition-all duration-150 ease-in-out
              hover:text-primario hover:border-primario
              active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            "
          >
            <UploadCloud size={18} className="mr-2" />
            {src ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
          </button>
        </div>

        {src && (
          <>
            <div className="p-2 bg-fondo rounded-lg border border-borde-tarjeta">
              <p className="text-xs text-texto-secundario mb-1 text-center">Vista previa:</p>
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

            <div>
              <label htmlFor="subimage-width" className="block text-sm font-medium text-texto-secundario mb-2">
                Ancho (% del canvas): <span className="font-semibold">{widthPct}%</span>
              </label>
              <div className="relative h-2 w-full rounded-full bg-fondo shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
                <input
                  id="subimage-width"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={widthPct}
                  onChange={e => setWidthPct(Number(e.target.value))}
                  className="absolute w-full h-full appearance-none bg-transparent cursor-pointer accent-primario"
                />
              </div>
            </div>
            <div>
              <label htmlFor="subimage-height" className="block text-sm font-medium text-texto-secundario mb-2">
                Alto (% del canvas): <span className="font-semibold">{heightPct}%</span>
              </label>
              <div className="relative h-2 w-full rounded-full bg-fondo shadow-[inset_1px_1px_3px_rgba(0,0,0,0.6)]">
                <input
                  id="subimage-height"
                  type="range"
                  min={5}
                  max={100}
                  step={1}
                  value={heightPct}
                  onChange={e => setHeightPct(Number(e.target.value))}
                  className="absolute w-full h-full appearance-none bg-transparent cursor-pointer accent-primario"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </ToolPanel>
  );
}