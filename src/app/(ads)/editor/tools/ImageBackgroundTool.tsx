'use client';

import React, { useState, useRef } from 'react';
import type { ImageBackgroundElement } from '../hooks/useEditorStore';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ToolPanel from '../components/ui/ToolPanel'; // 1. IMPORTAMOS EL COMPONENTE BASE

interface ImageBackgroundToolProps {
  initial?: Partial<Omit<ImageBackgroundElement, 'id' | 'tipo'>>;
  onConfirm: (elementData: Omit<ImageBackgroundElement, 'id' | 'tipo'> & { tipo: 'fondoImagen' }) => void;
  onClose: () => void;
}

export default function ImageBackgroundTool({ initial, onConfirm, onClose }: ImageBackgroundToolProps) {
  const [src, setSrc] = useState(initial?.src || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Lógica de Manejo de Archivos (sin cambios) ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error("La imagen es demasiado grande. El tamaño máximo es 3MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
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

  // --- Lógica de Confirmación (sin cambios) ---
  const handleConfirm = () => {
    if (!src) {
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
  };

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    // 2. Usamos ToolPanel como el contenedor principal.
    <ToolPanel
      title={initial?.src ? 'Cambiar Imagen de Fondo' : 'Imagen de Fondo'}
      onConfirm={handleConfirm}
      onClose={onClose}
      confirmText={initial?.src ? 'Aplicar Cambios' : 'Establecer Fondo'}
      isConfirmDisabled={!src}
    >
      {/* 3. Dentro, solo ponemos los controles específicos de esta herramienta. */}
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
          {/* Botón de subida con estilo 3D secundario */}
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
          <div className="p-2 bg-fondo rounded-lg border border-borde-tarjeta">
            <p className="text-xs text-texto-secundario mb-1 text-center">Vista previa actual:</p>
            <div className="w-full aspect-[9/16] relative rounded overflow-hidden">
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
    </ToolPanel>
  );
}