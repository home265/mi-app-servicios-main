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
import type { UploadMetadata } from 'firebase/storage';

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
import { useUserStore } from '@/store/userStore';
import { useAnuncioStore } from '@/store/anuncioStore';
import { planes, campanias } from '@/lib/constants/anuncios';

import EditorCanvas from './EditorCanvas';
import Toolbar, { type ToolId } from './Toolbar';
import Button from '@/app/components/ui/Button';

// ... (importaciones de TextTool, CurvedTextTool, etc. y dataURLtoBlob sin cambios)
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
  console.log("[dataURLtoBlob] Intentando convertir dataURL a Blob. Data URL (primeros 100 chars):", dataurl.substring(0, 100));
  const response = await fetch(dataurl);
  if (!response.ok) {
    console.error("[dataURLtoBlob] Error en fetch:", response.status, response.statusText);
    throw new Error(`Error al obtener el blob desde dataURL: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  if (!blob) {
    console.error("[dataURLtoBlob] Fetch OK, pero el blob es nulo.");
    throw new Error("fetch devolvió una respuesta ok pero el blob es nulo o indefinido.");
  }
  console.log("[dataURLtoBlob] Blob creado exitosamente:", blob);
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
    creatorId: string;
  };
}

const EMPTY_ARRAY_EDITOR_ELEMENTS: EditorElement[] = [];

export default function EditorConCarga({ anuncioParaCargar }: EditorConCargaProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const currentUser = useUserStore(state => state.currentUser); 

  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [isProcessingExit, setIsProcessingExit] = useState<boolean>(false);

  const {
    loadAnuncioData,
    resetEditor: resetEditorStore,
    addElement,
    updateElement,
    setSelectedElementForEdit,
    nextScreen: goToNextScreenInStore,
    prevScreen: goToPrevScreenInStore,
  } = useEditorStore.getState();

  const currentScreenIndex = useEditorStore(state => state.currentScreenIndex);
  const screensCount = useEditorStore(state => state.screensCount);
  const selectedElementId = useEditorStore(state => state.selectedElementIdForEdit);
  const elementsByScreenFromStore = useEditorStore(state => state.elementsByScreen);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const animationEffectsByScreenFromStore = useEditorStore(state => state.animationEffectsByScreen);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const durationsByScreenFromStore = useEditorStore(state => state.durationsByScreen);

  const elementsOfCurrentScreen = useMemo(() => {
    return elementsByScreenFromStore[currentScreenIndex] || EMPTY_ARRAY_EDITOR_ELEMENTS;
  }, [elementsByScreenFromStore, currentScreenIndex]);

  const resetAnuncioConfigStore = useAnuncioStore(state => state.reset);

  const [isEditorInitialized, setIsEditorInitialized] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [isProcessingScreen, setIsProcessingScreen] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [showGuardarModal, setShowGuardarModal] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
  const [frozenCanvasDimensions, setFrozenCanvasDimensions] = useState<{ width: number; height: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const stageRef = useRef<Konva.Stage>(null);
  const elementosGuardadosRef = useRef<Record<string, Elemento[]>>({});

  ReactUseEffect(() => {
    console.log('[EditorConCarga] MOUNT/UPDATE: anuncioParaCargar ha cambiado. Reinicializando editor. Anuncio ID:', anuncioParaCargar.id);
    resetEditorStore();
    const dataToLoad: AnuncioDataToLoad = {
      screensCount: anuncioParaCargar.maxScreens,
      elementsByScreenFromDb: anuncioParaCargar.elementosPorPantalla,
      animationEffectsFromDb: anuncioParaCargar.animationEffectsPorPantalla,
    };
    loadAnuncioData(dataToLoad);
    const initialElementosParaRef: Record<string, Elemento[]> = {};
    for (let i = 0; i < anuncioParaCargar.maxScreens; i++) {
        const screenKey = String(i);
        if (anuncioParaCargar.elementosPorPantalla && anuncioParaCargar.elementosPorPantalla[screenKey]) {
            initialElementosParaRef[screenKey] = anuncioParaCargar.elementosPorPantalla[screenKey];
        } else {
            initialElementosParaRef[screenKey] = [];
        }
    }
    elementosGuardadosRef.current = initialElementosParaRef;
    console.log('[EditorConCarga] elementosGuardadosRef inicializado:', JSON.parse(JSON.stringify(elementosGuardadosRef.current)));
    setIsEditorInitialized(true);
  }, [anuncioParaCargar, resetEditorStore, loadAnuncioData]);

  // ... (useEffect de selectedElementId, useEffect de frozenCanvasDimensions sin cambios) ...
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
        } else if (!toolToOpen) {
          setSelectedElementForEdit(null);
          if (activeTool !== 'effects') setActiveTool(null);
        }
      } else {
        setSelectedElementForEdit(null);
        if (activeTool !== 'effects') setActiveTool(null);
      }
    }
  }, [selectedElementId, elementsOfCurrentScreen, activeTool, setSelectedElementForEdit]);

  ReactUseEffect(() => {
  /** Mantendrá el ID del frame activo */
  let animationFrameId: number | undefined;

  /**  
   * Bucle que se repite hasta que el Stage tenga un
   * tamaño > 0 × 0 o hasta que la herramienta “effects”
   * deje de estar activa.  
   */
  const measureUntilReady = () => {
    const stageNode = stageRef.current;
    if (stageNode) {
      const w = stageNode.width();
      const h = stageNode.height();

      if (w > 0 && h > 0) {
        setFrozenCanvasDimensions({ width: w, height: h });
        return;                     // ← ¡Listo! Salimos del loop
      }
    }
    animationFrameId = requestAnimationFrame(measureUntilReady);
  };

  if (activeTool === 'effects') {
    measureUntilReady();
  } else {
    setFrozenCanvasDimensions(null);
  }

  return () => {
    if (typeof animationFrameId === 'number') {
      cancelAnimationFrame(animationFrameId);
    }
  };
}, [activeTool]);


  const handleSelectTool = useCallback((toolId: ToolId | null) => {
    console.log(`[handleSelectTool] Solicitud para herramienta: ${toolId}. Herramienta activa actual: ${activeTool}. Elemento seleccionado: ${useEditorStore.getState().selectedElementIdForEdit}`);
    if (activeTool === toolId && toolId !== 'effects') {
      console.log(`[handleSelectTool] Toggle OFF para herramienta: ${toolId}.`);
      setActiveTool(null);
      setSelectedElementForEdit(null);
    } else {
      console.log(`[handleSelectTool] Estableciendo activeTool a: ${toolId}.`);
      setSelectedElementForEdit(null);
      setActiveTool(toolId);
    }
    setIsSidebarOpen(false);
  }, [activeTool, setSelectedElementForEdit]);

  const handleCloseTool = useCallback(() => {
    const currentActive = activeTool;
    const currentSelected = useEditorStore.getState().selectedElementIdForEdit;
    console.log(`[handleCloseTool] Cerrando herramienta activa: ${currentActive}. Deseleccionando elemento si existe (${currentSelected}).`);
    setActiveTool(null);
    if (currentSelected) {
        setSelectedElementForEdit(null);
    }
  }, [activeTool, setSelectedElementForEdit]);

  const handleConfirmEditOrAddElement = useCallback((elementData: Omit<EditorElement, 'id' | 'tipo'> & { tipo: EditorElement['tipo'] }) => {
    const currentSelectedId = useEditorStore.getState().selectedElementIdForEdit;
    console.log(`[handleConfirmEditOrAddElement] Confirmando. selectedElementId (store): ${currentSelectedId}. Datos:`, JSON.parse(JSON.stringify(elementData)));
    if (currentSelectedId) {
      console.log(`[handleConfirmEditOrAddElement] Actualizando elemento ID: ${currentSelectedId}`);
      const { tipo, ...propsToUpdate } = elementData;
      updateElement(currentSelectedId, propsToUpdate);
    } else {
      console.log(`[handleConfirmEditOrAddElement] Añadiendo nuevo elemento.`);
      addElement(elementData as Omit<EditorElement, 'id'>);
    }
    handleCloseTool();
  }, [updateElement, addElement, handleCloseTool]);

  const procesarYGuardarPantallaActual = useCallback(async (): Promise<boolean> => {
    // Usar el currentScreenIndex del store para asegurar que es el más actualizado
    const pantallaAGuardarIndex = useEditorStore.getState().currentScreenIndex;
    console.log(`[procesarYGuardarPantallaActual] Iniciando para pantalla ${pantallaAGuardarIndex}. Anuncio ID: ${anuncioParaCargar.id}`);
    
    if (!stageRef.current) {
      alert("Error interno: Referencia al canvas no encontrada para guardar pantalla.");
      console.error("[procesarYGuardarPantallaActual] stageRef.current es null.");
      return false;
    }
    if (!anuncioParaCargar.id || !anuncioParaCargar.plan || !anuncioParaCargar.provincia || !anuncioParaCargar.localidad || !anuncioParaCargar.creatorId) {
        alert("Error interno: Faltan datos del anuncio (ID, plan, provincia, localidad, creatorId) para procesar la pantalla.");
        console.error("[procesarYGuardarPantallaActual] Faltan datos críticos de anuncioParaCargar:", anuncioParaCargar);
        return false;
    }

    let newStorageImageUrl = '';
    try {
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Generando dataURL del canvas...`);
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 });
      if (!dataUrl) {
        console.error(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] toDataURL devolvió null o undefined.`);
        alert("Error al generar la imagen de la pantalla.");
        return false;
      }
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Data URL (primeros 100 chars):`, dataUrl.substring(0,100)+"...");

      const imageBlob = await dataURLtoBlob(dataUrl);
      const imagePath = `capturas_anuncios/${anuncioParaCargar.id}/screen_${pantallaAGuardarIndex}_${Date.now()}.jpg`;
      
      const metadataForStorage: UploadMetadata = {
  contentType: 'image/jpeg',
  customMetadata: {
    ownerUid: anuncioParaCargar.creatorId,
  },
};

      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Subiendo imagen a Storage en path:`, imagePath, "con metadatos:", metadataForStorage);
      
      newStorageImageUrl = await uploadFileAndGetURL(imageBlob, imagePath, metadataForStorage);
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Imagen subida a Storage. URL:`, newStorageImageUrl);

      const planSeleccionado = planes.find(p => p.id === anuncioParaCargar.plan);
      const campaniaSeleccionada = anuncioParaCargar.campaniaId
        ? campanias.find(c => c.id === anuncioParaCargar.campaniaId)
        : undefined;

      if (!planSeleccionado) {
        console.error(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Plan seleccionado no encontrado:`, anuncioParaCargar.plan);
        alert("Error: Datos del plan no encontrados para este anuncio.");
        if (newStorageImageUrl) deleteFileByUrl(newStorageImageUrl).catch(console.error);
        return false;
      }
      
      const campaignDurationDays = campaniaSeleccionada
        ? campaniaSeleccionada.months * 30
        : anuncioParaCargar.maxScreens * (planSeleccionado.durationSeconds / anuncioParaCargar.maxScreens);

      // Leer los estados del store para la pantalla correcta
      const sCount = useEditorStore.getState().screensCount;
      const effectForScreen = useEditorStore.getState().animationEffectsByScreen[pantallaAGuardarIndex];
      const durationForScreen = useEditorStore.getState().durationsByScreen[pantallaAGuardarIndex];

      let durationSecondsCalc: number;
      let totalExposureCalc: number;

      if (typeof durationForScreen === 'number' && durationForScreen > 0) {
        durationSecondsCalc = durationForScreen;
        totalExposureCalc = sCount * durationForScreen;
      } else {
        totalExposureCalc = planSeleccionado.durationSeconds;
        durationSecondsCalc = sCount > 0 ? totalExposureCalc / sCount : totalExposureCalc;
      }
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Duración: ${durationSecondsCalc}s, Exposición total: ${totalExposureCalc}s`);

      const capturaDataPayload: Omit<Captura, 'createdAt' | 'screenIndex'> & { screenIndex: number } = {
        imageUrl: newStorageImageUrl,
        screenIndex: pantallaAGuardarIndex,
        plan: anuncioParaCargar.plan,
        campaignDurationDays: campaignDurationDays,
        provincia: anuncioParaCargar.provincia,
        localidad: anuncioParaCargar.localidad,
        animationEffect: effectForScreen,
        durationSeconds: durationSecondsCalc,
        totalExposure: totalExposureCalc,
      };
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Payload de la captura para Firestore:`, capturaDataPayload);

      const existingCapturaInfo = await getCapturaByScreenIndex(anuncioParaCargar.id, pantallaAGuardarIndex);
      let oldImageUrlToDelete: string | undefined = undefined;

      if (existingCapturaInfo) {
        oldImageUrlToDelete = existingCapturaInfo.data.imageUrl;
        console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Actualizando captura existente ID: ${existingCapturaInfo.id}. URL antigua: ${oldImageUrlToDelete}`);
        const { screenIndex: _idx, ...dataToUpdate } = capturaDataPayload;
        await updateCapturaService(anuncioParaCargar.id, existingCapturaInfo.id, dataToUpdate);
      } else {
        console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Creando nueva captura.`);
        await addCaptura(anuncioParaCargar.id, capturaDataPayload);
      }

      const currentScreenEditorElements = useEditorStore.getState().elementsByScreen[pantallaAGuardarIndex] || [];
      const elementosParaDb: Elemento[] = currentScreenEditorElements.map(editorEl => {
        const { id: _id, ...restOfElemento } = editorEl;
        return restOfElemento as Elemento;
      });
      elementosGuardadosRef.current[String(pantallaAGuardarIndex)] = elementosParaDb;
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Elementos actualizados en ref local:`, JSON.parse(JSON.stringify(elementosParaDb)));

      if (oldImageUrlToDelete && oldImageUrlToDelete !== newStorageImageUrl && !oldImageUrlToDelete.startsWith('data:')) {
        console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Programando borrado asíncrono de imagen antigua: ${oldImageUrlToDelete}`);
        deleteFileByUrl(oldImageUrlToDelete).catch(err =>
          console.error(`[procesarYGuardarPantallaActual] Error ASÍNCRONO borrando imagen antigua ${oldImageUrlToDelete}:`, err)
        );
      }
      console.log(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Procesada y guardada. Retornando true.`);
      return true;

    } catch (error) {
      console.error(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Error procesando:`, error);
      let errorMessage = 'Error desconocido.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      alert(`Error al guardar la pantalla ${pantallaAGuardarIndex + 1}: ${errorMessage}`);
      
      if (newStorageImageUrl) {
        console.warn(`[procesarYGuardarPantallaActual] [Pantalla ${pantallaAGuardarIndex}] Error después de subir ${newStorageImageUrl}, intentando borrarla.`);
        deleteFileByUrl(newStorageImageUrl).catch(delErr =>
          console.error('[procesarYGuardarPantallaActual] Error adicional borrando imagen nueva tras fallo:', delErr)
        );
      }
      return false;
    }
  }, [
    anuncioParaCargar, // Dependencia principal para IDs y datos del anuncio
    // currentScreenIndex se lee del store al inicio de la función para frescura
    // Lo mismo para animationEffectsByScreenFromStore, durationsByScreenFromStore, screensCount
  ]);

  const handleSaveCurrentScreenOnly = useCallback(async () => {
    console.log("[handleSaveCurrentScreenOnly] Iniciando guardado de PANTALLA ACTUAL.");
    setIsLoadingSave(true);
    setShowGuardarModal(false);

    if (activeTool) setActiveTool(null);
    if (useEditorStore.getState().selectedElementIdForEdit) setSelectedElementForEdit(null);

    const success = await procesarYGuardarPantallaActual();
    if (success) {
      alert('Pantalla guardada con éxito.');
    }
    setIsLoadingSave(false);
    console.log("[handleSaveCurrentScreenOnly] Finalizado guardado de PANTALLA ACTUAL.");
  }, [procesarYGuardarPantallaActual, activeTool, setSelectedElementForEdit]);

  const handleNextOrFinalize = useCallback(async () => {
    const CS_INDEX = useEditorStore.getState().currentScreenIndex;
    const S_COUNT = useEditorStore.getState().screensCount;
    const isLast = CS_INDEX >= S_COUNT - 1 && S_COUNT > 0;

    console.log(`[handleNextOrFinalize] ----- INICIO -----`);
    console.log(`[handleNextOrFinalize] currentScreenIndex (store): ${CS_INDEX}, screensCount (store): ${S_COUNT}, Es la última: ${isLast}`);
    console.log(`[handleNextOrFinalize] activeTool (local): ${activeTool}, selectedElementId (store): ${useEditorStore.getState().selectedElementIdForEdit}`);
    
    setIsProcessingScreen(true);
    console.log(`[handleNextOrFinalize] isProcessingScreen = true`);

    if (activeTool) {
      console.log(`[handleNextOrFinalize] Cerrando herramienta activa: ${activeTool}`);
      setActiveTool(null);
    }
    if (useEditorStore.getState().selectedElementIdForEdit) {
      console.log(`[handleNextOrFinalize] Deseleccionando elemento: ${useEditorStore.getState().selectedElementIdForEdit}`);
      setSelectedElementForEdit(null);
    }

    console.log(`[handleNextOrFinalize] Llamando a procesarYGuardarPantallaActual() para pantalla ${CS_INDEX}...`);
    const success = await procesarYGuardarPantallaActual();
    console.log(`[handleNextOrFinalize] procesarYGuardarPantallaActual() retornó: ${success} para pantalla ${CS_INDEX}`);

    if (success) {
      const currentIsLast = useEditorStore.getState().currentScreenIndex >= useEditorStore.getState().screensCount - 1 && useEditorStore.getState().screensCount > 0;
      // ^ Re-evaluar isLast con el índice que podría haber sido actualizado por goToNextScreenInStore si no fuera la última.
      // Sin embargo, si success=true y currentIsLast=false, llamamos a goToNextScreenInStore.
      // Si success=true y currentIsLast=true, mostramos modal.
      if (currentIsLast) { // Si después de guardar, sigue siendo la última (o era la última)
        console.log("[handleNextOrFinalize] Es la última pantalla Y SE GUARDÓ BIEN. Mostrando modal de finalizar.");
        setShowFinalizarModal(true);
      } else {
        console.log("[handleNextOrFinalize] NO es la última pantalla y SE GUARDÓ BIEN. Pasando a la siguiente pantalla.");
        goToNextScreenInStore();
      }
    } else {
      console.warn(`[handleNextOrFinalize] procesarYGuardarPantallaActual() falló para pantalla ${CS_INDEX}. No se avanza ni se muestra modal.`);
    }
    
    setIsProcessingScreen(false);
    console.log(`[handleNextOrFinalize] isProcessingScreen = false`);
    console.log(`[handleNextOrFinalize] ----- FIN -----`);
  }, [
    procesarYGuardarPantallaActual,
    goToNextScreenInStore,
    activeTool, 
    setSelectedElementForEdit
  ]);
  
  const handleFinalizarAnuncioCompleto = useCallback(async () => {
  const anuncioIdActual = anuncioParaCargar.id;
  console.log(
    '[handleFinalizarAnuncioCompleto] Iniciando finalización del anuncio completo. Anuncio ID:',
    anuncioIdActual
  );
  setShowFinalizarModal(false);
  setIsProcessingScreen(true);

  // --- INICIO CAMBIO PARA EVITAR DUPLICACIÓN ---
  console.log(
    '[handleFinalizarAnuncioCompleto] Se asume que la última pantalla ya fue procesada por handleNextOrFinalize, que llamó a procesarYGuardarPantallaActual.'
  );
  // ---- FIN CAMBIO PARA EVITAR DUPLICACIÓN -----

  try {
    /* -----------------------------------------------------------------
       1️⃣  Construimos el payload SIN forzar status por defecto
    ------------------------------------------------------------------ */
    const payload: {
      elementosPorPantalla: typeof elementosGuardadosRef.current;
      status?: 'pendingPayment';
    } = {
      elementosPorPantalla: elementosGuardadosRef.current,
    };

    /* -----------------------------------------------------------------
       2️⃣  Sólo los anuncios que NO estén activos pasan a pendingPayment
    ------------------------------------------------------------------ */
    if (anuncioParaCargar.status !== 'active') {
      payload.status = 'pendingPayment';
    }

    console.log(
      '[handleFinalizarAnuncioCompleto] Elementos finales a guardar en el Anuncio:',
      JSON.parse(JSON.stringify(elementosGuardadosRef.current))
    );

    await updateAnuncioService(anuncioIdActual, payload);
    console.log(
      '[handleFinalizarAnuncioCompleto] Anuncio actualizado con todos los elementos.'
    );

    /* -----------------------------------------------------------------
       3️⃣  Redirección según estado previo
    ------------------------------------------------------------------ */
    if (anuncioParaCargar.status === 'active') {
  alert('¡Cambios guardados! Volvemos a tu anuncio.');
  // Mostramos la versión actualizada en la página de previsualización
  router.push(`/preview/${anuncioIdActual}?edit=ok`);
} else {
  alert(
    '¡Anuncio completado y listo para el pago! Serás redirigido a la previsualización.'
  );
  // Flujo normal de pago para borradores
  router.push(`/preview/${anuncioIdActual}`);
}

  } catch (error) {
    console.error(
      '[handleFinalizarAnuncioCompleto] Error al actualizar el anuncio para finalizar:',
      error
    );
    alert(
      `Error CRÍTICO al finalizar el anuncio: ${
        error instanceof Error ? error.message : 'Error desconocido.'
      }`
    );
  } finally {
    setIsProcessingScreen(false);
    console.log('[handleFinalizarAnuncioCompleto] Finalizado.');
  }
}, [anuncioParaCargar.id, anuncioParaCargar.status, router]);


  // ... (Callbacks handlePreviewAnuncio, handleOpenExitModal, handleChangePlanCampania, handleConfirmExitAction sin cambios) ...
  const handlePreviewAnuncio = useCallback(() => {
    console.log("[handlePreviewAnuncio] Solicitud de previsualización.");
    if (anuncioParaCargar && anuncioParaCargar.id) {
      router.push(`/preview/${anuncioParaCargar.id}`);
    } else {
      console.error("[handlePreviewAnuncio] Error: No se pudo obtener el ID del anuncio.");
      alert("Error al intentar previsualizar: ID del anuncio no encontrado.");
    }
  }, [anuncioParaCargar, router]);

  const handleOpenExitModal = useCallback(() => {
    console.log("[handleOpenExitModal] Abriendo modal de salida.");
    setShowExitModal(true);
  }, []);

  const handleChangePlanCampania = useCallback(() => {
    console.log("[handleChangePlanCampania] Solicitud de cambio de plan/campaña.");
    if (anuncioParaCargar.status === 'draft') {
      const confirmChange = window.confirm(
        "Serás redirigido para cambiar el plan/campaña de tu borrador. ¿Estás seguro? Los cambios no guardados en la pantalla actual podrían perderse."
      );
      if (confirmChange) {
        console.log("[handleChangePlanCampania] Confirmado. Redirigiendo a planes.");
        router.push(`/planes?borradorId=${anuncioParaCargar.id}`);
      } else {
        console.log("[handleChangePlanCampania] Cambio cancelado.");
      }
    } else {
      alert("Solo puedes cambiar el plan/campaña de anuncios en estado 'borrador'.");
    }
  }, [router, anuncioParaCargar]);

  const handleConfirmExitAction = useCallback(async (action: 'saveAndExit' | 'deleteAndExit') => {
    const anuncioId = anuncioParaCargar.id;
    console.log(`[handleConfirmExitAction] Acción: ${action}, Anuncio ID: ${anuncioId}`);

    setIsProcessingExit(true);
    setShowExitModal(false);

    if (action === 'saveAndExit') {
      try {
        console.log("[handleConfirmExitAction] Intentando guardar ANTES de salir...");
        // Procesar y guardar la pantalla actual ANTES de intentar actualizar el anuncio principal
        const guardadoPantallaOk = await procesarYGuardarPantallaActual();
        
        if (guardadoPantallaOk) {
            console.log("[handleConfirmExitAction] Elementos a guardar en el Anuncio al salir:", elementosGuardadosRef.current);
            await updateAnuncioService(anuncioId, {
                elementosPorPantalla: elementosGuardadosRef.current,
                // No cambiamos el status aquí, solo guardamos el progreso del draft
            });
            console.log(`[handleConfirmExitAction] Borrador ${anuncioId} guardado. Redirigiendo a mis-anuncios.`);
            router.push('/mis-anuncios');
        } else {
            // Si falla el guardado de la pantalla actual, no proceder con el guardado del anuncio
            throw new Error("Fallo al guardar la pantalla actual antes de salir. El anuncio no se guardó completamente.");
        }
      } catch (error) {
        console.error("[handleConfirmExitAction] Error al guardar el borrador antes de salir:", error);
        // La alerta ya se muestra en procesarYGuardarPantallaActual si falló allí, o aquí si falla updateAnuncioService
        if (!(error instanceof Error && error.message.includes("pantalla"))) {
            alert(`No se pudo guardar el progreso antes de salir: ${error instanceof Error ? error.message : "Intente de nuevo."}`);
        }
      } finally {
        setIsProcessingExit(false);
      }
    } else if (action === 'deleteAndExit') {
      if (anuncioParaCargar.status !== 'draft') {
        alert("Solo se pueden eliminar anuncios en estado 'borrador'.");
        setIsProcessingExit(false);
        return;
      }
      const confirmDelete = window.confirm(
        "¡Atención! Estás a punto de eliminar este borrador de forma permanente. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?"
      );
      if (confirmDelete) {
        try {
          console.log(`[handleConfirmExitAction] Confirmada eliminación del borrador ${anuncioId}.`);
          await deleteAnuncio(anuncioId);
          console.log(`[handleConfirmExitAction] Borrador ${anuncioId} eliminado. Reseteando stores y redirigiendo.`);
          resetAnuncioConfigStore();
          resetEditorStore();
          router.push('/mis-anuncios');
        } catch (error) {
          console.error("[handleConfirmExitAction] Error al eliminar el borrador:", error);
          alert(`No se pudo eliminar el borrador: ${(error instanceof Error) ? error.message : "Error desconocido"}`);
        } finally {
          setIsProcessingExit(false);
        }
      } else {
        console.log("[handleConfirmExitAction] Eliminación cancelada.");
        setIsProcessingExit(false);
      }
    }
  }, [anuncioParaCargar, procesarYGuardarPantallaActual, router, resetAnuncioConfigStore, resetEditorStore]);


  // ... (JSX de renderizado: if !isEditorInitialized, renderActiveTool, y el return principal con Sidebar, Toolbar, Modales, etc.,
  // permanecen IGUALES a la última versión completa que te proporcioné. Los cambios clave están en los callbacks de arriba.)

  if (!isEditorInitialized || !anuncioParaCargar) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
        <p className="ml-4 text-lg">Cargando editor...</p>
      </div>
    );
  }

  const renderActiveTool = () => {
    const currentSelectedId = useEditorStore.getState().selectedElementIdForEdit;
    const elementToEdit = currentSelectedId
      ? elementsOfCurrentScreen.find(el => el.id === currentSelectedId)
      : undefined;
    
    if (!activeTool) return null;
    
    switch (activeTool) {
      case 'text':
        return ( <TextTool key={currentSelectedId || 'new-text'} initial={elementToEdit?.tipo === 'texto' ? elementToEdit as TextElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'curvedText':
        return ( <CurvedTextTool key={currentSelectedId || 'new-curvedText'} initial={elementToEdit?.tipo === 'textoCurvo' ? elementToEdit as CurvedTextElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'color':
        return ( <ColorTool key={'tool-color'} initial={elementToEdit?.tipo === 'fondoColor' ? elementToEdit as ColorBackgroundElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'imageBackground':
        return ( <ImageBackgroundTool key={'tool-imageBg'} initial={elementToEdit?.tipo === 'fondoImagen' ? elementToEdit as ImageBackgroundElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'gradient':
        return ( <GradientBackgroundTool key={'tool-gradient'} initial={elementToEdit?.tipo === 'gradient' ? elementToEdit as GradientBackgroundElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'subimage':
        return ( <SubimageTool key={currentSelectedId || 'new-subimage'} initial={elementToEdit?.tipo === 'subimagen' ? elementToEdit as SubimageElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'effects': {
        if (frozenCanvasDimensions && frozenCanvasDimensions.width > 0 && frozenCanvasDimensions.height > 0) {
          return ( <AdvancedEffectsToolDynamic elementsForPreview={elementsOfCurrentScreen} baseCanvasWidth={frozenCanvasDimensions.width} baseCanvasHeight={frozenCanvasDimensions.height} onClose={handleCloseTool} /> );
        } else {
          return ( <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"> <p className="text-white p-4 bg-gray-800 rounded-md"> Preparando previsualización de efectos... </p> </div> );
        }
      }
      default:
        return null;
    }
  };

  const generalDisabledState = isLoadingSave || isProcessingExit || isProcessingScreen || (!!selectedElementId && activeTool !== null && activeTool !== 'effects');
  const isLastScreenValue = currentScreenIndex >= screensCount - 1 && screensCount > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-fondo)]">
      <aside
        className={`
          fixed top-0 left-0 h-full bg-[var(--color-fondo-toolbar)] shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-56 md:w-64 z-40 overflow-y-auto
        `}
      >
        <div className="flex flex-col h-full pt-4 px-2">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="self-end p-2 mb-4 hover:bg-[var(--color-fondo-hover)] rounded-md"
            aria-label="Cerrar menú de herramientas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1">
            {(['text', 'curvedText', 'color', 'gradient', 'imageBackground', 'subimage', 'effects'] as ToolId[]).map(toolId => (
              <button
                key={toolId}
                onClick={() => handleSelectTool(toolId)}
                className={`w-full flex items-center p-3 mb-2 rounded-md transition-colors text-sm text-left
                            ${activeTool === toolId && toolId !== 'effects'
                              ? 'bg-primario text-white'
                              : 'text-[var(--color-texto-principal)] hover:bg-[var(--color-fondo-hover)]'
                            }`}
              >
                {toolId === 'text' && <span className="mr-2">✏️</span>}
                {toolId === 'curvedText' && <span className="mr-2">↪️</span>}
                {toolId === 'color' && <span className="mr-2">🎨</span>}
                {toolId === 'gradient' && <span className="mr-2">🌈</span>}
                {toolId === 'imageBackground' && <span className="mr-2">🖼️</span>}
                {toolId === 'subimage' && <span className="mr-2">🧩</span>}
                {toolId === 'effects' && <span className="mr-2">✨</span>}
                {toolId.charAt(0).toUpperCase() + toolId.slice(1).replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      <div className="flex flex-col flex-1 ml-0">
        <Toolbar
            activeTool={activeTool}
            onPrev={goToPrevScreenInStore}
            onNext={handleNextOrFinalize}
            onPreview={handleNextOrFinalize} // <-- CAMBIO: Toolbar "Finalizar" también llama a handleNextOrFinalize
            isLastScreen={isLastScreenValue}
            currentScreen={currentScreenIndex + 1}
            totalScreens={screensCount}
            disabled={generalDisabledState || isProcessingScreen}
            onExitEditor={handleOpenExitModal}
            showExitEditorButton={true}
            onChangePlanCampania={handleChangePlanCampania}
            showChangePlanCampaniaButton={anuncioParaCargar.status === 'draft'}
        />

        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-primario text-white p-2 rounded-r-lg shadow-lg z-20 hover:bg-primario-hover focus:outline-none focus:ring-2 focus:ring-primario-focus"
            aria-label="Abrir menú de herramientas"
            title="Herramientas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        )}

        <main className="flex-1 bg-[var(--color-fondo)] overflow-hidden relative">
          <EditorCanvas ref={stageRef} />
          {renderActiveTool()}
          {(isLoadingSave || isProcessingScreen || isProcessingExit) && (
            <div className="absolute inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[55]">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
              <p className="ml-4 text-lg text-white">
                {isLoadingSave && 'Guardando pantalla...'}
                {isProcessingScreen && 'Procesando...'}
                {isProcessingExit && 'Saliendo...'}
              </p>
            </div>
          )}
        </main>

        <button
          onClick={() => setShowGuardarModal(true)}
          disabled={isLoadingSave || isProcessingExit || isProcessingScreen}
          className="fixed bottom-4 right-4 z-30 bg-primario text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
        >
          {isLoadingSave ? 'Guardando...' : 'Guardar Pantalla'}
        </button>

        <button
          onClick={handlePreviewAnuncio}
          disabled={isLoadingSave || isProcessingExit || isProcessingScreen}
          className="fixed bottom-4 left-4 z-30 bg-[var(--color-fondo-toolbar)] text-[var(--color-texto-toolbar)] px-4 py-2 rounded-lg shadow-md hover:opacity-90 disabled:opacity-50"
        >
          Previsualizar Anuncio
        </button>
      </div>

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
              <Button variant="primary" onClick={handleSaveCurrentScreenOnly} disabled={isLoadingSave}>
                {isLoadingSave ? 'Guardando...' : 'Sí, Guardar Pantalla'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showFinalizarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-texto-principal)]">Finalizar Anuncio</h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              Has llegado a la última pantalla ({screensCount}). ¿Deseas finalizar y guardar todos los cambios del anuncio?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowFinalizarModal(false)} disabled={isProcessingScreen}>
                Seguir Editando
              </Button>
              <Button variant="primary" onClick={handleFinalizarAnuncioCompleto} disabled={isProcessingScreen}>
                {isProcessingScreen ? 'Finalizando...' : 'Sí, Finalizar Anuncio'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
                disabled={isProcessingExit || isLoadingSave || isProcessingScreen}
                className="w-full"
              >
                {isProcessingExit ? 'Guardando y Saliendo...' : 'Guardar Cambios y Salir'}
              </Button>
              {anuncioParaCargar.status === 'draft' && (
                <Button
                  variant="danger" 
                  onClick={() => handleConfirmExitAction('deleteAndExit')}
                  disabled={isProcessingExit || isLoadingSave || isProcessingScreen}
                  className="w-full"
                >
                  {isProcessingExit ? 'Eliminando...' : 'Eliminar Borrador y Salir'}
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setShowExitModal(false)}
                disabled={isProcessingExit || isLoadingSave || isProcessingScreen}
                className="w-full mt-2"
              >
                Cancelar (Seguir Editando)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}