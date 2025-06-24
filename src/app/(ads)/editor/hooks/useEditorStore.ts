// src/app/(ads)/editor/hooks/useEditorStore.ts
import { create } from 'zustand';
import type { Elemento } from '@/types/anuncio';
import type { ReelAnimationEffectType } from '@/types/anuncio';

// --- TIPOS DE ELEMENTOS ---
interface BaseEditorProps {
  id: string;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}
export interface TextElement extends BaseEditorProps {
  tipo: 'texto';
  text: string;
  fontSizePct: number;
  fontFamily: string;
  color: string;
}
export interface CurvedTextElement extends BaseEditorProps {
  tipo: 'textoCurvo';
  text: string;
  fontSizePct: number;
  fontFamily: string;
  color: string;
  curvePath: string;
}
export interface ColorBackgroundElement extends BaseEditorProps {
  tipo: 'fondoColor';
  color: string;
}

// =================================================================
// === INICIO DEL CAMBIO ===========================================
// =================================================================
export interface ImageBackgroundElement extends BaseEditorProps {
  tipo: 'fondoImagen';
  src: string;
  /**
   * Color opcional para los marcos (letterboxing) cuando la imagen
   * no tiene la misma proporción que el lienzo.
   * @example '#000000'
   */
  frameColor?: string;
}
// ===============================================================
// === FIN DEL CAMBIO ==============================================
// ===============================================================

export interface SubimageElement extends BaseEditorProps {
  tipo: 'subimagen';
  src: string;
}
export interface GradientBackgroundElement extends BaseEditorProps {
  tipo: 'gradient';
  color1: string;
  color2: string;
  orientation: 'horizontal' | 'vertical' | 'diagonal' | 'radial';
}
export type EditorElement =
  | TextElement
  | CurvedTextElement
  | ColorBackgroundElement
  | ImageBackgroundElement
  | SubimageElement
  | GradientBackgroundElement;

// --- ANUNCIO DATA TO LOAD ---
export interface AnuncioDataToLoad {
  screensCount: number;
  elementsByScreenFromDb: Record<string, Elemento[]>;
  animationEffectsFromDb?: Record<string, ReelAnimationEffectType | undefined>;
}

// --- ESTADO DEL EDITOR (ZUSTAND) ---
interface EditorStoreState {
  screensCount: number;
  currentScreenIndex: number;
  elementsByScreen: Record<number, EditorElement[]>;
  animationEffectsByScreen: Record<number, ReelAnimationEffectType | undefined>;
  selectedElementIdForEdit: string | null;
  durationsByScreen: Record<number, number>;
  setDurationForScreen: (screenIndex: number, seconds: number) => void;

  initialize: (count: number) => void;
  resetEditor: () => void;
  loadAnuncioData: (data: AnuncioDataToLoad) => void;
  nextScreen: () => void;
  prevScreen: () => void;
  addElement: (element: Omit<EditorElement, 'id'>) => void;
  updateElement: (
    elementId: string,
    props: Partial<Omit<EditorElement, 'id' | 'tipo'>>
  ) => void;
  removeElement: (elementId: string) => void;
  setAnimationEffectForCurrentScreen: (effect?: ReelAnimationEffectType) => void;
  setSelectedElementForEdit: (elementId: string | null) => void;
}

