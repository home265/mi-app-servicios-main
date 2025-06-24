'use client';

import React, {
  useEffect as ReactUseEffect, // Renombrar para claridad, usar solo para lógica existente crítica
  useState,
  useRef,
  useCallback,
  useMemo
} from 'react';
import { useRouter } // Ya no necesitamos useSearchParams aquí si esta página solo crea nuevos
from 'next/navigation';
import dynamic from 'next/dynamic';
import Konva from 'konva'; //

import { useAnuncioStore } from '@/store/anuncioStore'; //
import { useUserStore } from '@/store/userStore'; //
import {
  useEditorStore,
  type EditorElement,
  type TextElement,
  type CurvedTextElement,
  type ColorBackgroundElement,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  type ImageBackgroundElement,
  type SubimageElement,
  type GradientBackgroundElement,
} from '@/app/(ads)/editor/hooks/useEditorStore'; //
import {
  createDraftAnuncio, // Esta es la función clave que usaremos
  updateAnuncio as updateAnuncioService, //
  addCaptura, //
  getCapturaByScreenIndex, //
  updateCaptura, //
  deleteAnuncio, //
} from '@/lib/services/anunciosService'; //
import type { Anuncio, Elemento, Captura } from '@/types/anuncio'; //
import { planes, campanias } from '@/lib/constants/anuncios'; //
import {
  uploadFileAndGetURL,
  // deleteFileByUrl //
} from '@/lib/firebase/storage'; //

// Dynamic components
const EditorCanvas = dynamic(() => import('../components/EditorCanvas'), { //
  ssr: false, //
  loading: () => ( //
    <div className="flex justify-center items-center h-[300px]">
      <p>Cargando lienzo...</p>
    </div>
  ),
});

import Toolbar, { type ToolId } from '../components/Toolbar'; //
import Button from '@/app/components/ui/Button'; //
import BlurLoader from '../components/loaders/BlurLoader'; //

import TextTool from '../tools/TextTool'; //
import CurvedTextTool from '../tools/CurvedTextTool'; //
import ColorTool from '../tools/ColorTool'; //
import ImageBackgroundTool from '../tools/ImageBackgroundTool'; //
import SubimageTool from '../tools/SubimageTool'; //
import GradientBackgroundTool from '../tools/GradientBackgroundTool'; //
 
const AdvancedEffectsToolDynamic = dynamic( //
  () => import('../tools/AdvancedEffectsTool'), //
  {
    ssr: false, //
    loading: () => ( //
      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
        <p className="text-white p-4 bg-gray-800 rounded-md">
          Cargando herramienta de efectos...
        </p>
      </div>
    ),
  }
);
const FrameColorTool = dynamic(() => import('../tools/FrameColorTool'), { ssr: false });
async function dataURLtoBlob(dataurl: string): Promise<Blob> { //
  const response = await fetch(dataurl); //
  if (!response.ok) { //
    throw new Error(`Error al obtener el blob desde dataURL: ${response.status} ${response.statusText}`); //
  }
  const blob = await response.blob(); //
  if (!blob) { //
    throw new Error("fetch devolvió una respuesta ok pero el blob es nulo o indefinido."); //
  }
  return blob; //
}

