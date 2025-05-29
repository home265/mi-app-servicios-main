'use client';

import React, { useRef, useState, useEffect as ReactUseEffect, useCallback } from 'react';
import {
  Type,
  Italic, 
  Droplet, 
  Palette, 
  ImageIcon, 
  Layers, 
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  LogOut, // Icono para "Salir del Editor"
  Settings, // Icono para "Configuración del Anuncio" / "Cambiar Plan/Campaña"
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

// Interfaz de Props ACTUALIZADA
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
  // --- NUEVAS PROPS PARA CAMBIAR PLAN/CAMPAÑA ---
  onChangePlanCampania?: () => void; // Función a llamar
  showChangePlanCampaniaButton?: boolean; // Para controlar visibilidad
  // --- FIN NUEVAS PROPS ---
}

const SCROLL_AMOUNT = 150; 

const tools: { id: ToolId; label: string; icon: React.ElementType }[] = [
  { id: 'text', label: 'Texto', icon: Type },
  { id: 'curvedText', label: 'Texto Curvo', icon: Italic },
  { id: 'color', label: 'Color Fondo', icon: Palette },
  { id: 'gradient', label: 'Degradado', icon: Droplet },
  { id: 'imageBackground', label: 'Imagen Fondo', icon: ImageIcon },
  { id: 'subimage', label: 'Sub-Imagen', icon: Layers }, 
  { id: 'effects', label: 'Efectos', icon: Layers }, 
];


export default function Toolbar({
  activeTool,
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
  onChangePlanCampania, // Nueva prop
  showChangePlanCampaniaButton = false, // Nueva prop, default a false
}: ToolbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (element) {
      setCanScrollLeft(element.scrollLeft > 0);
      setCanScrollRight(element.scrollLeft < element.scrollWidth - element.clientWidth - 1);
    }
  }, []);

  // ReactUseEffect es el useEffect original renombrado para la lógica de scroll existente.
  ReactUseEffect(() => {
    const element = scrollRef.current;
    if (element) {
      updateScrollState(); 
      element.addEventListener('scroll', updateScrollState);
      window.addEventListener('resize', updateScrollState); 
      return () => {
        element.removeEventListener('scroll', updateScrollState);
        window.removeEventListener('resize', updateScrollState);
      };
    }
  }, [updateScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
        behavior: 'smooth',
      });
    }
  };

  const handleToolSelect = (toolId: ToolId | null) => {
    if (disabled || !onSelectTool) return;
    onSelectTool(toolId);
  };

  const NextButtonIcon = isLastScreen ? CheckCircle : ArrowRight;
  const nextButtonText = isLastScreen ? 'Finalizar' : 'Siguiente';

  const handleNextOrFinalizeClick = () => {
    if (disabled) return;
    if (isLastScreen && onPreview) {
      onPreview(); 
    } else if (!isLastScreen && onNext) {
      onNext(); 
    }
  };


  return (
    <div className="h-[var(--toolbar-height,60px)] bg-[var(--color-fondo-toolbar)] text-[var(--color-texto-toolbar)] shadow-md px-2 sm:px-4 flex items-center justify-between select-none z-30 shrink-0">
      
      <div className="flex items-center"> {/* Contenedor para botones izquierdos */}
        {/* Botón: Salir del Editor (ya añadido) */}
        {showExitEditorButton && (
          <button
            onClick={() => { if (!disabled && onExitEditor) onExitEditor(); }}
            className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mr-2 sm:mr-3"
            aria-label="Salir del Editor"
            title="Salir del Editor"
            disabled={disabled}
          >
            <LogOut size={20} />
          </button>
        )}

        {/* --- NUEVO BOTÓN: Cambiar Plan/Campaña --- */}
        {showChangePlanCampaniaButton && (
          <button
            onClick={() => { if (!disabled && onChangePlanCampania) onChangePlanCampania(); }}
            className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 mr-2 sm:mr-3"
            aria-label="Configuración del Anuncio"
            title="Cambiar Plan/Campaña"
            disabled={disabled}
          >
            <Settings size={20} />
          </button>
        )}
        {/* --- FIN NUEVO BOTÓN --- */}
      </div>


      {/* Sección Central: Controles de scroll y herramientas */}
      <div className="flex-grow flex items-center overflow-hidden relative mx-2"> {/* Añadido mx-2 para dar espacio */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--color-fondo-toolbar)] hover:bg-opacity-80 rounded-full shadow-md opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Scroll herramientas izquierda"
            disabled={disabled}
          >
            <ChevronLeft size={20} className="text-[var(--color-texto-principal)]" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto scrollbar-hide py-2 px-1 mx-auto"
        >
          {tools.map(tool => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              disabled={disabled || (activeTool === tool.id && tool.id !== 'effects')}
              className={`p-2 sm:px-3 sm:py-2 rounded-md flex items-center space-x-2 whitespace-nowrap
                           transition-all duration-150 ease-in-out
                           ${activeTool === tool.id && tool.id !== 'effects'
                             ? 'bg-primario text-white shadow-lg scale-105'
                             : 'bg-[var(--color-fondo-sutil)] text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] hover:shadow-md'}
                           disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:transform-none`}
              title={tool.label}
              aria-pressed={activeTool === tool.id}
            >
              <tool.icon size={18} className="shrink-0" />
              <span className="text-xs sm:text-sm hidden sm:inline">{tool.label}</span>
            </button>
          ))}
        </div>

        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-[var(--color-fondo-toolbar)] hover:bg-opacity-80 rounded-full shadow-md opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Scroll herramientas derecha"
            disabled={disabled}
          >
            <ChevronRight size={20} className="text-[var(--color-texto-principal)]" />
          </button>
        )}
      </div>


      {/* Sección Derecha: Navegación de Pantallas y Finalizar */}
      <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
          <div className="hidden md:flex items-center justify-center px-1 sm:px-2">
            {totalScreens > 0 && (
              <span className="text-xs sm:text-sm text-[var(--color-texto-secundario)] select-none whitespace-nowrap">
                Pantalla {currentScreen} de {totalScreens}
              </span>
            )}
          </div>

          <button
            onClick={() => { if (!disabled) onPrev?.(); }}
            className="p-2 rounded text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
            aria-label="Pantalla anterior"
            title="Pantalla anterior"
            disabled={disabled || currentScreen <= 1}
          >
            <ArrowLeft size={20} />
          </button>

          <button
            onClick={handleNextOrFinalizeClick}
            className={`p-2 rounded text-white flex items-center space-x-1 sm:space-x-2 min-w-[90px] sm:min-w-[100px] justify-center transition-opacity
                        ${isLastScreen ? 'bg-green-500 hover:bg-green-600' : 'bg-primario hover:bg-opacity-80'}
                        disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={nextButtonText}
            title={nextButtonText}
            disabled={disabled || (isLastScreen && !onPreview) || (!isLastScreen && !onNext)}
          >
            <span className="text-xs sm:text-sm">{nextButtonText}</span>
            <NextButtonIcon size={18} className="shrink-0"/>
          </button>
      </div>

    </div>
  );
}