'use client';

import React, { useState, useRef } from 'react';
import Button from '@/app/components/ui/Button';
import type { ImageBackgroundElement } from '../hooks/useEditorStore';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast'; // 1. Importar toast

interface ImageBackgroundToolProps {
  initial?: Partial<Omit<ImageBackgroundElement, 'id' | 'tipo'>>;
  onConfirm: (elementData: Omit<ImageBackgroundElement, 'id' | 'tipo'> & { tipo: 'fondoImagen' }) => void;
  onClose: () => void;
}

export default function ImageBackgroundTool({ initial, onConfirm, onClose }: ImageBackgroundToolProps) {
  const [src, setSrc] = useState(initial?.src || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        // 2. Reemplazar alert con toast.error
        toast.error("La imagen es demasiado grande. El tamaño máximo es 3MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        // 3. Reemplazar alert con toast.error
        toast.error("Tipo de archivo no permitido. Sube imágenes JPG, PNG, o WEBP.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setSrc(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (!src) {
      // 4. Reemplazar alert con toast.error
      toast.error("Por favor, selecciona una imagen antes de confirmar.");
      return;
    }
    onConfirm({
      tipo: 'fondoImagen',
      xPct: 0,
      yPct: 0,
      widthPct: 100,
      heightPct: 100,
      src,
    });
    onClose();
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-[var(--color-tarjeta)] text-[var(--color-texto-principal)] p-4 rounded-lg shadow-lg w-full max-w-xs max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold">
          {initial?.src ? 'Cambiar Imagen de Fondo' : 'Imagen de Fondo'}
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="background-image-file-input" className="sr-only">
            Seleccionar imagen de fondo:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="background-image-file-input"
          />
          <Button
            variant="outline"
            onClick={handleUploadButtonClick}
            fullWidth
            className="border-dashed hover:border-primario text-[var(--color-texto-secundario)]"
          >
            <UploadCloud size={18} className="mr-2" />
            {src ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
          </Button>
        </div>

        {src && (
          <div className="mt-3 mb-3 border border-[var(--color-borde-input)] rounded-md p-2 bg-[var(--color-fondo-sutil)]">
            <p className="text-xs text-[var(--color-texto-secundario)] mb-1 text-center">Vista previa actual:</p>
            <div className="w-full h-32 sm:h-24 relative rounded overflow-hidden">
              <Image
                src={src}
                alt="Preview imagen de fondo"
                fill
                className="object-cover"
                unoptimized={typeof src === 'string' && src.startsWith('data:')}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleConfirm} disabled={!src}>
          {initial?.src ? 'Aplicar Cambios' : 'Establecer Fondo'}
        </Button>
      </div>
    </div>
  );
}