'use client';

import React, { useRef, useState, useEffect, forwardRef } from 'react';
import { Stage, Layer, Rect, Text, TextPath } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../hooks/useEditorStore';
import type {
  ColorBackgroundElement,
  TextElement,
  CurvedTextElement,
  ImageBackgroundElement,
  SubimageElement,
  GradientBackgroundElement,
} from '../hooks/useEditorStore';

// --- MODIFICADO ---
// Importar pctToPx y pxToPct (la que ya tienes)
import { pctToPx, pxToPct } from '../utils/percentHelpers'; // pxToPct es la que usaremos para ambas dimensiones
import { URLImage } from '../utils/konvaHelpers';


const EditorCanvas = forwardRef<Konva.Stage>((_, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const internalStageRef = useRef<Konva.Stage>(null);
  const stageRef = (ref as React.RefObject<Konva.Stage>) || internalStageRef;
  const [containerWidth, setContainerWidth] = useState(0);

  const elements = useEditorStore(
    state => state.elementsByScreen[state.currentScreenIndex] || []
  );
  const { setSelectedElementForEdit, updateElement } = useEditorStore.getState();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      entries.forEach(entry => setContainerWidth(entry.contentRect.width));
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.offsetWidth);
    return () => observer.disconnect();
  }, []);

  const stageWidth = containerWidth;
  const stageHeight = (containerWidth * 16) / 9;

  const handleElementClick = (elementId: string) => {
    console.log(`[EditorCanvas] Elemento clickeado: ${elementId}`);
    setSelectedElementForEdit(elementId);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    if (!stageWidth || !stageHeight) return;

    const node = e.target;
    // --- MODIFICADO ---
    // Usar la función pxToPct existente para ambas coordenadas
    const newXPct = pxToPct(node.x(), stageWidth);
    const newYPct = pxToPct(node.y(), stageHeight);

    console.log(`[EditorCanvas] Elemento arrastrado: ${elementId}, Nueva Pos (px): x=${node.x()}, y=${node.y()}`);
    console.log(`[EditorCanvas] Elemento arrastrado: ${elementId}, Nueva Pos (%): xPct=${newXPct}, yPct=${newYPct}`);

    updateElement(elementId, { xPct: newXPct, yPct: newYPct });
  };


  return (
    <div
      ref={containerRef}
      className="w-full h-screen md:h-auto md:max-w-[360px] lg:max-w-[450px] mx-auto flex justify-center py-4"
    >
      {containerWidth > 0 && (
        <Stage 
          width={stageWidth} 
          height={stageHeight} 
          ref={stageRef}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) {
              console.log("[EditorCanvas] Clic en el fondo del Stage, deseleccionando elemento.");
              setSelectedElementForEdit(null);
            }
          }}
        >
          <Layer>
            {/* Degradados */}
            {elements
              .filter((el): el is GradientBackgroundElement => el.tipo === 'gradient')
              .map(el => { 
                const start = { x: 0, y: 0 };
                let end = { x: stageWidth, y: 0 };
                if (el.orientation === 'vertical') end = { x: 0, y: stageHeight };
                else if (el.orientation === 'diagonal') end = { x: stageWidth, y: stageHeight };

                if (el.orientation === 'radial') {
                  const r = Math.max(stageWidth, stageHeight) / 2;
                  return (
                    <Rect
                      key={el.id}
                      x={pctToPx(el.xPct, stageWidth)}
                      y={pctToPx(el.yPct, stageHeight)}
                      width={pctToPx(el.widthPct, stageWidth)}
                      height={pctToPx(el.heightPct, stageHeight)}
                      fillRadialGradientColorStops={[0, el.color1, 1, el.color2]}
                      fillRadialGradientStartPoint={{ x: stageWidth / 2, y: stageHeight / 2 }}
                      fillRadialGradientEndPoint={{ x: stageWidth / 2, y: stageHeight / 2 }}
                      fillRadialGradientStartRadius={0}
                      fillRadialGradientEndRadius={r}
                      listening={false}
                    />
                  );
                }
                return (
                  <Rect
                    key={el.id}
                    x={pctToPx(el.xPct, stageWidth)}
                    y={pctToPx(el.yPct, stageHeight)}
                    width={pctToPx(el.widthPct, stageWidth)}
                    height={pctToPx(el.heightPct, stageHeight)}
                    fillLinearGradientColorStops={[0, el.color1, 1, el.color2]}
                    fillLinearGradientStartPoint={start}
                    fillLinearGradientEndPoint={end}
                    listening={false}
                  />
                );
            })}

            {/* Fondo de color */}
            {elements
              .filter((el): el is ColorBackgroundElement => el.tipo === 'fondoColor')
              .map(el => (
                <Rect
                  key={el.id}
                  x={pctToPx(el.xPct, stageWidth)}
                  y={pctToPx(el.yPct, stageHeight)}
                  width={pctToPx(el.widthPct, stageWidth)}
                  height={pctToPx(el.heightPct, stageHeight)}
                  fill={el.color}
                  listening={false}
                />
              ))}

            {/* Texto plano */}
            {elements
              .filter((el): el is TextElement => el.tipo === 'texto')
              .map(el => (
                <Text
                  key={el.id}
                  id={el.id}
                  x={pctToPx(el.xPct, stageWidth)}
                  y={pctToPx(el.yPct, stageHeight)}
                  text={el.text}
                  fontSize={(el.fontSizePct / 100) * stageHeight}
                  fontFamily={el.fontFamily}
                  fill={el.color}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              ))}

            {/* Texto curvo */}
            {elements
              .filter((el): el is CurvedTextElement => el.tipo === 'textoCurvo')
              .map(el => (
                <TextPath
                  key={el.id}
                  id={el.id}
                  x={pctToPx(el.xPct, stageWidth)}
                  y={pctToPx(el.yPct, stageHeight)}
                  data={el.curvePath}
                  text={el.text}
                  fontSize={(el.fontSizePct / 100) * stageHeight}
                  fontFamily={el.fontFamily}
                  fill={el.color}
                  draggable
                  onClick={() => handleElementClick(el.id)}
                  onTap={() => handleElementClick(el.id)}
                  onDragEnd={(e) => handleDragEnd(e, el.id)}
                />
              ))}

            {/* Imágenes de fondo y subimágenes */}
            {elements
              .filter(
                (el): el is ImageBackgroundElement | SubimageElement =>
                  el.tipo === 'fondoImagen' || el.tipo === 'subimagen'
              )
              .map(el => (
                <URLImage
                  key={el.id}
                  id={el.id}
                  x={pctToPx(el.xPct, stageWidth)}
                  y={pctToPx(el.yPct, stageHeight)}
                  width={pctToPx(el.widthPct, stageWidth)}
                  height={pctToPx(el.heightPct, stageHeight)}
                  src={el.src}
                  draggable={el.tipo === 'subimagen'}
                  listening={el.tipo === 'subimagen'}
                  onClick={el.tipo === 'subimagen' ? () => handleElementClick(el.id) : undefined}
                  onTap={el.tipo === 'subimagen' ? () => handleElementClick(el.id) : undefined}
                  onDragEnd={el.tipo === 'subimagen' ? (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id) : undefined}
                />
              ))}
          </Layer>
        </Stage>
      )}
    </div>
  );
});

EditorCanvas.displayName = 'EditorCanvas';
export default EditorCanvas;