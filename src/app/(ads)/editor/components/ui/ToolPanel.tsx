'use client';

import React from 'react';

// --- Definimos las Props que aceptará nuestro panel ---
interface ToolPanelProps {
  /** El título que se mostrará en el encabezado del panel. */
  title: string;
  /** Los controles específicos de la herramienta (ej: inputs, sliders). */
  children: React.ReactNode;
  /** Función que se ejecuta al presionar el botón de confirmación. */
  onConfirm: () => void;
  /** Función que se ejecuta al presionar el botón de cancelar o al hacer clic fuera del panel. */
  onClose: () => void;
  /** Texto opcional para el botón de confirmación (por defecto es "Confirmar"). */
  confirmText?: string;
  /** Booleano opcional para deshabilitar el botón de confirmación. */
  isConfirmDisabled?: boolean;
}

export default function ToolPanel({
  title,
  children,
  onConfirm,
  onClose,
  confirmText = 'Confirmar',
  isConfirmDisabled = false,
}: ToolPanelProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 anim-fadeIn"
      onClick={onClose}
    >
      {/* TARJETA 3D / GLASS - MODIFICADA */}
      <div
        className="bg-tarjeta/80 backdrop-blur-lg border border-white/10 text-texto-principal rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)] w-full max-w-sm anim-zoomIn flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado (ahora con su propio padding) */}
        <h2 className="text-lg font-semibold p-5 pb-3 border-b border-borde-tarjeta shrink-0">
          {title}
        </h2>
        
        {/* Área de contenido con scroll y su propio padding */}
        <div className="overflow-y-auto p-5">
          {children}
        </div>
        
        {/* Botones de acción (ahora con su propio padding) */}
        <div className="flex justify-end gap-3 p-5 pt-4 border-t border-borde-tarjeta shrink-0">
          <button
            onClick={onClose}
            className="
              inline-flex items-center justify-center
              px-4 py-2 rounded-xl text-sm font-medium text-texto-secundario
              bg-tarjeta
              shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
              transition-all duration-150 ease-in-out
              hover:text-primario hover:brightness-110
              active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            "
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm} 
            disabled={isConfirmDisabled}
            className="btn-primary"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}