'use client';

import React, { useState, useRef } from 'react'; // useRef añadido
import Button from '@/app/components/ui/Button';
import type { ImageBackgroundElement } from '../hooks/useEditorStore';
import Image from 'next/image';
import { UploadCloud } from 'lucide-react'; // Icono para el botón de subir

interface ImageBackgroundToolProps {
  // Si se edita, 'initial' debería tener el src actual.
  // No se necesita 'id' aquí porque un fondo de imagen es único por pantalla y se reemplaza.
  initial?: Partial<Omit<ImageBackgroundElement, 'id' | 'tipo'>>;
  onConfirm: (elementData: Omit<ImageBackgroundElement, 'id' | 'tipo'> & { tipo: 'fondoImagen' }) => void;
  onClose: () => void;
}

export default function ImageBackgroundTool({ initial, onConfirm, onClose }: ImageBackgroundToolProps) {
  const [src, setSrc] = useState(initial?.src || '');

  // Referencia para el input de archivo oculto
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) { // Límite de 3MB para imágenes de fondo (puedes ajustar)
        alert("La imagen es demasiado grande. El tamaño máximo es 3MB.");
        if (fileInputRef.current) {
          fileInputRef.current.value = ""; // Resetear para permitir nueva selección
        }
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert("Tipo de archivo no permitido. Sube imágenes JPG, PNG, o WEBP.");
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
      alert("Por favor, selecciona una imagen antes de confirmar.");
      return;
    }
    // Los fondos de imagen usualmente cubren toda la pantalla
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

  // Función para simular clic en el input de archivo
  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    // Mantengo tu estilo de panel fijo en la esquina inferior, adaptando los colores.
    <div className="absolute bottom-4 left-4 z-50 bg-[var(--color-tarjeta)] text-[var(--color-texto-principal)] p-4 rounded-lg shadow-lg w-full max-w-xs max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
      <div className="flex justify-between items-center mb-3"> {/* Ajustado mb-3 */}
        <h3 className="text-lg font-semibold"> {/* Título modificado */}
          {initial?.src ? 'Cambiar Imagen de Fondo' : 'Imagen de Fondo'}
        </h3>
        {/* No se añade botón de eliminar aquí, ya que la acción es reemplazar o usar otra herramienta (Color/Gradiente) */}
      </div>

      <div className="space-y-4">
        {/* MEJORA UI: Botón para subir imagen e input de archivo oculto */}
        <div>
          {/* El label puede asociarse con el input oculto para accesibilidad */}
          <label htmlFor="background-image-file-input" className="sr-only">
            Seleccionar imagen de fondo:
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp" // Tipos de archivo comunes
            onChange={handleFileChange}
            className="hidden" // Ocultar el input por defecto
            id="background-image-file-input"
          />
          {/* Botón visible para el usuario */}
          <Button
            variant="outline" // Asumiendo que ya tienes este variant en tu Button.tsx
                               // Si no, cámbialo a "secondary" o "ghost" y ajusta className
            onClick={handleUploadButtonClick}
            fullWidth
            className="border-dashed hover:border-primario text-[var(--color-texto-secundario)]"
          >
            <UploadCloud size={18} className="mr-2" />
            {src ? 'Cambiar Imagen' : 'Seleccionar Imagen'}
          </Button>
        </div>

        {/* Previsualización de la imagen seleccionada */}
        {src && (
          <div className="mt-3 mb-3 border border-[var(--color-borde-input)] rounded-md p-2 bg-[var(--color-fondo-sutil)]">
            <p className="text-xs text-[var(--color-texto-secundario)] mb-1 text-center">Vista previa actual:</p>
            <div className="w-full h-32 sm:h-24 relative rounded overflow-hidden"> {/* Altura de preview ajustada */}
              <Image
                src={src}
                alt="Preview imagen de fondo"
                fill
                className="object-cover" // Para fondo, 'cover' suele ser lo deseado para llenar el espacio
                unoptimized={typeof src === 'string' && src.startsWith('data:')}
              />
            </div>
          </div>
        )}
        {/* Para ImageBackground, no hay controles de widthPct/heightPct ya que usualmente es 100% */}
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
