// src/app/(ads)/editor/components/MiniCanvasPreview.tsx
'use client';

import React, { useRef, useEffect } from 'react';
// ELIMINAMOS TextPath de aquí porque no se usa en la lógica de preview simplificada
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { EditorElement } from '../../hooks/useEditorStore'; // Ajusta la ruta según sea necesario
import type { ReelAnimationEffectType } from '@/types/anuncio'; // Ajusta la ruta según sea necesario
import { URLImage } from '@/app/(ads)/editor/utils/konvaHelpers'; // Ajusta la ruta según sea necesario
import { pctToPx } from '@/app/(ads)/editor/utils/percentHelpers'; // Ajusta la ruta según sea necesario

interface MiniCanvasPreviewProps {
  elements: EditorElement[];
  baseWidth: number;
  baseHeight: number;
  previewWidth: number;
  applyingEffect: ReelAnimationEffectType | null | undefined;
  backgroundColor?: string;
}

const MiniCanvasPreview: React.FC<MiniCanvasPreviewProps> = ({
  elements,
  baseWidth,
  baseHeight,
  previewWidth,
  applyingEffect,
  backgroundColor = '#1A1A1A',
}) => {
  const stageRef = useRef<Konva.Stage>(null);

  const scaleFactor = baseWidth > 0 ? previewWidth / baseWidth : 0;
  const previewHeight = baseHeight * scaleFactor;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    // Detener tweens anteriores explícitamente si fuera necesario (más avanzado)
    // stage.find('Tween').forEach(tween => tween.destroy()); // Esto detendría todos los tweens del stage

    stage.opacity(1);
    stage.scaleX(1);
    stage.scaleY(1);
    stage.x(0);
    stage.y(0);
    // Es importante resetear también los offsets si se usan en las animaciones
    stage.offsetX(0);
    stage.offsetY(0);


    const layer = stage.getLayers()[0] as Konva.Layer | undefined; // Obtener la primera capa

    if (!layer) return; // Si no hay capa, no podemos hacer batchDraw

    // Si no hay efecto o es 'none', solo asegurar que la capa está dibujada y salir.
    if (!applyingEffect || applyingEffect === 'none') {
      layer.batchDraw();
      return;
    }

    // Aplicar efecto
    switch (applyingEffect) {
      case 'fadeIn':
        stage.opacity(0);
        new Konva.Tween({
          node: stage,
          opacity: 1,
          duration: 0.6,
          easing: Konva.Easings.EaseInOut,
          onUpdate: () => layer.batchDraw(), // Redibujar en cada frame de la animación
          onFinish: () => layer.batchDraw(), // Asegurar redibujo final
        }).play();
        break;
      case 'zoomIn':
        stage.opacity(0);
        stage.scaleX(0.85);
        stage.scaleY(0.85);
        // Para centrar el zoom, ajustamos el offset al centro del Stage y luego la posición al centro
        // stage.offsetX(previewWidth / 2 / 0.85); // Dividido por la escala inicial
        // stage.offsetY(previewHeight / 2 / 0.85);
        // stage.x(previewWidth / 2);
        // stage.y(previewHeight / 2);

        new Konva.Tween({
          node: stage,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          // offsetX: 0, // Resetear offset si se usó
          // offsetY: 0,
          // x: 0,       // Resetear posición si se usó
          // y: 0,
          duration: 0.6,
          easing: Konva.Easings.EaseInOut,
          onUpdate: () => layer.batchDraw(),
          onFinish: () => layer.batchDraw(),
        }).play();
        break;
      case 'slideInFromLeft':
        stage.opacity(0);
        stage.x(-previewWidth); // Empezar completamente fuera a la izquierda
        new Konva.Tween({
          node: stage,
          opacity: 1,
          x: 0,
          duration: 0.6,
          easing: Konva.Easings.EaseOut,
          onUpdate: () => layer.batchDraw(),
          onFinish: () => layer.batchDraw(),
        }).play();
        break;
      case 'pulse':
        // Reiniciar escala explícitamente antes de la animación de pulso
        stage.scaleX(1);
        stage.scaleY(1);
        new Konva.Tween({
            node: stage,
            scaleX: 0.95,
            scaleY: 0.95,
            duration: 0.2,
            easing: Konva.Easings.EaseInOut,
            onUpdate: () => layer.batchDraw(),
            onFinish: () => {
                layer.batchDraw(); // Asegurar dibujo
                new Konva.Tween({
                    node: stage,
                    scaleX: 1.05,
                    scaleY: 1.05,
                    duration: 0.3,
                    easing: Konva.Easings.EaseInOut,
                    onUpdate: () => layer.batchDraw(),
                    onFinish: () => {
                        layer.batchDraw(); // Asegurar dibujo
                        new Konva.Tween({
                            node: stage,
                            scaleX: 1,
                            scaleY: 1,
                            duration: 0.4,
                            easing: Konva.Easings.EaseInOut,
                            onUpdate: () => layer.batchDraw(),
                            onFinish: () => layer.batchDraw(),
                        }).play();
                    }
                }).play();
            }
        }).play();
        break;
      default:
        layer.batchDraw(); // Si es un efecto desconocido, al menos dibujar la capa
        break;
    }
  }, [applyingEffect, elements, previewWidth, previewHeight, scaleFactor]); // scaleFactor incluye baseWidth

  // MiniCanvasPreview.tsx
