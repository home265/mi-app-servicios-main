// src/app/(ads)/editor/components/EditorConCarga.tsx
'use client';

import React, {
  useEffect as ReactUseEffect,
  useState,
  useRef,
  useMemo,
  useCallback
} from 'react';
import Konva from 'konva'; //
import { useRouter } from 'next/navigation'; //
import dynamic from 'next/dynamic'; //

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
} from '../hooks/useEditorStore'; //
import {
  updateAnuncio as updateAnuncioService,
  getCapturaByScreenIndex,
  addCaptura,
  updateCaptura as updateCapturaService,
  deleteAnuncio,
} from '@/lib/services/anunciosService'; //
import {
  uploadFileAndGetURL,
  deleteFileByUrl
} from '@/lib/firebase/storage'; //
import type { Elemento, ReelAnimationEffectType, Anuncio, Captura } from '@/types/anuncio'; //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useUserStore } from '@/store/userStore'; //
import { useAnuncioStore } from '@/store/anuncioStore'; //
import { planes, campanias } from '@/lib/constants/anuncios'; //

import EditorCanvas from './EditorCanvas'; //
import Toolbar, { type ToolId } from './Toolbar'; //
import Button from '@/app/components/ui/Button'; //
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

interface EditorConCargaProps { //
  anuncioParaCargar: { //
    id: string; //
    maxScreens: number; //
    elementosPorPantalla: Record<string, Elemento[]>; //
    animationEffectsPorPantalla?: Record<string, ReelAnimationEffectType | undefined>; //
    status: Anuncio['status']; //
    startDate?: Date; //
    endDate?: Date; //
    plan: Anuncio['plan']; //
    campaniaId?: Anuncio['campaniaId']; //
    provincia: string; //
    localidad: string; //
  };
}

// Define una referencia estable para arrays vacíos fuera del componente
const EMPTY_ARRAY_EDITOR_ELEMENTS: EditorElement[] = [];

