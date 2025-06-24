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
import { pctToPx, pxToPct } from '../utils/percentHelpers';
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
    const newXPct = pxToPct(node.x(), stageWidth);
    const newYPct = pxToPct(node.y(), stageHeight);

    console.log(`[EditorCanvas] Elemento arrastrado: ${elementId}, Nueva Pos (px): x=${node.x()}, y=${node.y()}`);
    console.log(`[EditorCanvas] Elemento arrastrado: ${elementId}, Nueva Pos (%): xPct=${newXPct}, yPct=${newYPct}`);

    updateElement(elementId, { xPct: newXPct, yPct: newYPct });
  };


  return (
    <div
      ref={containerRef}
      className="bg-gray-700 shadow-lg w-full h-screen md:h-auto md:max-w-[360px] lg:max-w-[450px] mx-auto flex justify-center py-4"
    >
      {containerWidth > 0 && (
        <Stage
          width={stageWidth}
          height={stageHeight}
          ref={stageRef}
          onMouseDown={(e: Konva.KonvaEventObject<MouseEvent>) => {
            if (e.target === e.target.getStage()) {
              console.log("[EditorCanvas] Clic en el fondo del Stage, deseleccionando elemento.");
              setSelectedElementForEdit(null);
            }
          }}
        >
          <Layer>
            {/* 1. FONDOS: Se dibujan primero para quedar debajo de todo. */}
            {elements
              .filter(
                (el): el is GradientBackgroundElement | ColorBackgroundElement | ImageBackgroundElement =>
                  el.tipo === 'gradient' || el.tipo === 'fondoColor' || el.tipo === 'fondoImagen'
              )
              .map(el => {
                if (el.tipo === 'gradient') {
                    const start = { x: 0, y: 0 };
                    let end = { x: stageWidth, y: 0 };
                    if (el.orientation === 'vertical') end = { x: 0, y: stageHeight };
                    else if (el.orientation === 'diagonal') end = { x: stageWidth, y: stageHeight };

                    if (el.orientation === 'radial') {
                      const r = Math.max(stageWidth, stageHeight) / 2;
                      return (
                        <Rect key={el.id} x={0} y={0} width={stageWidth} height={stageHeight}
                          fillRadialGradientColorStops={[0, el.color1, 1, el.color2]}
                          fillRadialGradientStartPoint={{ x: stageWidth / 2, y: stageHeight / 2 }}
                          fillRadialGradientEndPoint={{ x: stageWidth / 2, y: stageHeight / 2 }}
                          fillRadialGradientStartRadius={0} fillRadialGradientEndRadius={r}
                          listening={false} />
                      );
                    }
                    return (
                      <Rect key={el.id} x={0} y={0} width={stageWidth} height={stageHeight}
                        fillLinearGradientColorStops={[0, el.color1, 1, el.color2]}
                        fillLinearGradientStartPoint={start} fillLinearGradientEndPoint={end}
                        listening={false} />
                    );
                }
                
                if (el.tipo === 'fondoColor') {
                  return (
                    <Rect key={el.id} x={0} y={0} width={stageWidth} height={stageHeight}
                      fill={el.color} listening={false} />
                  );
                }

                if (el.tipo === 'fondoImagen') {
                  // Para los fondos de imagen con marcos, dibujamos dos elementos:
                  // 1. Un rectángulo de color de fondo que servirá de marco.
                  // 2. La imagen contenida encima de ese rectángulo.
                  return (
                    <React.Fragment key={el.id}>
                      <Rect
                        x={0}
                        y={0}
                        width={stageWidth}
                        height={stageHeight}
                        fill={el.frameColor || '#000000'} // Usa el color del marco o negro por defecto.
                        listening={true} // El marco es clicable.
                        onClick={() => handleElementClick(el.id)}
                        onTap={() => handleElementClick(el.id)}
                        id={el.id} // Asignamos el ID para que pueda ser seleccionado
                      />
                      <URLImage
                        src={el.src}
                        x={0}
                        y={0}
                        width={stageWidth}
                        height={stageHeight}
                        objectFit="contain" // <-- Esto asegura que la imagen se vea completa y sin deformar.
                        listening={false} // La imagen en sí no necesita ser clicable, solo el marco debajo.
                      />
                    </React.Fragment>
                  );
                }

                return null;
            })}
            
            {/* 2. ELEMENTOS SUPERPUESTOS: Se dibujan después para quedar encima del fondo. */}
            {elements
              .filter(
                (el): el is TextElement | CurvedTextElement | SubimageElement =>
                  el.tipo === 'texto' || el.tipo === 'textoCurvo' || el.tipo === 'subimagen'
              )
              .map(el => {
                if (el.tipo === 'texto') {
                  return (
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
                      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id)}
                      width={pctToPx(el.widthPct, stageWidth)}
                      height={pctToPx(el.heightPct, stageHeight)}
                      align="center"
                      verticalAlign="middle"
                    />
                  );
                }

                if (el.tipo === 'textoCurvo') {
                  return (
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
                      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id)}
                      width={pctToPx(el.widthPct, stageWidth)}
                      height={pctToPx(el.heightPct, stageHeight)}
                      align="center"
                      verticalAlign="middle"
                      textBaseline="middle"
                    />
                  );
                }

                if (el.tipo === 'subimagen') {
                  return (
                    <URLImage
                      key={el.id}
                      id={el.id}
                      x={pctToPx(el.xPct, stageWidth)}
                      y={pctToPx(el.yPct, stageHeight)}
                      width={pctToPx(el.widthPct, stageWidth)}
                      height={pctToPx(el.heightPct, stageHeight)}
                      src={el.src}
                      objectFit="contain"
                      draggable
                      listening={true}
                      onClick={() => handleElementClick(el.id)}
                      onTap={() => handleElementClick(el.id)}
                      onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, el.id)}
                    />
                  );
                }

                return null;
              })}
          </Layer>
        </Stage>
      )}
    </div>
  );
});

EditorCanvas.displayName = 'EditorCanvas';
export default EditorCanvas;
