// src/app/(ads)/editor/components/Toolbar.tsx
'use client';

import React, { useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  LogOut,
} from 'lucide-react';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarAnuncio from '@/app/components/ayuda-contenido/AyudaCrearEditarAnuncio';

export type ToolId =
  | 'text'
  | 'curvedText'
  | 'color'
  | 'gradient'
  | 'imageBackground'
  | 'subimage'
  | 'effects';

export interface ToolbarProps {
  activeTool: ToolId | null;
  onSelectTool?: (tool: ToolId | null) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onPreview?: () => void;
  isLastScreen?: boolean;
  currentScreen?: number;
  totalScreens?: number;
  disabled?: boolean;
  onExitEditor?: () => void;
  showExitEditorButton?: boolean;
  onChangePlanCampania?: () => void;
  showChangePlanCampaniaButton?: boolean;
  nextButtonText?: string;
  exitButtonText?: string;
  changePlanButtonText?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChangePlanCampania,
  showChangePlanCampaniaButton = false,
  nextButtonText = 'Siguiente',
  exitButtonText,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  changePlanButtonText,
}: ToolbarProps) {
  const NextButtonIcon = isLastScreen ? CheckCircle : ArrowRight;
  const finalNextButtonText = isLastScreen ? 'Finalizar' : nextButtonText;

  const handleNextOrFinalizeClick = useCallback(() => {
    if (disabled) return;
    if (isLastScreen && onPreview) {
      onPreview();
    } else if (!isLastScreen && onNext) {
      onNext();
    }
  }, [disabled, isLastScreen, onNext, onPreview]);

  return (
    <div className="h-[var(--toolbar-height,60px)] bg-[var(--color-fondo-toolbar)] text-[var(--color-texto-toolbar)] shadow-md px-2 md:px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Sección Izquierda: Salir y Ayuda */}
      <div className="flex items-center space-x-2">
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
            {exitButtonText ? (
              <span className="text-sm font-semibold px-1 whitespace-nowrap">
                <span className="hidden sm:inline">{exitButtonText}</span>
                <span className="sm:hidden">Salir</span>
              </span>
            ) : (
              <LogOut size={20} />
            )}
          </button>
        )}

        {/* --- CORRECCIÓN APLICADA: Se vuelve a añadir la condición --- */}
        {showChangePlanCampaniaButton && (
          <BotonAyuda>
            <AyudaCrearEditarAnuncio fase="fase2" />
          </BotonAyuda>
        )}
      </div>

      {/* Sección Derecha: Navegación de Pantallas y Finalizar */}
      <div className="flex items-center space-x-2 md:space-x-3">
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
          className={`px-3 py-2 rounded text-white flex items-center space-x-2 justify-center transition-opacity min-w-[120px] md:min-w-[150px] ${
            isLastScreen
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-primario hover:bg-opacity-80'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={finalNextButtonText}
          title={finalNextButtonText}
          disabled={
            disabled ||
            (isLastScreen && !onPreview) ||
            (!isLastScreen && !onNext)
          }
        >
          <span className="text-sm font-semibold">{finalNextButtonText}</span>
          <NextButtonIcon size={18} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}