export default function NuevoAnuncioPage() {
  const router = useRouter(); //

  // --- Estados para el nuevo Modal de Salida ---
  const [showExitModal, setShowExitModal] = useState<boolean>(false); //
  const [isProcessingExit, setIsProcessingExit] = useState<boolean>(false); //

  // --- State Hooks ---
  const planId = useAnuncioStore(state => state.planId); //
  const campaniaId = useAnuncioStore(state => state.campaniaId); //
  const selectedScreensCount = useAnuncioStore(state => state.screensCount); //
  const resetAnuncioStore = useAnuncioStore(state => state.reset); //

  const currentUser = useUserStore(state => state.currentUser); //
  const isLoadingAuth = useUserStore(state => state.isLoadingAuth); //
  const creatorId = currentUser?.uid; //
  // Para provincia y localidad, es mejor obtenerlas de forma segura:
  const userProvincia = currentUser?.localidad?.provinciaNombre;
  const userLocalidad = currentUser?.localidad?.nombre;

  // --- Editor Store Hooks ---
  const {
    initialize, //
    resetEditor: resetEditorStore, //
    addElement, //
    updateElement, //
    setSelectedElementForEdit, //
    nextScreen: goToNextScreenInStore, // Desestructura 'nextScreen' y lo renombra a 'goToNextScreenInStore'
  prevScreen: goToPrevScreenInStore, // Desestructura 'prevScreen' y lo renombra a 'goToPrevScreenInStore'
  } = useEditorStore.getState(); //

  const currentScreenIndex = useEditorStore(state => state.currentScreenIndex); //
  const editorScreensCount = useEditorStore(state => state.screensCount); //
  const selectedElementId = useEditorStore(state => state.selectedElementIdForEdit); //
  const currentScreenElementsData = useEditorStore(state => state.elementsByScreen[state.currentScreenIndex]); //

  const elementsOfCurrentScreen = useMemo(() => { //
    return currentScreenElementsData || []; //
  }, [currentScreenElementsData]); //

  // --- Local State ---
  const [currentAnuncioId, setCurrentAnuncioId] = useState<string | null>(null); //
  const [isCreatingDraft, setIsCreatingDraft] = useState(true); // Inicia en true, ya que esta página es para crear
  const [isProcessingScreen, setIsProcessingScreen] = useState(false); //
  const [activeTool, setActiveTool] = useState<ToolId | null>(null); //
  const [showFinalizarModal, setShowFinalizarModal] = useState(false); //
  const [frozenCanvasDimensions, setFrozenCanvasDimensions] = useState<{ //
    width: number; //
    height: number; //
  } | null>(null); //

  // --- Refs ---
  const stageRef = useRef<Konva.Stage>(null); //
  const elementosGuardadosRef = useRef<Record<string, Elemento[]>>({}); //
  // isMountedRef y draftCreationProcessedRef ya no son necesarios con el nuevo enfoque

  // --- Lógica de useEffect existente (SE MANTIENE IGUAL, NO SE ALTERA) ---
  // Effect to open tool when an element is selected for edit
  ReactUseEffect(() => { //
    // ... (sin cambios en esta lógica) ...
        if (selectedElementId) { //
      const elementToEdit = elementsOfCurrentScreen.find((el: EditorElement) => el.id === selectedElementId); //
      if (elementToEdit) { //
        let toolToOpen: ToolId | null = null; //
        switch (elementToEdit.tipo) { //
          case 'texto': toolToOpen = 'text'; break; //
          case 'textoCurvo': toolToOpen = 'curvedText'; break; //
          case 'fondoColor': toolToOpen = 'color'; break; //
          case 'fondoImagen': toolToOpen = 'imageBackground'; break; //
          case 'subimagen': toolToOpen = 'subimage'; break; //
          case 'gradient': toolToOpen = 'gradient'; break; //
        }
        if (toolToOpen) setActiveTool(toolToOpen); //
        else setSelectedElementForEdit(null); //
      } else { //
        setSelectedElementForEdit(null); //
        setActiveTool(null); //
      }
    }
  }, [selectedElementId, elementsOfCurrentScreen, setSelectedElementForEdit]); //

  
  // --- **NUEVO useEffect para Creación del Draft y Redirección** ---
  const draftCreationAttemptedRef = useRef(false);

  ReactUseEffect(() => {
    // Evitar repetir la creación
    if (draftCreationAttemptedRef.current) return;
    // Esperar a que termine la autenticación
    if (isLoadingAuth) {
      console.log("NuevoAnuncioPage: Esperando autenticación para crear draft...");
      return;
    }

    // Extraer provincia y localidad correctamente
    const userProvincia = currentUser?.localidad?.provinciaNombre;
    const userLocalidad = currentUser?.localidad?.nombre;

    // Validar campos esenciales
    if (
      !planId ||
      !campaniaId ||
      selectedScreensCount === null ||
      !creatorId ||
      !userProvincia ||
      !userLocalidad
    ) {
      console.warn(
        "NuevoAnuncioPage: Faltan datos esenciales (plan, campaña, screens, creator, ubicación). Redirigiendo a /planes."
      );
      router.replace("/planes");
      return;
    }

    // Marcar que vamos a crear
    draftCreationAttemptedRef.current = true;
    setIsCreatingDraft(true);

    (async () => {
      try {
        const planSeleccionado = planes.find((p) => p.id === planId)!;
        const campaniaSeleccionada = campanias.find((c) => c.id === campaniaId)!;

        const screensToInitialize = Math.min(
          selectedScreensCount,
          planSeleccionado.maxImages
        );

        const datosAnuncioDraft: Omit<Anuncio, "id" | "createdAt" | "updatedAt"> = {
          creatorId,
          plan: planId,
          campaniaId,
          campaignDurationDays: campaniaSeleccionada.months * 30,
          maxScreens: screensToInitialize,
          status: "draft",
          provincia: userProvincia,
          localidad: userLocalidad,
          elementosPorPantalla: {},
        };

        const newAnuncioId = await createDraftAnuncio(datosAnuncioDraft);
        console.log("NuevoAnuncioPage: Borrador creado con ID:", newAnuncioId);

        initialize(screensToInitialize);
        setCurrentAnuncioId(newAnuncioId);
        // redirige al editor del borrador recién creado
        router.replace(`/editor/${newAnuncioId}`);
      } catch (err: unknown) {
        console.error("Error CRÍTICO al crear el borrador:", err);
        alert(
          `Error al iniciar el anuncio: ${
            err instanceof Error ? err.message : "Error desconocido"
          }`
        );
        draftCreationAttemptedRef.current = false;
        setIsCreatingDraft(false);
        router.replace("/planes");
      }
    })();
  }, [
    isLoadingAuth,
    planId,
    campaniaId,
    selectedScreensCount,
    creatorId,
    currentUser, // para recálculo de provincia/localidad
    router,
    initialize,
  ]);

 
  // Effect for frozenCanvasDimensions (SE MANTIENE IGUAL, NO SE ALTERA)
  ReactUseEffect(() => { //
    // ... (sin cambios en esta lógica) ...
        let animationFrameId: number; //
    const updateDimensions = () => { //
      const stageNode = stageRef.current; //
      if (stageNode && stageNode.width() > 0 && stageNode.height() > 0) { //
        setFrozenCanvasDimensions(prevDims => { //
          if (!prevDims || prevDims.width !== stageNode.width() || prevDims.height !== stageNode.height()) { //
            return { width: stageNode.width(), height: stageNode.height() }; //
          }
          return prevDims; //
        });
      } else { //
        setFrozenCanvasDimensions(prevDims => (prevDims === null ? null : null)); //
      }
    };
    if (activeTool === 'effects') { //
      updateDimensions(); //
      animationFrameId = requestAnimationFrame(updateDimensions); //
    } else { //
      setFrozenCanvasDimensions(null); //
    }
    return () => { //
      if (animationFrameId) cancelAnimationFrame(animationFrameId); //
    };
  }, [activeTool, stageRef]); //


  // --- Handlers (Lógica existente, se mantiene igual) ---
  const handleSelectTool = useCallback((tool: ToolId | null) => { //
    // ... (sin cambios) ...
        if (tool !== activeTool && selectedElementId) { //
      setSelectedElementForEdit(null); //
    }
    setActiveTool(prev => (prev === tool && tool !== 'effects' ? null : tool)); //
  }, [activeTool, selectedElementId, setSelectedElementForEdit]); //

  const handleCloseTool = useCallback(() => { //
    // ... (sin cambios) ...
        setActiveTool(null); //
    if (selectedElementId) { //
      setSelectedElementForEdit(null); //
    }
  }, [selectedElementId, setSelectedElementForEdit]); //

  const handleConfirmEditOrAddElement = useCallback((elementData: Omit<EditorElement, 'id' | 'tipo'> & { tipo: EditorElement['tipo'] }) => { //
    // ... (sin cambios) ...
        if (selectedElementId) { //
      const { tipo: _tipoIgnorado, ...propsToUpdate } = elementData; //
      updateElement(selectedElementId, propsToUpdate); //
    } else { //
      addElement(elementData as Omit<EditorElement, 'id'>); //
    }
    handleCloseTool(); //
  }, [selectedElementId, updateElement, addElement, handleCloseTool]); //

  // --- procesarYGuardarPantallaActual (Lógica existente, se mantiene igual) ---
  const procesarYGuardarPantallaActual = useCallback(async (_esUltima: boolean = false): Promise<void> => { //
    // ... (sin cambios, solo asegurar que currentAnuncioId se usa correctamente) ...
        if (!currentAnuncioId || !stageRef.current || !planId || !campaniaId || !creatorId) { //
      alert("Error interno: Faltan datos para procesar la pantalla. Intenta recargar."); //
      setIsProcessingScreen(false); //
      throw new Error("Datos críticos faltantes para procesar pantalla."); //
    }
    setIsProcessingScreen(true); //

    let newStorageImageUrl = ''; //
    try { //
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 }); //
      const imageBlob = await dataURLtoBlob(dataUrl); //
      const imagePath = `capturas_anuncios/${currentAnuncioId}/screen_${currentScreenIndex}_${Date.now()}.jpg`; //
      newStorageImageUrl = await uploadFileAndGetURL(imageBlob, imagePath); //

      const currentElements = useEditorStore.getState().elementsByScreen[currentScreenIndex] || []; //
      const animationEffectForScreen = useEditorStore.getState().animationEffectsByScreen[currentScreenIndex]; //
      const campaniaSel = campanias.find(c => c.id === campaniaId); //
      if (!campaniaSel) throw new Error("Configuración de campaña no encontrada."); //
      const planSel = planes.find(p => p.id === planId); //
      if (!planSel) throw new Error("Configuración de plan no encontrada."); //

      const totalExposure = planSel.durationSeconds; //
      const durationSeconds = editorScreensCount > 0 ? totalExposure / editorScreensCount : totalExposure; //

      const capturaDataPayload: Omit<Captura, 'createdAt' | 'screenIndex'> & { screenIndex: number } = { //
        imageUrl: newStorageImageUrl, //
        screenIndex: currentScreenIndex, //
        plan: planId, //
        campaignDurationDays: campaniaSel.months * 30, //
        provincia: userProvincia as string, // Asegurar que es string, o manejar si es undefined
        localidad: userLocalidad as string, // Asegurar que es string, o manejar si es undefined
        animationEffect: animationEffectForScreen, //
        durationSeconds, //
        totalExposure, //
      };
      
      const existingCapturaInfo = await getCapturaByScreenIndex(currentAnuncioId, currentScreenIndex); //
      if (existingCapturaInfo) { //
        const oldImageUrlToDelete = existingCapturaInfo.data.imageUrl; //
        const { screenIndex: _idx, ...dataToUpdate } = capturaDataPayload; //
        await updateCaptura(currentAnuncioId, existingCapturaInfo.id, dataToUpdate); //
        if (oldImageUrlToDelete && oldImageUrlToDelete !== newStorageImageUrl) { //
            // Idealmente, el borrado de la imagen antigua se haría tras confirmar que la nueva se usa.
            // deleteFileByUrl(oldImageUrlToDelete).catch(...); // Tu lógica de borrado
        }
      } else { //
        await addCaptura(currentAnuncioId, capturaDataPayload); //
      }

      const elementosParaDb: Elemento[] = currentElements.map(({ id: _id, ...rest }: EditorElement) => rest as Elemento); //
      elementosGuardadosRef.current = { //
        ...elementosGuardadosRef.current, //
        [String(currentScreenIndex)]: elementosParaDb, //
      };
    } catch (err: unknown) { //
      // ... (tu manejo de error) ...
      if (newStorageImageUrl) { /* Intenta borrar newStorageImageUrl si algo falló */ } //
      throw err; // Re-lanzar para que la función que llama sepa del error
    } finally { //
      setIsProcessingScreen(false); //
    }
  }, [
    currentAnuncioId, currentScreenIndex, editorScreensCount, planId, campaniaId, creatorId,
    userProvincia, userLocalidad
  ]); //


  // --- handleNextScreen, handlePrevScreen (Lógica existente, se mantiene igual) ---
  const handleNextScreen = useCallback(async () => { //
    // ... (sin cambios) ...
        if (!currentAnuncioId || isProcessingScreen) return; //
    if (currentScreenIndex >= editorScreensCount - 1 && selectedElementId) { //
        setSelectedElementForEdit(null); //
    }
    if (activeTool) handleCloseTool(); //

    const esUltimaPantalla = currentScreenIndex >= editorScreensCount - 1; //
    try { //
      await procesarYGuardarPantallaActual(esUltimaPantalla); //
      if (esUltimaPantalla) { // Quitamos isMountedRef.current, el componente no se desmonta aquí
        setShowFinalizarModal(true); //
      } else if (!esUltimaPantalla) { //
        goToNextScreenInStore(); //
      }
    } catch (err: unknown) { //
      // El error ya se alerta en procesarYGuardarPantallaActual
      console.error("Error en handleNextScreen:", err);
    }
  }, [
    currentAnuncioId, isProcessingScreen, currentScreenIndex, editorScreensCount,
    activeTool, handleCloseTool, procesarYGuardarPantallaActual, goToNextScreenInStore,
    selectedElementId, setSelectedElementForEdit
  ]); //

  const handlePrevScreen = useCallback(() => { //
    // ... (sin cambios) ...
        if (!isProcessingScreen) { //
      if (activeTool) setActiveTool(null); //
      if (selectedElementId) setSelectedElementForEdit(null); //
      goToPrevScreenInStore(); //
    }
  }, [isProcessingScreen, activeTool, selectedElementId, setSelectedElementForEdit, goToPrevScreenInStore]); //


  // --- handleFinalizarCreacion (Lógica existente, se mantiene igual) ---
  const handleFinalizarCreacion = useCallback(async () => { //
    // ... (sin cambios) ...
        if (!currentAnuncioId || isProcessingScreen) return; //
    setShowFinalizarModal(false); //
    setIsProcessingScreen(true); //
    try { //
      await procesarYGuardarPantallaActual(true); // Guardar la última pantalla //
      await updateAnuncioService(currentAnuncioId, { //
        elementosPorPantalla: elementosGuardadosRef.current, //
        status: 'pendingPayment', //
      });
      alert('¡Anuncio creado y guardado con éxito! Serás redirigido a la previsualización.'); //
      router.push(`/preview/${currentAnuncioId}`); //
    } catch (err: unknown) { //
      // El error ya debería ser manejado por procesarYGuardarPantallaActual si ocurrió allí.
      // Si el error es en updateAnuncioService:
      if (!(err instanceof Error && err.message.includes("guardar la pantalla"))) { //
         alert(`Error CRÍTICO al finalizar el anuncio: ${(err instanceof Error) ? err.message : 'Error desconocido.'}`); //
      }
    } finally { //
      setIsProcessingScreen(false); //
    }
  }, [currentAnuncioId, isProcessingScreen, procesarYGuardarPantallaActual, router]); //

  // --- handlePreviewClick (Lógica existente, se mantiene igual) ---
  const handlePreviewClick = useCallback(() => { //
    // ... (sin cambios) ...
        if (isProcessingScreen) return; //
    if (selectedElementId) setSelectedElementForEdit(null); //
    if (activeTool) setActiveTool(null); //

    if (currentScreenIndex >= editorScreensCount - 1 && editorScreensCount > 0) { //
        handleNextScreen(); // Para guardar la última pantalla y mostrar modal de finalizar //
    } else { //
        alert('Por favor, completa el diseño de todas las pantallas antes de finalizar.'); //
    }
  }, [
    isProcessingScreen, currentScreenIndex, editorScreensCount,
    selectedElementId, setSelectedElementForEdit, activeTool, handleNextScreen
  ]); //


  // --- NUEVA LÓGICA PARA EL MODAL DE SALIDA (se mantiene pero se adapta) ---
  const handleOpenExitModal = useCallback(() => { //
    if (currentAnuncioId) { //
      setShowExitModal(true); //
    } else { //
      const confirmExitSinGuardar = confirm("No has guardado nada aún. Si sales, perderás la configuración actual. ¿Deseas salir?"); //
      if (confirmExitSinGuardar) { //
        resetAnuncioStore(); //
        resetEditorStore(); //
        router.push('/bienvenida'); //
      }
    }
  }, [currentAnuncioId, router, resetAnuncioStore, resetEditorStore]); //

  const handleConfirmExitAction = useCallback(async (action: 'saveAndExit' | 'deleteAndExit') => { //
    // ... (sin cambios) ...
        if (!currentAnuncioId) { //
      setShowExitModal(false); //
      return; //
    }

    setIsProcessingExit(true); //
    setShowExitModal(false); //

    if (action === 'saveAndExit') { //
      try { //
        await procesarYGuardarPantallaActual(currentScreenIndex >= editorScreensCount - 1); //
        console.log(`NuevoAnuncioPage: Borrador ${currentAnuncioId} guardado antes de salir.`); //
        router.push('/mis-anuncios'); // O a la página de bienvenida/dashboard //
      } catch (error) { //
        console.error("Error al guardar el borrador antes de salir:", error); //
        alert("No se pudo guardar el progreso antes de salir. Intenta de nuevo o elimina el borrador."); //
      } finally { //
        setIsProcessingExit(false); //
      }
    } else if (action === 'deleteAndExit') { //
      const confirmDelete = window.confirm("¡Atención! Estás a punto de eliminar este borrador de forma permanente. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?"); //
      if (confirmDelete) { //
        try { //
          await deleteAnuncio(currentAnuncioId); //
          console.log(`NuevoAnuncioPage: Borrador ${currentAnuncioId} eliminado.`); //
          resetAnuncioStore(); //
          resetEditorStore(); //
          router.push('/bienvenida'); // O a donde deba ir tras eliminar //
        } catch (error) { //
          console.error("Error al eliminar el borrador:", error); //
          alert(`No se pudo eliminar el borrador: ${error instanceof Error ? error.message : "Error desconocido"}`); //
        } finally { //
          setIsProcessingExit(false); //
        }
      } else { //
        setIsProcessingExit(false); // No se confirmó la eliminación //
      }
    }
  }, [currentAnuncioId, procesarYGuardarPantallaActual, editorScreensCount, currentScreenIndex, router, resetAnuncioStore, resetEditorStore]); //


  // --- Render Logic ---
  // Loader principal mientras se crea el borrador o se verifica la autenticación
  if (isLoadingAuth || isCreatingDraft || !currentAnuncioId) { //
    let message = 'Verificando autenticación...'; //
    if (!isLoadingAuth && isCreatingDraft) { //
        message = 'Iniciando editor y creando borrador...';
    } else if (!isLoadingAuth && !isCreatingDraft && !currentAnuncioId && draftCreationAttemptedRef.current) { //
        // Esta condición indica un fallo en la creación del draft después del intento.
        return (
            <div className="flex flex-col items-center justify-center h-screen text-red-500 p-4">
                <p className="text-lg mb-2">Error: No se pudo iniciar correctamente el anuncio.</p>
                <p className="text-sm mb-4">Hubo un problema al crear el borrador inicial. Por favor, intenta de nuevo.</p>
                <Button onClick={() => router.replace('/planes')}>Volver a Selección de Planes</Button>
            </div>
        );
    } else if (!isLoadingAuth && !planId) { // Si no hay planId, es una condición de error previa
        message = 'Cargando configuración del anuncio...'; //
    }
    return <div className="flex items-center justify-center h-screen"><BlurLoader loading={true} /><p className='ml-4'>{message}</p></div>; //
  }

  // --- renderActiveTool (Lógica existente, se mantiene igual) ---
  const renderActiveTool = () => {
    // Busca el elemento seleccionado actualmente en el store
    const elementToEdit = selectedElementId
      ? elementsOfCurrentScreen.find((el: EditorElement) => el.id === selectedElementId)
      : undefined;

    // Condición prioritaria: si hay un elemento seleccionado y es un fondo de imagen,
    // se muestra la herramienta para editar el color del marco.
    if (elementToEdit && elementToEdit.tipo === 'fondoImagen') {
      return (
        <FrameColorTool
          key={`frame-tool-${elementToEdit.id}`}
          element={elementToEdit}
          onClose={handleCloseTool}
        />
      );
    }

    // Si no hay ninguna herramienta activa seleccionada desde la barra lateral, no se muestra nada.
    if (!activeTool) return null;

    // Si hay una herramienta activa, se muestra el panel correspondiente.
    // Esto se usa principalmente para AÑADIR nuevos elementos.
    switch (activeTool) {
      case 'text':
        return ( <TextTool key={selectedElementId || 'new-text'} initial={elementToEdit?.tipo === 'texto' ? elementToEdit as TextElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'curvedText':
        return ( <CurvedTextTool key={selectedElementId || 'new-curvedtext'} initial={elementToEdit?.tipo === 'textoCurvo' ? elementToEdit as CurvedTextElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'color':
        return ( <ColorTool key={'tool-color'} initial={elementToEdit?.tipo === 'fondoColor' ? elementToEdit as ColorBackgroundElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'imageBackground':
        // Esta herramienta ahora solo se mostrará para AÑADIR un nuevo fondo,
        // ya que la edición (clic en el marco) es manejada por la condición de arriba.
        return ( <ImageBackgroundTool key={'tool-imageBg'} initial={undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'gradient':
        return ( <GradientBackgroundTool key={'tool-gradient'} initial={elementToEdit?.tipo === 'gradient' ? elementToEdit as GradientBackgroundElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'subimage':
        return ( <SubimageTool key={selectedElementId || 'new-subimage'} initial={elementToEdit?.tipo === 'subimagen' ? elementToEdit as SubimageElement : undefined} onConfirm={handleConfirmEditOrAddElement} onClose={handleCloseTool} /> );
      case 'effects': {
        if (frozenCanvasDimensions && frozenCanvasDimensions.width > 0 && frozenCanvasDimensions.height > 0) {
          return ( <AdvancedEffectsToolDynamic elementsForPreview={elementsOfCurrentScreen}  baseCanvasWidth={frozenCanvasDimensions.width} baseCanvasHeight={frozenCanvasDimensions.height} onClose={handleCloseTool} /> );
        } else {
          return ( <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50"> <p className="text-white p-4 bg-gray-800 rounded-md"> Preparando previsualización de efectos... </p> </div> );
        }
      }
      default:
        return null;
    }
  };

  return (
    <div className="editor-page-layout flex flex-col h-screen bg-[var(--color-fondo)]">
      <Toolbar
        activeTool={activeTool} //
        onSelectTool={handleSelectTool} //
        onPrev={handlePrevScreen} //
        onNext={handleNextScreen} //
        onPreview={handlePreviewClick} // Este es el botón de "Finalizar" en tu Toolbar.tsx //
        isLastScreen={currentScreenIndex >= editorScreensCount - 1 && editorScreensCount > 0} //
        currentScreen={currentScreenIndex + 1} //
        totalScreens={editorScreensCount} //
        disabled={isProcessingScreen || isCreatingDraft || !!activeTool || isProcessingExit} //
        onExitEditor={handleOpenExitModal} //
        showExitEditorButton={true} //
      />
      <main className="editor-main-content flex-grow overflow-hidden">
        <div className="editor-canvas-container">
          <div className="editor-canvas-wrapper relative">
            {/* Renderizar EditorCanvas solo si ya tenemos un currentAnuncioId */}
            {currentAnuncioId && <EditorCanvas ref={stageRef} />} {/* */}
            <BlurLoader loading={isProcessingScreen || isCreatingDraft || isProcessingExit} /> {/* */}
          </div>
        </div>
      </main>

      {renderActiveTool()}

      {/* Modal de Finalizar Creación (existente) */}
      {showFinalizarModal && ( //
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-texto-principal)]">Finalizar Creación</h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              Has completado el diseño de todas las pantallas ({editorScreensCount}). ¿Deseas finalizar y guardar el anuncio? {/* */}
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowFinalizarModal(false)} disabled={isProcessingScreen || isProcessingExit}> {/* */}
                Seguir Editando
              </Button>
              <Button variant="primary" onClick={handleFinalizarCreacion} disabled={isProcessingScreen || isProcessingExit}> {/* */}
                {isProcessingScreen ? 'Guardando...' : 'Sí, Finalizar y Guardar'} {/* */}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE SALIDA DEL EDITOR --- */}
      {showExitModal && currentAnuncioId && ( //
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"> {/* z-index alto */} {/* */}
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-texto-principal)]">Salir del Editor</h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              ¿Qué deseas hacer con el borrador actual de tu anuncio?
            </p>
            <div className="flex flex-col space-y-3">
              <Button
                variant="primary" //
                onClick={() => handleConfirmExitAction('saveAndExit')} //
                disabled={isProcessingExit || isProcessingScreen} //
                className="w-full" //
              >
                {isProcessingExit && !isProcessingScreen ? 'Guardando y Saliendo...' : 'Guardar Borrador y Salir'} {/* */}
              </Button>
              <Button
                variant="danger" // Asumiendo que tienes una variante "danger" o usa "secondary" y píntalo de rojo //
                onClick={() => handleConfirmExitAction('deleteAndExit')} //
                disabled={isProcessingExit || isProcessingScreen} //
                className="w-full" // bg-red-600 hover:bg-red-700 text-white (si no hay variante danger) //
              >
                {isProcessingExit && !isProcessingScreen ? 'Eliminando...' : 'Eliminar Borrador y Salir'} {/* */}
              </Button>
              <Button
                variant="secondary" //
                onClick={() => setShowExitModal(false)} //
                disabled={isProcessingExit || isProcessingScreen} //
                className="w-full mt-2" //
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