export default function EditorConCarga({ anuncioParaCargar }: EditorConCargaProps) { //
  const router = useRouter(); //

  const [showExitModal, setShowExitModal] = useState<boolean>(false); //
  const [isProcessingExit, setIsProcessingExit] = useState<boolean>(false); //

  // ** MODIFICADO: Obtener acciones y estado del store usando el hook selector donde sea reactivo **
  // Acciones (generalmente estables, se pueden obtener una vez o con selector si es necesario)
  const {
    loadAnuncioData,
    resetEditor: resetEditorStore,
    addElement,
    updateElement,
    setSelectedElementForEdit,
    nextScreen, // Renombrado de nextScreen en el store a nextScreenAction
    prevScreen, // Renombrado de prevScreen en el store a prevScreenAction
  } = useEditorStore.getState(); // Para acciones, getState() es a menudo OK.

  // Estado reactivo del store (el componente se re-renderizará si estos cambian)
  const currentScreenIndex = useEditorStore(state => state.currentScreenIndex); //
  const screensCount = useEditorStore(state => state.screensCount); //
  const selectedElementId = useEditorStore(state => state.selectedElementIdForEdit); //
  const elementsByScreenFromStore = useEditorStore(state => state.elementsByScreen); //
  const animationEffectsByScreenFromStore = useEditorStore(state => state.animationEffectsByScreen); //
  const durationsByScreenFromStore = useEditorStore(state => state.durationsByScreen); //

  const elementsOfCurrentScreen = useMemo(() => { //
    return elementsByScreenFromStore[currentScreenIndex] || EMPTY_ARRAY_EDITOR_ELEMENTS;
  }, [elementsByScreenFromStore, currentScreenIndex]);

  const resetAnuncioConfigStore = useAnuncioStore(state => state.reset); //

  const [isEditorInitialized, setIsEditorInitialized] = useState(false); //
  const [isLoadingSave, setIsLoadingSave] = useState(false); //
  const [activeTool, setActiveTool] = useState<ToolId | null>(null); //
  const [showGuardarModal, setShowGuardarModal] = useState(false); //
  const [frozenCanvasDimensions, setFrozenCanvasDimensions] = useState<{ //
    width: number; //
    height: number; //
  } | null>(null); //
  const stageRef = useRef<Konva.Stage>(null); //


  ReactUseEffect(() => { //
    // resetEditorStore y loadAnuncioData son estables porque son acciones del store de Zustand.
    // anuncioParaCargar es una prop, por lo que es correcto tenerla como dependencia.
    resetEditorStore(); //
    const dataToLoad: AnuncioDataToLoad = { //
      screensCount: anuncioParaCargar.maxScreens, //
      elementsByScreenFromDb: anuncioParaCargar.elementosPorPantalla, //
      animationEffectsFromDb: anuncioParaCargar.animationEffectsPorPantalla, //
    };
    loadAnuncioData(dataToLoad); //
    setIsEditorInitialized(true); //
  }, [anuncioParaCargar, resetEditorStore, loadAnuncioData]); //

  ReactUseEffect(() => { //
    // setSelectedElementForEdit es una acción estable del store.
    // elementsOfCurrentScreen está memoizado y depende de datos reactivos del store.
    if (selectedElementId) { //
      const elementToEdit = elementsOfCurrentScreen.find(el => el.id === selectedElementId); //
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
        if (toolToOpen && activeTool !== toolToOpen) { // Solo cambiar si es diferente
             setActiveTool(toolToOpen); //
        } else if (!toolToOpen && selectedElementId !== null) { // Si no hay herramienta para el tipo, deseleccionar
             setSelectedElementForEdit(null); //
        }
      } else if (selectedElementId !== null) { // Si el ID seleccionado no se encuentra en los elementos actuales
        setSelectedElementForEdit(null); //
        if (activeTool !== null) setActiveTool(null); //
      }
    } else { // Si no hay selectedElementId, y hay una herramienta activa (que no sea 'effects'), cerrarla.
        if (activeTool !== null && activeTool !== 'effects') {
            setActiveTool(null);
        }
    }
  }, [selectedElementId, elementsOfCurrentScreen, setSelectedElementForEdit, activeTool]); // Añadido activeTool
  
  ReactUseEffect(() => { //
    // ... (Lógica de frozenCanvasDimensions sin cambios, parece correcta)
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

  const handleSelectTool = useCallback((tool: ToolId | null) => { //
    // setSelectedElementForEdit es estable (acción del store)
    if (tool !== activeTool && selectedElementId) { //
      setSelectedElementForEdit(null); //
    }
    setActiveTool(prev => (prev === tool && tool !== 'effects' ? null : tool)); //
  },[activeTool, selectedElementId, setSelectedElementForEdit]); //

  const handleCloseTool = useCallback(() => { //
    // setSelectedElementForEdit es estable
    setActiveTool(null); //
    if (selectedElementId) { //
      setSelectedElementForEdit(null); //
    }
  }, [selectedElementId, setSelectedElementForEdit]); //

  const handleConfirmEditOrAddElement = useCallback((elementData: Omit<EditorElement, 'id' | 'tipo'> & { tipo: EditorElement['tipo'] }) => { //
    // updateElement y addElement son estables
    if (selectedElementId) { //
      const { tipo, ...propsToUpdate } = elementData; //
      updateElement(selectedElementId, propsToUpdate); //
    } else { //
      addElement(elementData as Omit<EditorElement, 'id'>); //
    }
    handleCloseTool(); //
  }, [selectedElementId, updateElement, addElement, handleCloseTool]); //

  const handleSaveAnuncio = useCallback(async () => { //
    // ... (lógica sin cambios significativos, solo asegurar que las dependencias son correctas y estables)
    // Las dependencias aquí son cruciales.
    // anuncioParaCargar.*, currentScreenIndex, elementsByScreenFromStore, etc. son reactivas.
    // Si alguna de estas cambia, el useCallback se re-crea.
    // Si se obtienen con getState() dentro del callback, podrían ser "stale".
    // El uso de props del componente (anuncioParaCargar) y estado del store (obtenido con hooks) es preferible.
    setIsLoadingSave(true); //
    setShowGuardarModal(false); //

    if (activeTool) setActiveTool(null); //
    if (selectedElementId) setSelectedElementForEdit(null); //

    if (!stageRef.current) { //
      alert("Error: Referencia al canvas no encontrada."); //
      setIsLoadingSave(false); //
      return; //
    }

    const anuncioId = anuncioParaCargar.id; //
    const planSeleccionado = planes.find(p => p.id === anuncioParaCargar.plan); //
    const campaniaSeleccionada = anuncioParaCargar.campaniaId ? campanias.find(c => c.id === anuncioParaCargar.campaniaId) : undefined; //

    if (!planSeleccionado) { //
        alert("Error: Datos del plan no encontrados para este anuncio."); //
        setIsLoadingSave(false); //
        return; //
    }
    const campaignDurationDays = campaniaSeleccionada //
        ? campaniaSeleccionada.months * 30 //
        : anuncioParaCargar.maxScreens * (planSeleccionado.durationSeconds / anuncioParaCargar.maxScreens); //

    let newStorageImageUrl = ''; //
    let oldImageUrlToDelete: string | null | undefined = null; //

    try { //
      const dataUrl = stageRef.current.toDataURL({ mimeType: 'image/jpeg', quality: 0.8 }); //
      const imageBlob = await dataURLtoBlob(dataUrl); //
      const imagePath = `capturas_anuncios/${anuncioId}/screen_${currentScreenIndex}_${Date.now()}.jpg`; //
      
      newStorageImageUrl = await uploadFileAndGetURL(imageBlob, imagePath); //
      const animationEffectForScreen = animationEffectsByScreenFromStore[currentScreenIndex]; //
      const storeDurationForScreen = durationsByScreenFromStore[currentScreenIndex]; //
      let durationSecondsCalc: number; //
      let totalExposureCalc: number; //

      if (typeof storeDurationForScreen === 'number' && storeDurationForScreen > 0) { //
          durationSecondsCalc = storeDurationForScreen; //
          totalExposureCalc = screensCount * storeDurationForScreen;  //
      } else { //
          totalExposureCalc = planSeleccionado.durationSeconds; //
          durationSecondsCalc = screensCount > 0 ? totalExposureCalc / screensCount : totalExposureCalc; //
      }

      const capturaDataPayload: Omit<Captura, 'createdAt' | 'screenIndex'> & { screenIndex: number } = { //
        imageUrl: newStorageImageUrl, //
        screenIndex: currentScreenIndex, //
        plan: anuncioParaCargar.plan, //
        campaignDurationDays: campaignDurationDays, //
        provincia: anuncioParaCargar.provincia, //
        localidad: anuncioParaCargar.localidad, //
        animationEffect: animationEffectForScreen, //
        durationSeconds: durationSecondsCalc, //
        totalExposure: totalExposureCalc, //
      };

      const existingCapturaInfo = await getCapturaByScreenIndex(anuncioId, currentScreenIndex); //

      if (existingCapturaInfo) { //
        oldImageUrlToDelete = existingCapturaInfo.data.imageUrl; //
        const { screenIndex: _idx, ...dataToUpdate } = capturaDataPayload; //
        await updateCapturaService(anuncioId, existingCapturaInfo.id, dataToUpdate); //
        if (oldImageUrlToDelete && oldImageUrlToDelete !== newStorageImageUrl) { //
          deleteFileByUrl(oldImageUrlToDelete).catch(err => console.error( //
            `EditorConCarga: Error ASÍNCRONO borrando imagen antigua ${oldImageUrlToDelete}:`, err));
        }
      } else { //
        await addCaptura(anuncioId, capturaDataPayload); //
      }

      const todasLasPantallasDelStore = elementsByScreenFromStore; //
      const elementosParaGuardarEnAnuncio: Record<string, Elemento[]> = {}; //
      for (let i = 0; i < screensCount; i++) { //
          const screenEditorElements = todasLasPantallasDelStore[i] || []; //
          elementosParaGuardarEnAnuncio[String(i)] = screenEditorElements.map(editorEl => { //
              const { id: _id, ...restOfElemento } = editorEl; // Quitar el id del elemento del editor //
              return restOfElemento as Elemento; // Asegurar que el tipo es Elemento (sin id de editor) //
          });
      }
    
      await updateAnuncioService(anuncioId, { //
        elementosPorPantalla: elementosParaGuardarEnAnuncio, //
        // updatedAt se actualiza automáticamente en updateAnuncioService
      });

      alert('Pantalla guardada con éxito.');  //
    } catch (error) { //
      console.error('Error al procesar y guardar la captura o el anuncio:', error); //
      alert(`Error al guardar: ${(error instanceof Error) ? error.message : 'Error desconocido.'}`); //
      if (newStorageImageUrl) {  //
        deleteFileByUrl(newStorageImageUrl).catch(delErr => console.error('Error adicional borrando imagen nueva tras fallo:', delErr)); //
      }
    } finally { //
      setIsLoadingSave(false); //
    }
  }, [
    // Lista de dependencias original, ajustada para usar los valores reactivos del store
    activeTool, selectedElementId, setSelectedElementForEdit, 
    anuncioParaCargar, // anuncioParaCargar es un objeto, si alguna de sus props cambia, esta función se re-crea
    currentScreenIndex, 
    animationEffectsByScreenFromStore, // Valor reactivo del store
    durationsByScreenFromStore,       // Valor reactivo del store
    elementsByScreenFromStore,        // Valor reactivo del store
    screensCount                      // Valor reactivo del store
]);


  const handlePreviewAnuncio = useCallback(() => { //
    // ... (sin cambios)
        if (anuncioParaCargar && anuncioParaCargar.id) { //
      router.push(`/preview/${anuncioParaCargar.id}`); //
    } else { //
      console.error("Error: No se pudo obtener el ID del anuncio para la previsualización."); //
      alert("Error al intentar previsualizar: ID del anuncio no encontrado."); //
    }
  }, [anuncioParaCargar, router]); //

  const handleOpenExitModal = useCallback(() => { //
    setShowExitModal(true); //
  }, []); //

  const handleChangePlanCampania = useCallback(() => { //
    // ... (sin cambios)
        if (anuncioParaCargar.status === 'draft') { //
      const confirmChange = window.confirm("Serás redirigido para cambiar el plan/campaña de tu borrador. ¿Estás seguro? Los cambios no guardados en la pantalla actual podrían perderse."); //
      if (confirmChange) { //
        router.push(`/planes?borradorId=${anuncioParaCargar.id}`); //
      }
    } else { //
      alert("Solo puedes cambiar el plan/campaña de anuncios en estado 'borrador'."); //
    }
  }, [router, anuncioParaCargar]); //

  const handleConfirmExitAction = useCallback(async (action: 'saveAndExit' | 'deleteAndExit') => { //
    // ... (sin cambios)
        const anuncioId = anuncioParaCargar.id; //

    setIsProcessingExit(true); //
    setShowExitModal(false); //

    if (action === 'saveAndExit') { //
      try { //
        await handleSaveAnuncio();  //
        console.log(`EditorConCarga: Borrador ${anuncioId} guardado antes de salir.`); //
        router.push('/mis-anuncios');  //
      } catch (error) { //
        console.error("Error al guardar el borrador antes de salir:", error); //
      } finally { //
        setIsProcessingExit(false); //
      }
    } else if (action === 'deleteAndExit') { //
      if (anuncioParaCargar.status !== 'draft') { //
        alert("Solo se pueden eliminar anuncios en estado 'borrador' desde esta opción."); //
        setIsProcessingExit(false); //
        return; //
      }
      const confirmDelete = window.confirm("¡Atención! Estás a punto de eliminar este borrador de forma permanente. Esta acción no se puede deshacer. ¿Estás absolutamente seguro?"); //
      if (confirmDelete) { //
        try { //
          await deleteAnuncio(anuncioId); //
          console.log(`EditorConCarga: Borrador ${anuncioId} eliminado.`); //
          resetAnuncioConfigStore(); //
          resetEditorStore();     //
          router.push('/mis-anuncios'); // O a bienvenida //
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
  }, [
    anuncioParaCargar, handleSaveAnuncio, router, 
    resetAnuncioConfigStore, resetEditorStore
  ]); //

  if (!isEditorInitialized || !anuncioParaCargar) { //
    return ( //
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" />
        <p className="ml-4 text-lg">Cargando editor...</p>
      </div>
    );
  }
  
  const renderActiveTool = () => { //
    // ... (sin cambios)
        const elementToEdit = selectedElementId //
      ? elementsOfCurrentScreen.find(el => el.id === selectedElementId) //
      : undefined; //

    if (!activeTool && !selectedElementId) return null; //
    if (!activeTool && selectedElementId) return null;  //

    switch (activeTool) { //
      case 'text': //
        return <TextTool //
                  key={selectedElementId || 'edit-text'} //
                  initial={elementToEdit?.tipo === 'texto' ? elementToEdit as TextElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'curvedText': //
        return <CurvedTextTool //
                  key={selectedElementId || 'edit-curvedtext'} //
                  initial={elementToEdit?.tipo === 'textoCurvo' ? elementToEdit as CurvedTextElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'color': //
        return <ColorTool //
                  key={selectedElementId || 'edit-color'} //
                  initial={elementToEdit?.tipo === 'fondoColor' ? elementToEdit as ColorBackgroundElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'imageBackground': //
        return <ImageBackgroundTool //
                  key={selectedElementId || 'edit-imagebg'} //
                  initial={elementToEdit?.tipo === 'fondoImagen' ? elementToEdit as ImageBackgroundElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'gradient': //
        return <GradientBackgroundTool //
                  key={selectedElementId || 'edit-gradient'} //
                  initial={elementToEdit?.tipo === 'gradient' ? elementToEdit as GradientBackgroundElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'subimage': //
        return <SubimageTool //
                  key={selectedElementId || 'edit-subimage'} //
                  initial={elementToEdit?.tipo === 'subimagen' ? elementToEdit as SubimageElement : undefined} //
                  onConfirm={handleConfirmEditOrAddElement} //
                  onClose={handleCloseTool} />; //
      case 'effects': { //
        if (frozenCanvasDimensions && frozenCanvasDimensions.width > 0 && frozenCanvasDimensions.height > 0) { //
          return ( //
            <AdvancedEffectsToolDynamic //
              elementsForPreview={elementsOfCurrentScreen} //
              baseCanvasWidth={frozenCanvasDimensions.width} //
              baseCanvasHeight={frozenCanvasDimensions.height} //
              onClose={handleCloseTool} //
            />
          );
        } else { //
          return ( //
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
              <p className="text-white p-4 bg-gray-800 rounded-md">
                Preparando previsualización de efectos...
              </p>
            </div>
          );
        }
      }
      default: //
        return null; //
    }
  };

  const generalDisabledState = isLoadingSave || isProcessingExit || (!!selectedElementId && activeTool !== null && activeTool !== 'effects'); //

  return ( //
    <>
      <Toolbar //
        activeTool={activeTool} //
        onSelectTool={handleSelectTool} //
        onPrev={prevScreen} // Usa prevScreen directamente o tu alias si lo prefieres
        onNext={nextScreen} // Usa nextScreen directamente o tu alias si lo prefieres
        currentScreen={currentScreenIndex + 1} //
        totalScreens={screensCount} //
        disabled={generalDisabledState} //
        onExitEditor={handleOpenExitModal} //
        showExitEditorButton={true} //
        onChangePlanCampania={handleChangePlanCampania} //
        showChangePlanCampaniaButton={anuncioParaCargar.status === 'draft'} //
      />
      <main className="editor-main-content"> {/* */}
        <div className="editor-canvas-container"> {/* */}
          <div className="editor-canvas-wrapper"> {/* */}
            {isEditorInitialized && anuncioParaCargar && <EditorCanvas ref={stageRef} />} {/* */}
          </div>
        </div>
      </main>

      {renderActiveTool()}

      {/* Botón de Guardar Cambios de pantalla (existente) */} {/* */}
      <div className="fixed bottom-4 right-4 z-20">
        <Button variant="primary" onClick={() => setShowGuardarModal(true)} disabled={isLoadingSave || isProcessingExit}> {/* */}
          {isLoadingSave ? 'Guardando Pantalla...' : 'Guardar Pantalla'} {/* */}
        </Button>
      </div>

      {/* Botón Previsualizar Anuncio (existente) */} {/* */}
      <div className="fixed bottom-4 left-4 z-20">
        <Button  //
          variant="secondary" //
          onClick={handlePreviewAnuncio} //
          disabled={isLoadingSave || isProcessingExit} //
        >
          Previsualizar Anuncio
        </Button>
      </div>

      {/* Modal de Confirmación para Guardar Cambios de Pantalla (existente) */} {/* */}
      {showGuardarModal && ( //
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-[var(--color-texto-principal)]">
              Confirmar Cambios
            </h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              ¿Estás seguro de que deseas guardar los cambios realizados en esta pantalla ({currentScreenIndex + 1})? {/* */}
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="secondary" onClick={() => setShowGuardarModal(false)} disabled={isLoadingSave}> {/* */}
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleSaveAnuncio} disabled={isLoadingSave}> {/* */}
                {isLoadingSave ? 'Guardando...' : 'Sí, Guardar Pantalla'} {/* */}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Carga para guardado de pantalla (existente, renombrado isLoadingSave) */} {/* */}
      {isLoadingSave && ( //
        <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[55]"> {/* z-index ajustado */} {/* */}
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" /> {/* */}
          <p className="ml-4 text-lg text-white">Guardando pantalla...</p> {/* */}
        </div>
      )}

      {/* --- NUEVO MODAL DE SALIDA DEL EDITOR --- */} {/* */}
      {showExitModal && ( //
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]"> {/* z-index alto */} {/* */}
          <div className="bg-[var(--color-tarjeta)] p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4 text-[var(--color-texto-principal)]">Salir del Editor</h3>
            <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
              ¿Qué deseas hacer con este anuncio?
            </p>
            <div className="flex flex-col space-y-3">
              <Button //
                variant="primary" //
                onClick={() => handleConfirmExitAction('saveAndExit')} //
                disabled={isProcessingExit || isLoadingSave} //
                className="w-full" //
              >
                {isProcessingExit ? 'Guardando y Saliendo...' : 'Guardar Cambios y Salir'} {/* */}
              </Button>
              {anuncioParaCargar.status === 'draft' && ( // Solo mostrar opción de eliminar para borradores //
                <Button //
                  variant="danger"  //
                  onClick={() => handleConfirmExitAction('deleteAndExit')} //
                  disabled={isProcessingExit || isLoadingSave} //
                  className="w-full" //
                >
                  {isProcessingExit ? 'Eliminando...' : 'Eliminar Borrador y Salir'} {/* */}
                </Button>
              )}
              <Button //
                variant="secondary" //
                onClick={() => setShowExitModal(false)} //
                disabled={isProcessingExit || isLoadingSave} //
                className="w-full mt-2" //
              >
                Cancelar (Seguir Editando)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de carga para acciones de salida (nuevo) */} {/* */}
      {isProcessingExit && ( //
         <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-[65]">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primario rounded-full animate-spin" /> {/* */}
          <p className="ml-4 text-lg text-white">Procesando salida...</p> {/* */}
        </div>
      )}
    </>
  );
}