// --- GENERADOR DE IDS ---
const generateClientSideId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// --- STORE IMPLEMENTATION ---
export const useEditorStore = create<EditorStoreState>((set, get) => {
  const backgroundElementTypes: Array<EditorElement['tipo']> = ['fondoColor', 'fondoImagen', 'gradient'];

  return {
    screensCount: 0,
    currentScreenIndex: 0,
    elementsByScreen: {},
    animationEffectsByScreen: {},
    selectedElementIdForEdit: null,
    durationsByScreen: {},

    setDurationForScreen: (screenIndex, seconds) =>
      set((state) => ({
        durationsByScreen: {
          ...state.durationsByScreen,
          [screenIndex]: seconds,
        },
      })),

    initialize: (count) => {
      const initialElementsMap: Record<number, EditorElement[]> = {};
      const initialAnimationEffectsMap: Record<number, ReelAnimationEffectType | undefined> = {};
      for (let i = 0; i < count; i++) {
        initialElementsMap[i] = [];
        initialAnimationEffectsMap[i] = 'none';
      }
      set({
        screensCount: count,
        currentScreenIndex: 0,
        elementsByScreen: initialElementsMap,
        animationEffectsByScreen: initialAnimationEffectsMap,
        selectedElementIdForEdit: null,
        durationsByScreen: {},
      });
    },

    resetEditor: () =>
      set({
        screensCount: 0,
        currentScreenIndex: 0,
        elementsByScreen: {},
        animationEffectsByScreen: {},
        selectedElementIdForEdit: null,
        durationsByScreen: {},
      }),

    loadAnuncioData: ({ screensCount, elementsByScreenFromDb, animationEffectsFromDb }) => {
      const newElementsMap: Record<number, EditorElement[]> = {};
      const newAnimationEffectsMap: Record<number, ReelAnimationEffectType | undefined> = {};

      for (let i = 0; i < screensCount; i++) {
        const rawElements = elementsByScreenFromDb[String(i)] || [];
        newElementsMap[i] = rawElements.map(
          (el) => ({ ...el, id: generateClientSideId() }) as EditorElement
        );
        newAnimationEffectsMap[i] =
          animationEffectsFromDb && animationEffectsFromDb[String(i)] !== undefined
            ? animationEffectsFromDb[String(i)]
            : 'none';
      }

      set({
        screensCount,
        currentScreenIndex: 0,
        elementsByScreen: newElementsMap,
        animationEffectsByScreen: newAnimationEffectsMap,
        selectedElementIdForEdit: null,
        durationsByScreen: {},
      });
    },

    nextScreen: () => {
      const { currentScreenIndex, screensCount } = get();
      if (currentScreenIndex < screensCount - 1) {
        set({ currentScreenIndex: currentScreenIndex + 1, selectedElementIdForEdit: null });
      }
    },

    prevScreen: () => {
      const { currentScreenIndex } = get();
      if (currentScreenIndex > 0) {
        set({ currentScreenIndex: currentScreenIndex - 1, selectedElementIdForEdit: null });
      }
    },

    addElement: (elementData) => {
      const newElem: EditorElement = { ...elementData, id: generateClientSideId() } as EditorElement;

      console.log(
        "[useEditorStore.ts] addElement: Datos recibidos para nuevo elemento:",
        JSON.parse(JSON.stringify(elementData))
      );
      console.log(
        "[useEditorStore.ts] addElement: Nuevo elemento con ID generado:",
        JSON.parse(JSON.stringify(newElem))
      );

      set((state) => {
        const list: EditorElement[] = state.elementsByScreen[state.currentScreenIndex] || [];
        let updatedElementsForScreen: EditorElement[] = [];

        if (backgroundElementTypes.includes(newElem.tipo)) {
          const listWithoutOldBackgrounds = list.filter(
            (existingElement) => !backgroundElementTypes.includes(existingElement.tipo)
          );
          updatedElementsForScreen = [...listWithoutOldBackgrounds, newElem];
          console.log(
            `[useEditorStore.ts] addElement: Reemplazando fondo existente. Elementos para pantalla ${state.currentScreenIndex} DESPUÉS:`,
            JSON.parse(JSON.stringify(updatedElementsForScreen))
          );
        } else {
          updatedElementsForScreen = [...list, newElem];
          console.log(
            `[useEditorStore.ts] addElement: Añadiendo elemento no-fondo. Elementos para pantalla ${state.currentScreenIndex} DESPUÉS:`,
            JSON.parse(JSON.stringify(updatedElementsForScreen))
          );
        }

        return {
          elementsByScreen: {
            ...state.elementsByScreen,
            [state.currentScreenIndex]: updatedElementsForScreen,
          },
        };
      });
    },

    updateElement: (elementId, propsToUpdate) => {
      console.log(
        `[useEditorStore.ts] updateElement: ID: ${elementId}, Props:`,
        JSON.parse(JSON.stringify(propsToUpdate))
      );
      set((state) => {
        const list = state.elementsByScreen[state.currentScreenIndex] || [];
        const updatedList = list.map((el) =>
          el.id === elementId ? { ...el, ...propsToUpdate } : el
        );
        console.log(
          `[useEditorStore.ts] updateElement: Lista actualizada para pantalla ${state.currentScreenIndex}:`,
          JSON.parse(JSON.stringify(updatedList))
        );
        return {
          elementsByScreen: {
            ...state.elementsByScreen,
            [state.currentScreenIndex]: updatedList,
          },
        };
      });
    },

    removeElement: (elementId) => {
      set((state) => {
        const newSelectedElementIdForEdit =
          state.selectedElementIdForEdit === elementId
            ? null
            : state.selectedElementIdForEdit;
        const list = state.elementsByScreen[state.currentScreenIndex] || [];
        return {
          selectedElementIdForEdit: newSelectedElementIdForEdit,
          elementsByScreen: {
            ...state.elementsByScreen,
            [state.currentScreenIndex]: list.filter((el) => el.id !== elementId),
          },
        };
      });
    },

    setAnimationEffectForCurrentScreen: (effect) =>
      set((state) => ({
        animationEffectsByScreen: {
          ...state.animationEffectsByScreen,
          [state.currentScreenIndex]: effect === 'none' ? undefined : effect,
        },
      })),

    setSelectedElementForEdit: (elementId) => {
      console.log("[useEditorStore.ts] setSelectedElementForEdit: ID:", elementId);
      set({ selectedElementIdForEdit: elementId });
    },
  };
});
