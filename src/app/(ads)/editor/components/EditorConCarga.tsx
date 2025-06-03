// src/app/(ads)/editor/components/EditorConCarga.tsx
'use client';

import React, {
  useEffect as ReactUseEffect,
  useState,
  useRef,
  useMemo,
  useCallback
} from 'react';
import Konva from 'konva';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import {
  useEditorStore,
  type EditorElement,
  type AnuncioDataToLoad,
  type TextElement,
  type CurvedTextElement,
  type ColorBackgroundElement,
  type ImageBackgroundElement,
  type SubimageElement,
  type GradientBackgroundElement,
} from '../hooks/useEditorStore';
import {
  updateAnuncio as updateAnuncioService,
  getCapturaByScreenIndex,
  addCaptura,
  updateCaptura as updateCapturaService,
  deleteAnuncio,
} from '@/lib/services/anunciosService';
import {
  uploadFileAndGetURL,
  deleteFileByUrl
} from '@/lib/firebase/storage';
import type { Elemento, ReelAnimationEffectType, Anuncio, Captura } from '@/types/anuncio';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useUserStore } from '@/store/userStore';
import { useAnuncioStore } from '@/store/anuncioStore';
import { planes, campanias } from '@/lib/constants/anuncios';

import EditorCanvas from './EditorCanvas';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Toolbar, { type ToolId } from './Toolbar';
import Button from '@/app/components/ui/Button';

const TextTool = dynamic(() => import('../tools/TextTool'), { ssr: false });
const CurvedTextTool = dynamic(() => import('../tools/CurvedTextTool'), { ssr: false });
const ColorTool = dynamic(() => import('../tools/ColorTool'), { ssr: false });
const ImageBackgroundTool = dynamic(() => import('../tools/ImageBackgroundTool'), { ssr: false });
const SubimageTool = dynamic(() => import('../tools/SubimageTool'), { ssr: false });
const GradientBackgroundTool = dynamic(() => import('../tools/GradientBackgroundTool'), { ssr: false });
const AdvancedEffectsToolDynamic = dynamic(
  () => import('../tools/AdvancedEffectsTool'),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
        <p className="text-white p-4 bg-gray-800 rounded-md">
          Cargando herramienta de efectos...
        </p>
      </div>
    ),
  }
);

