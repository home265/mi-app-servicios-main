'use client';

import React, { useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  LogOut,
  Settings,
} from 'lucide-react';

// Tipos de herramientas existentes
export type ToolId =
  | 'text'
  | 'curvedText'
  | 'color'
  | 'gradient'
  | 'imageBackground'
  | 'subimage'
  | 'effects';

// Interfaz de Props
export interface ToolbarProps {
  activeTool: ToolId | null;
  onSelectTool?: (tool: ToolId | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPreview?: () => void; // Botón de Finalizar/Siguiente
  isLastScreen?: boolean;
  currentScreen?: number;
  totalScreens?: number;
  disabled?: boolean;
  // Props para Salir del Editor
  onExitEditor?: () => void;
  showExitEditorButton?: boolean;
  // Prop para Cambiar Plan/Campaña
  onChangePlanCampania?: () => void;
  showChangePlanCampaniaButton?: boolean;
}

export default function Toolbar({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  activeTool,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelectTool,
  onPrev,
  onNext,
  onPreview,
  isLastScreen = false,
  currentScreen = 1,
  totalScreens = 1,
  disabled = false,
  onExitEditor,
  showExitEditorButton = false,
  onChangePlanCampania,
  showChangePlanCampaniaButton = false,
}: ToolbarProps) {
  const NextButtonIcon = isLastScreen ? CheckCircle : ArrowRight;
  const nextButtonText = isLastScreen ? 'Finalizar' : 'Siguiente';

  const handleNextOrFinalizeClick = useCallback(() => {
    if (disabled) return;
    if (isLastScreen && onPreview) {
      onPreview();
    } else if (!isLastScreen && onNext) {
      onNext();
    }
  }, [disabled, isLastScreen, onNext, onPreview]);

  return (
    <div className="h-[var(--toolbar-height,60px)] bg-[var(--color-fondo-toolbar)] text-[var(--color-texto-toolbar)] shadow-md px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Sección Izquierda: Salir y Cambiar Plan/Campaña */}
      <div className="flex items-center space-x-3">
        {showExitEditorButton && (
          <button
            onClick={() => {
              if (!disabled && onExitEditor) onExitEditor();
            }}
            className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-label="Salir del Editor"
            title="Salir del Editor"
            disabled={disabled}
          >
            <LogOut size={20} />
          </button>
        )}

        {showChangePlanCampaniaButton && (
          <button
            onClick={() => {
              if (!disabled && onChangePlanCampania) onChangePlanCampania();
            }}
            className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-label="Configuración del Anuncio"
            title="Cambiar Plan/Campaña"
            disabled={disabled}
          >
            <Settings size={20} />
          </button>
        )}
      </div>

      {/* Sección Derecha: Navegación de Pantallas y Finalizar */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center justify-center px-2">
          {totalScreens > 0 && (
            <span className="text-sm text-[var(--color-texto-secundario)] select-none whitespace-nowrap">
              Pantalla {currentScreen} de {totalScreens}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (!disabled) onPrev?.();
          }}
          className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
          aria-label="Pantalla anterior"
          title="Pantalla anterior"
          disabled={disabled || currentScreen <= 1}
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={handleNextOrFinalizeClick}
          className={`p-2 rounded text-white flex items-center space-x-1 min-w-[90px] justify-center transition-opacity ${
            isLastScreen ? 'bg-green-500 hover:bg-green-600' : 'bg-primario hover:bg-opacity-80'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={nextButtonText}
          title={nextButtonText}
          disabled={disabled || (isLastScreen && !onPreview) || (!isLastScreen && !onNext)}
        >
          <span className="text-sm">{nextButtonText}</span>
          <NextButtonIcon size={18} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}
