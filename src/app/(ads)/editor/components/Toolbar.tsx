// src/app/(ads)/editor/components/Toolbar.tsx
'use client';

import React, { useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    <div className="h-[var(--toolbar-height,60px)] bg-tarjeta text-texto-principal shadow-lg px-2 md:px-4 flex items-center justify-between select-none z-30 shrink-0">
      
      {/* Sección Izquierda: Salir y Ayuda */}
      <div className="flex items-center gap-2">
        {showExitEditorButton && (
          <button
            onClick={() => {
              if (!disabled && onExitEditor) onExitEditor();
            }}
            disabled={disabled}
            aria-label="Salir del Editor"
            title="Salir del Editor"
            className="
              inline-flex items-center justify-center
              px-3 py-2 rounded-xl text-sm font-medium text-texto-secundario
              bg-tarjeta
              shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
              transition-all duration-150 ease-in-out
              hover:text-primario hover:brightness-110
              active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
              disabled:opacity-60 disabled:cursor-not-allowed
            "
          >
            <span className="hidden sm:inline">{exitButtonText}</span>
            <span className="sm:hidden">Salir</span>
          </button>
        )}

        {showChangePlanCampaniaButton && (
          <BotonAyuda>
            <AyudaCrearEditarAnuncio fase="fase2" />
          </BotonAyuda>
        )}
      </div>

      {/* Sección Derecha: Navegación y Finalizar */}
      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center justify-center px-2">
          {totalScreens > 0 && (
            <span className="text-sm text-texto-secundario select-none whitespace-nowrap">
              Pantalla {currentScreen} de {totalScreens}
            </span>
          )}
        </div>

        <button
          onClick={() => {
            if (!disabled) onPrev?.();
          }}
          disabled={disabled || currentScreen <= 1}
          aria-label="Pantalla anterior"
          title="Pantalla anterior"
          className="
            flex items-center justify-center w-10 h-10 rounded-full
            bg-tarjeta text-texto-secundario
            shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
            transition-all duration-150 ease-in-out
            hover:text-primario hover:brightness-110
            active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]
            disabled:opacity-60 disabled:cursor-not-allowed
          "
        >
          <ArrowLeft size={20} />
        </button>

        <button
          onClick={handleNextOrFinalizeClick}
          disabled={
            disabled ||
            (isLastScreen && !onPreview) ||
            (!isLastScreen && !onNext)
          }
          aria-label={finalNextButtonText}
          title={finalNextButtonText}
          className={`
            inline-flex items-center justify-center gap-2
            px-4 py-2 rounded-xl text-sm font-semibold text-fondo
            transition-all duration-150 ease-in-out
            shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
            hover:brightness-110 active:scale-95
            min-w-[120px] md:min-w-[150px]
            disabled:opacity-60 disabled:cursor-not-allowed
            ${isLastScreen
              ? 'bg-green-500' // Color verde para finalizar
              : 'bg-primario'   // Color primario para continuar
            }
          `}
        >
          <span>{finalNextButtonText}</span>
          <NextButtonIcon size={18} className="shrink-0" />
        </button>
      </div>
    </div>
  );
}