// ... (imports y la lógica del useEffect se mantienen como en la versión anterior)

return (
  <div style={{ width: previewWidth, height: previewHeight, backgroundColor, overflow: 'hidden', border: '1px solid #333' }}>
    {scaleFactor > 0 && (
      <Stage
        ref={stageRef}
        width={previewWidth}
        height={previewHeight}
      >
        <Layer>
          {/* Fondos, gradientes, imágenes de fondo */}
          {elements
            .filter(el => el.tipo === 'fondoColor' || el.tipo === 'fondoImagen' || el.tipo === 'gradient')
            .map(el => {
              // Define props específicas para Konva, excluyendo la key de React
              const konvaDirectProps = {
                x: pctToPx(el.xPct, previewWidth),
                y: pctToPx(el.yPct, previewHeight),
                width: pctToPx(el.widthPct, previewWidth),
                height: pctToPx(el.heightPct, previewHeight),
                listening: false,
              };

              if (el.tipo === 'fondoColor') {
                return <Rect key={el.id} {...konvaDirectProps} fill={el.color} />;
              }
              if (el.tipo === 'fondoImagen' && el.src) {
                return <URLImage key={el.id} {...konvaDirectProps} src={el.src} />;
              }
              if (el.tipo === 'gradient') {
                // Asegúrate de que el.color1 exista o proporciona un fallback más robusto
                return <Rect key={el.id} {...konvaDirectProps} fill={el.color1 || '#CCCCCC'} />;
              }
              return null;
            })}

          {/* Textos y Subimágenes */}
          {elements
            .filter(el => el.tipo === 'texto' || el.tipo === 'textoCurvo' || el.tipo === 'subimagen')
            .map(el => {
              const konvaBaseProps = {
                // el.id también se puede usar como 'id' para Konva si necesitas seleccionar el nodo después
                id: `preview-${el.id}`, // Prefijo para evitar colisiones si el 'id' de Konva debe ser único en un contexto mayor
                x: pctToPx(el.xPct, previewWidth),
                y: pctToPx(el.yPct, previewHeight),
                listening: false,
              };

              if (el.tipo === 'texto') {
                const originalFontSizePx = (el.fontSizePct / 100) * baseHeight;
                const previewFontSizePx = originalFontSizePx * scaleFactor;
                return (
                  <Text
                    key={el.id} // React key
                    {...konvaBaseProps}
                    text={el.text}
                    fontSize={previewFontSizePx}
                    fontFamily={el.fontFamily}
                    fill={el.color}
                    width={pctToPx(el.widthPct, previewWidth)}
                    height={pctToPx(el.heightPct, previewHeight)}
                  />
                );
              }
              if (el.tipo === 'textoCurvo') {
                const originalFontSizePx = (el.fontSizePct / 100) * baseHeight;
                const previewFontSizePx = originalFontSizePx * scaleFactor;
                return (
                  <Text // Renderizado simplificado como texto normal
                    key={el.id} // React key
                    {...konvaBaseProps}
                    text={el.text}
                    fontSize={previewFontSizePx}
                    fontFamily={el.fontFamily}
                    fill={el.color}
                    width={pctToPx(el.widthPct, previewWidth)}
                    height={pctToPx(el.heightPct, previewHeight)}
                  />
                );
              }
              if (el.tipo === 'subimagen' && el.src) {
                return (
                  <URLImage
                    key={el.id} // React key
                    {...konvaBaseProps}
                    src={el.src}
                    width={pctToPx(el.widthPct, previewWidth)}
                    height={pctToPx(el.heightPct, previewHeight)}
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

// ... (el resto del componente MiniCanvasPreview, incluido el useEffect, permanece igual)
};

export default MiniCanvasPreview;