async function dataURLtoBlob(dataurl: string): Promise<Blob> {
  const response = await fetch(dataurl);
  if (!response.ok) {
    throw new Error(`Error al obtener el blob desde dataURL: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  if (!blob) {
    throw new Error("fetch devolvió una respuesta ok pero el blob es nulo o indefinido.");
  }
  return blob;
}

interface EditorConCargaProps {
  anuncioParaCargar: {
    id: string;
    maxScreens: number;
    elementosPorPantalla: Record<string, Elemento[]>;
    animationEffectsPorPantalla?: Record<string, ReelAnimationEffectType | undefined>;
    status: Anuncio['status'];
    startDate?: Date;
    endDate?: Date;
    plan: Anuncio['plan'];
    campaniaId?: Anuncio['campaniaId'];
    provincia: string;
    localidad: string;
  };
}

const EMPTY_ARRAY_EDITOR_ELEMENTS: EditorElement[] = [];

export default function EditorConCarga({ anuncioParaCargar }: EditorConCargaProps) {
  const router = useRouter();

  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isProcessingExit, setIsProcessingExit] = useState<boolean>(false);

  const {
    loadAnuncioData,
    resetEditor: resetEditorStore,
    addElement,
    updateElement,
    setSelectedElementForEdit,
    nextScreen,
    prevScreen,
  } = useEditorStore.getState();

  const currentScreenIndex = useEditorStore(state => state.currentScreenIndex);
  const screensCount = useEditorStore(state => state.screensCount);
  const selectedElementId = useEditorStore(state => state.selectedElementIdForEdit);
  const elementsByScreenFromStore = useEditorStore(state => state.elementsByScreen);
  const animationEffectsByScreenFromStore = useEditorStore(state => state.animationEffectsByScreen);
  const durationsByScreenFromStore = useEditorStore(state => state.durationsByScreen);

  const elementsOfCurrentScreen = useMemo(() => {
    return elementsByScreenFromStore[currentScreenIndex] || EMPTY_ARRAY_EDITOR_ELEMENTS;
  }, [elementsByScreenFromStore, currentScreenIndex]);

  const resetAnuncioConfigStore = useAnuncioStore(state => state.reset);

  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [showGuardarModal, setShowGuardarModal] = useState(false);
  const [frozenCanvasDimensions, setFrozenCanvasDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);

  ReactUseEffect(() => {
    resetEditorStore();
    const dataToLoad: AnuncioDataToLoad = {
      screensCount: anuncioParaCargar.maxScreens,
      elementsByScreenFromDb: anuncioParaCargar.elementosPorPantalla,
      animationEffectsFromDb: anuncioParaCargar.animationEffectsPorPantalla,
    };
    loadAnuncioData(dataToLoad);
    setIsEditorInitialized(true);
  }, [anuncioParaCargar, resetEditorStore, loadAnuncioData]);

  ReactUseEffect(() => {
    if (selectedElementId) {
      const elementToEdit = elementsOfCurrentScreen.find(el => el.id === selectedElementId);
      if (elementToEdit) {
        let toolToOpen: ToolId | null = null;
        switch (elementToEdit.tipo) {
          case 'texto': toolToOpen = 'text'; break;
          case 'textoCurvo': toolToOpen = 'curvedText'; break;
          case 'fondoColor': toolToOpen = 'color'; break;
          case 'fondoImagen': toolToOpen = 'imageBackground'; break;
          case 'subimagen': toolToOpen = 'subimage'; break;
          case 'gradient': toolToOpen = 'gradient'; break;
        }
        if (toolToOpen && activeTool !== toolToOpen) {
          setActiveTool(toolToOpen);
        } else if (!toolToOpen && selectedElementId !== null) {
          setSelectedElementForEdit(null);
        }
      } else if (selectedElementId !== null) {
        setSelectedElementForEdit(null);
        if (activeTool !== null) setActiveTool(null);
      }
    } else {
      if (activeTool !== null && activeTool !== 'effects') {
        setActiveTool(null);
      }
    }
  }, [selectedElementId, elementsOfCurrentScreen, setSelectedElementForEdit, activeTool]);

  ReactUseEffect(() => {
    let animationFrameId: number;
    const updateDimensions = () => {
      const stageNode = stageRef.current;
      if (stageNode && stageNode.width() > 0 && stageNode.height() > 0) {
        setFrozenCanvasDimensions(prevDims => {
          if (!prevDims || prevDims.width !== stageNode.width() || prevDims.height !== stageNode.height()) {
            return { width: stageNode.width(), height: stageNode.height() };
          }
          return prevDims;
        });
      } else {
        setFrozenCanvasDimensions(prevDims => (prevDims === null ? null : null));
      }
    };
    if (activeTool === 'effects') {
      updateDimensions();
      animationFrameId = requestAnimationFrame(updateDimensions);
    } else {
      setFrozenCanvasDimensions(null);
    }
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [activeTool, stageRef]);

  const handleSelectTool = useCallback((tool: ToolId | null) => {
    if (tool !== activeTool && selectedElementId) {
      setSelectedElementForEdit(null);
    }
    setActiveTool(prev => (prev === tool && tool !== 'effects' ? null : tool));
  }, [activeTool, selectedElementId, setSelectedElementForEdit]);

  const handleCloseTool = useCallback(() => {
    setActiveTool(null);
    if (selectedElementId) {
      setSelectedElementForEdit(null);
    }
  }, [selectedElementId, setSelectedElementForEdit]);

  const handleConfirmEditOrAddElement = useCallback((elementData: Omit<EditorElement, 'id' | 'tipo'> & { tipo: EditorElement['tipo'] }) => {
    if (selectedElementId) {
      const { tipo, ...propsToUpdate } = elementData;
      updateElement(selectedElementId, propsToUpdate);
    } else {
      addElement(elementData as Omit<EditorElement, 'id'>);
    }
    handleCloseTool();
  }, [selectedElementId, updateElement, addElement, handleCloseTool]);

  const handleSaveAnuncio = useCallback(async () => {
    setIsLoadingSave(true);
    setShowGuardarModal(false);

    if (activeTool) setActiveTool(null);
    if (selectedElementId) setSelectedElementForEdit(null);

    if (!stageRef.current) {
      alert("Error: Referencia al canvas no encontrada.");
      setIsLoadingSave(false);
      return;
    }

    const anuncioId = anuncioParaCargar.id;
    const planSeleccionado = planes.find(p => p.id === anuncioParaCargar.plan);
    const campaniaSeleccionada = anuncioParaCargar.campaniaId
      ? campanias.find(c => c.id === anuncioParaCargar.campaniaId)
      : undefined;

    if (!planSeleccionado) {
      alert("Error: Datos del plan no encontrados para este anuncio.");
      setIsLoadingSave(false);
      return;
    }
    const campaignDurationDays = campaniaSeleccionada
      ? campaniaSeleccionada.months * 30
      : anuncioParaCargar.maxScreens * (planSeleccionado.durationSeconds / anuncioParaCargar.maxScreens);

    let newStorageImageUrl = '';
    let oldImageUrlToDelete: string | null | undefined = null;

    try {
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 });
      const imageBlob = await dataURLtoBlob(dataUrl);
      const imagePath = `capturas_anuncios/${anuncioId}/screen_${currentScreenIndex}_${Date.now()}.jpg`;

      newStorageImageUrl = await uploadFileAndGetURL(imageBlob, imagePath);
      const animationEffectForScreen = animationEffectsByScreenFromStore[currentScreenIndex];
      const storeDurationForScreen = durationsByScreenFromStore[currentScreenIndex];
      let durationSecondsCalc: number;
      let totalExposureCalc: number;

      if (typeof storeDurationForScreen === 'number' && storeDurationForScreen > 0) {
        durationSecondsCalc = storeDurationForScreen;
        totalExposureCalc = screensCount * storeDurationForScreen;
      } else {
        totalExposureCalc = planSeleccionado.durationSeconds;
        durationSecondsCalc = screensCount > 0 ? totalExposureCalc / screensCount : totalExposureCalc;
      }

      const capturaDataPayload: Omit<Captura, 'createdAt' | 'screenIndex'> & { screenIndex: number } = {
        imageUrl: newStorageImageUrl,
        screenIndex: currentScreenIndex,
        plan: anuncioParaCargar.plan,
        campaignDurationDays: campaignDurationDays,
        provincia: anuncioParaCargar.provincia,
        localidad: anuncioParaCargar.localidad,
        animationEffect: animationEffectForScreen,
        durationSeconds: durationSecondsCalc,
        totalExposure: totalExposureCalc,
      };

      const existingCapturaInfo = await getCapturaByScreenIndex(anuncioId, currentScreenIndex);

      if (existingCapturaInfo) {
        oldImageUrlToDelete = existingCapturaInfo.data.imageUrl;
        const { screenIndex: _idx, ...dataToUpdate } = capturaDataPayload;
        await updateCapturaService(anuncioId, existingCapturaInfo.id, dataToUpdate);
        if (oldImageUrlToDelete && oldImageUrlToDelete !== newStorageImageUrl) {
          deleteFileByUrl(oldImageUrlToDelete).catch(err =>
            console.error(`EditorConCarga: Error ASÍNCRONO borrando imagen antigua ${oldImageUrlToDelete}:`, err)
          );
        }
      } else {
        await addCaptura(anuncioId, capturaDataPayload);
      }

      const todasLasPantallasDelStore = elementsByScreenFromStore;
      const elementosParaGuardarEnAnuncio: Record<string, Elemento[]> = {};
      for (let i = 0; i < screensCount; i++) {
        const screenEditorElements = todasLasPantallasDelStore[i] || [];
        elementosParaGuardarEnAnuncio[String(i)] = screenEditorElements.map(editorEl => {
          const { id: _id, ...restOfElemento } = editorEl;
          return restOfElemento as Elemento;
        });
      }

      await updateAnuncioService(anuncioId, {
        elementosPorPantalla: elementosParaGuardarEnAnuncio,
      });

      alert('Pantalla guardada con éxito.');
    } catch (error) {
      console.error('Error al procesar y guardar la captura o el anuncio:', error);
      alert(`Error al guardar: ${(error instanceof Error) ? error.message : 'Error desconocido.'}`);
      if (newStorageImageUrl) {
        deleteFileByUrl(newStorageImageUrl).catch(delErr =>
          console.error('Error adicional borrando imagen nueva tras fallo:', delErr)
        );
      }
    } finally {
      setIsLoadingSave(false);
    }
  }, [
    activeTool,
    selectedElementId,
    setSelectedElementForEdit,
    anuncioParaCargar,
    currentScreenIndex,
    animationEffectsByScreenFromStore,
    durationsByScreenFromStore,
    elementsByScreenFromStore,
    screensCount
  ]);

  const handlePreviewAnuncio = useCallback(() => {
    if (anuncioParaCargar && anuncioParaCargar.id) {
      router.push(`/preview/${anuncioParaCargar.id}`);
    } else {
      console.error("Error: No se pudo obtener el ID del anuncio para la previsualización.");
      alert("Error al intentar previsualizar: ID del anuncio no encontrado.");
    }
  }, [anuncioParaCargar, router]);

  const handleOpenExitModal = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleChangePlanCampania = useCallback(() => {
    if (anuncioParaCargar.status === 'draft') {
      const confirmChange = window.confirm(
        "Serás redirigido para cambiar el plan/campaña de tu borrador. ¿Estás seguro? Los cambios no guardados en la pantalla actual podrían perderse."
      );
      if (confirmChange) {
        router.push(`/planes?borradorId=${anuncioParaCargar.id}`);
      }
    } else {
      alert("Solo puedes cambiar el plan/campaña de anuncios en estado 'borrador'.");
    }
  }, [router, anuncioParaCargar]);

  const handleConfirmExitAction = useCallback(async (action: 'saveAndExit' | 'deleteAndExit') => {
    const anuncioId = anuncioParaCargar.id;

    setIsProcessingExit(true);
    setShowExitModal(false);

    if (action === 'saveAndExit') {
      try {
        await handleSaveAnuncio();
        console.log(`EditorConCarga: Borrador ${anuncioId} guardado antes de salir.`);
        router.push('/mis-anuncios');
      } catch (error) {
        console.error("Error al guardar el borrador antes de salir:", error);
      } finally {
        setIsProcessingExit(false);
      }
    } else if (action === 'deleteAndExit') {
      if (anuncioParaCargar.status !== 'draft') {
        alert("Solo se pueden eliminar anuncios en estado 'borrador' desde esta opción.");
        setIsProcessingExit(false);
        return;
      }
      const confirmDelete = window.confirm(
        "¡Atención! Estás a punto de eliminar este borrador de forma permanente. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?"
      );
      if (confirmDelete) {
        try {
          await deleteAnuncio(anuncioId);
          console.log(`EditorConCarga: Borrador ${anuncioId} eliminado.`);
          resetAnuncioConfigStore();
          resetEditorStore();
          router.push('/mis-anuncios');
        } catch (error) {
          console.error("Error al eliminar el borrador:", error);
          alert(`No se pudo eliminar el borrador: ${(error instanceof Error) ? error.message : "Error desconocido"}`);
        } finally {
          setIsProcessingExit(false);
        }
      } else {
        setIsProcessingExit(false);
      }
    }
  }, [anuncioParaCargar, handleSaveAnuncio, router, resetAnuncioConfigStore, resetEditorStore]);

  if (!isEditorInitialized || !anuncioParaCargar) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
        <p className="ml-4 text-lg">Cargando editor...</p>
      </div>
    );
  }

  const renderActiveTool = () => {
    const elementToEdit = selectedElementId
      ? elementsOfCurrentScreen.find(el => el.id === selectedElementId)
      : undefined;

    if (!activeTool && !selectedElementId) return null;
    if (!activeTool && selectedElementId) return null;

    switch (activeTool) {
      case 'text':
        return (
          <TextTool
            key={selectedElementId || 'edit-text'}
            initial={elementToEdit?.tipo === 'texto' ? elementToEdit as TextElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'curvedText':
        return (
          <CurvedTextTool
            key={selectedElementId || 'edit-curvedtext'}
            initial={elementToEdit?.tipo === 'textoCurvo' ? elementToEdit as CurvedTextElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'color':
        return (
          <ColorTool
            key={selectedElementId || 'edit-color'}
            initial={elementToEdit?.tipo === 'fondoColor' ? elementToEdit as ColorBackgroundElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'imageBackground':
        return (
          <ImageBackgroundTool
            key={selectedElementId || 'edit-imagebg'}
            initial={elementToEdit?.tipo === 'fondoImagen' ? elementToEdit as ImageBackgroundElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'gradient':
        return (
          <GradientBackgroundTool
            key={selectedElementId || 'edit-gradient'}
            initial={elementToEdit?.tipo === 'gradient' ? elementToEdit as GradientBackgroundElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'subimage':
        return (
          <SubimageTool
            key={selectedElementId || 'edit-subimage'}
            initial={elementToEdit?.tipo === 'subimagen' ? elementToEdit as SubimageElement : undefined}
            onConfirm={handleConfirmEditOrAddElement}
            onClose={handleCloseTool}
          />
        );
      case 'effects': {
        if (frozenCanvasDimensions && frozenCanvasDimensions.width > 0 && frozenCanvasDimensions.height > 0) {
          return (
            <AdvancedEffectsToolDynamic
              elementsForPreview={elementsOfCurrentScreen}
              baseCanvasWidth={frozenCanvasDimensions.width}
              baseCanvasHeight={frozenCanvasDimensions.height}
              onClose={handleCloseTool}
            />
          );
        } else {
          return (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
              <p className="text-white p-4 bg-gray-800 rounded-md">
                Preparando previsualización de efectos...
              </p>
            </div>
          );
        }
      }
      default:
        return null;
    }
  };

  const generalDisabledState = isLoadingSave || isProcessingExit || (!!selectedElementId && activeTool !== null && activeTool !== 'effects');
  const isLastScreen = currentScreenIndex >= screensCount - 1;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-fondo)]">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[var(--color-fondo-toolbar)] shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-56 md:w-64 z-40
        `}
      >
        <div className="flex flex-col h-full pt-4 px-2">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="self-end p-2 mb-4 hover:bg-[var(--color-fondo-hover)] rounded"
            aria-label="Cerrar menú de herramientas"
          >
            ✕
          </button>

          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => { handleSelectTool('text'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'text' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">T</span>
              <span>Texto</span>
            </button>

            <button
              onClick={() => { handleSelectTool('curvedText'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'curvedText' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">C</span>
              <span>Texto Curvo</span>
            </button>

            <button
              onClick={() => { handleSelectTool('color'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'color' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">🎨</span>
              <span>Color</span>
            </button>

            <button
              onClick={() => { handleSelectTool('gradient'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'gradient' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">🖌️</span>
              <span>Degradado</span>
            </button>

            <button
              onClick={() => { handleSelectTool('imageBackground'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'imageBackground' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">🖼️</span>
              <span>Imagen Fondo</span>
            </button>

            <button
              onClick={() => { handleSelectTool('subimage'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'subimage' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">📷</span>
              <span>Subimagen</span>
            </button>

            <button
              onClick={() => { handleSelectTool('effects'); setIsSidebarOpen(false); }}
              className={`flex items-center p-2 mb-2 rounded transition-colors ${
                activeTool === 'effects' ? 'bg-primario text-white' : 'hover:bg-[var(--color-fondo-hover)]'
              }`}
            >
              <span className="mr-2 text-lg">✨</span>
              <span>Efectos</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Botón para abrir sidebar */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="
          fixed top-1/2 left-0 transform -translate-y-1/2 bg-primario text-white
          p-2 rounded-tr-lg rounded-br-lg z-50
        "
        aria-label="Abrir menú de herramientas"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
             viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex flex-col flex-1 ml-0">
        {/* Toolbar simplificada */}
        <div className="h-[var(--toolbar-height,60px)] bg-[var(--color-fondo-toolbar)] flex items-center justify-between px-4 shadow-md z-20">
          <div className="flex items-center space-x-2">
            <button
              onClick={prevScreen}
              className="p-2 rounded hover:bg-[var(--color-fondo-hover)] disabled:opacity-50"
              disabled={generalDisabledState || currentScreenIndex === 0}
              aria-label="Pantalla anterior"
            >
              ◀
            </button>
            <button
              onClick={isLastScreen ? handlePreviewAnuncio : nextScreen}
              className={`p-2 rounded flex items-center space-x-1 ${
                isLastScreen ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-primario hover:opacity-80 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={generalDisabledState}
            >
              <span className="text-sm">{isLastScreen ? 'Finalizar' : 'Siguiente'}</span>
              <span className="ml-1">{isLastScreen ? '✔' : '▶'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <span className="hidden sm:block text-sm text-[var(--color-texto-secundario)]">
              Pantalla {currentScreenIndex + 1} de {screensCount}
            </span>

            {anuncioParaCargar.status === 'draft' && (
              <button
                onClick={handleChangePlanCampania}
                className="p-2 rounded hover:bg-[var(--color-fondo-hover)]"
                title="Cambiar Plan/Campaña"
                disabled={generalDisabledState}
              >
                ⚙
              </button>
            )}

            <button
              onClick={handleOpenExitModal}
              className="p-2 rounded hover:bg-[var(--color-fondo-hover)]"
              title="Salir del Editor"
              disabled={generalDisabledState}
            >
              ✖
            </button>
          </div>
        </div>

        {/* Canvas + herramienta activa */}
        <main className="flex-1 bg-[var(--color-fondo)] overflow-hidden relative">
          <EditorCanvas ref={stageRef} />
          {renderActiveTool()}
        </main>

        {/* Botones flotantes */}
        <button
          onClick={() => setShowGuardarModal(true)}
          disabled={isLoadingSave || isProcessingExit}
          className="fixed bottom-4 right-4 z-30 bg-primario text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
        >
          {isLoadingSave ? 'Guardando...' : 'Guardar Pantalla'}
        </button>

        <button
          onClick={handlePreviewAnuncio}
          disabled={isLoadingSave || isProcessingExit}
          className="fixed bottom-4 left-4 z-30 bg-[var(--color-fondo-toolbar)] text-[var(--color-texto-toolbar)] px-4 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
        >
          Previsualizar Anuncio
        </button>
      </div>

      {/* Modal Confirmar Guardado */}
      {showGuardarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-texto-principal)]">
              Confirmar Cambios
            </h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              ¿Estás seguro de que deseas guardar los cambios realizados en esta pantalla ({currentScreenIndex + 1})?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowGuardarModal(false)} disabled={isLoadingSave}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveAnuncio} disabled={isLoadingSave}>
                {isLoadingSave ? 'Guardando...' : 'Sí, Guardar Pantalla'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isLoadingSave && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[55]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
          <p className="ml-4 text-lg text-white">Guardando pantalla...</p>
        </div>
      )}

      {/* Modal Salir del Editor */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-texto-principal)]">Salir del Editor</h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              ¿Qué deseas hacer con este anuncio?
            </p>
            <div className="flex flex-col space-y-3">
              <Button
                variant="primary"
                onClick={() => handleConfirmExitAction('saveAndExit')}
                disabled={isProcessingExit || isLoadingSave}
                className="w-full"
              >
                {isProcessingExit ? 'Guardando y Saliendo...' : 'Guardar Cambios y Salir'}
              </Button>
              {anuncioParaCargar.status === 'draft' && (
                <Button
                  variant="danger"
                  onClick={() => handleConfirmExitAction('deleteAndExit')}
                  disabled={isProcessingExit || isLoadingSave}
                  className="w-full"
                >
                  {isProcessingExit ? 'Eliminando...' : 'Eliminar Borrador y Salir'}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setShowExitModal(false)}
                disabled={isProcessingExit || isLoadingSave}
                className="w-full mt-2"
              >
                Cancelar (Seguir Editando)
              </Button>
            </div>
          </div>
        </div>
      )}

      {isProcessingExit && (
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[65]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
          <p className="ml-4 text-lg text-white">Procesando salida...</p>
        </div>
      )}
    </div>
  );
}
