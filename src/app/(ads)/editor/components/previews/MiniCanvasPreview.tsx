// src/app/(ads)/editor/components/MiniCanvasPreview.tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';
import type { EditorElement } from '../../hooks/useEditorStore';   // Ajusta la ruta si es necesario
import type { ReelAnimationEffectType } from '@/types/anuncio';     // Ajusta la ruta si es necesario
import { URLImage } from '@/app/(ads)/editor/utils/konvaHelpers';   // Ajusta la ruta
import { pctToPx } from '@/app/(ads)/editor/utils/percentHelpers'; // Ajusta la ruta

interface MiniCanvasPreviewProps {
  elements: EditorElement[];
  baseWidth: number;
  baseHeight: number;
  previewWidth: number;
  applyingEffect: ReelAnimationEffectType | null | undefined;
  backgroundColor?: string;
}

/**
 * MiniCanvasPreview
 * ----------------------------------------------------------------------
 * - Muestra una vista previa (Konva) de los elementos de la pantalla,
 *   opcionalmente con un efecto de animación.
 * - Sólo renderiza el Stage cuando baseWidth/baseHeight son > 0.
 * - Evita tweens sobre un Stage sin tamaño, lo que originaba un lienzo
 *   “en blanco” en producción.
 */
const MiniCanvasPreview: React.FC<MiniCanvasPreviewProps> = ({
  elements,
  baseWidth,
  baseHeight,
  previewWidth,
  applyingEffect,
  backgroundColor = '#1A1A1A',
}) => {
  const stageRef = useRef<Konva.Stage>(null);

  /* ------------------------------------------------------------------ */
  /*  Dimensiones derivadas                                             */
  /* ------------------------------------------------------------------ */
  const { scaleFactor, previewHeight } = useMemo(() => {
    if (baseWidth > 0 && baseHeight > 0) {
      const sf = previewWidth / baseWidth;
      return { scaleFactor: sf, previewHeight: baseHeight * sf };
    }
    return { scaleFactor: 0, previewHeight: 0 };
  }, [baseWidth, baseHeight, previewWidth]);

  /* ------------------------------------------------------------------ */
  /*  Efecto de animación / redibujo                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (scaleFactor === 0) return; // Base aún sin tamaño, evita tweens nulos

    const stage = stageRef.current;
    if (!stage) return;

    // Reiniciar transformaciones
    stage.opacity(1);
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });
    stage.offset({ x: 0, y: 0 });

    const layer = stage.getLayers()[0] as Konva.Layer | undefined;
    if (!layer) return;

    // Si no hay efecto (o es 'none'), simplemente redibuja y sale
    if (!applyingEffect || applyingEffect === 'none') {
      layer.batchDraw();
      return;
    }

    // Declaración auxiliar para no repetir onUpdate/onFinish
    const tweenCommon = {
      onUpdate: () => layer.batchDraw(),
      onFinish: () => layer.batchDraw(),
    };

    switch (applyingEffect) {
      case 'fadeIn':
        stage.opacity(0);
        new Konva.Tween({
          node: stage,
          opacity: 1,
          duration: 0.6,
          easing: Konva.Easings.EaseInOut,
          ...tweenCommon,
        }).play();
        break;

      case 'zoomIn':
        stage.opacity(0);
        stage.scale({ x: 0.85, y: 0.85 });
        new Konva.Tween({
          node: stage,
          opacity: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 0.6,
          easing: Konva.Easings.EaseInOut,
          ...tweenCommon,
        }).play();
        break;

      case 'slideInFromLeft':
        stage.opacity(0);
        stage.x(-previewWidth);
        new Konva.Tween({
          node: stage,
          opacity: 1,
          x: 0,
          duration: 0.6,
          easing: Konva.Easings.EaseOut,
          ...tweenCommon,
        }).play();
        break;

      case 'pulse':
        new Konva.Tween({
          node: stage,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 0.2,
          easing: Konva.Easings.EaseInOut,
          ...tweenCommon,
          onFinish: () => {
            new Konva.Tween({
              node: stage,
              scaleX: 1.05,
              scaleY: 1.05,
              duration: 0.3,
              easing: Konva.Easings.EaseInOut,
              ...tweenCommon,
              onFinish: () => {
                new Konva.Tween({
                  node: stage,
                  scaleX: 1,
                  scaleY: 1,
                  duration: 0.4,
                  easing: Konva.Easings.EaseInOut,
                  ...tweenCommon,
                }).play();
              },
            }).play();
          },
        }).play();
        break;

      default:
        layer.batchDraw();
        break;
    }
  }, [
    applyingEffect,
    elements,          // redibuja si cambian elementos
    previewWidth,      // tamaño del Stage
    previewHeight,
    scaleFactor,
  ]);

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  if (scaleFactor === 0) {
    // Mientras no se conozca el tamaño base, muestra un placeholder
    return (
      <div
        style={{
          width: previewWidth,
          height: (previewWidth * 9) / 16,
          backgroundColor,
          border: '1px solid #333',
        }}
        className="flex items-center justify-center text-xs text-gray-500"
      >
        Cargando preview…
      </div>
    );
  }

  return (
    <div
      style={{
        width: previewWidth,
        height: previewHeight,
        backgroundColor,
        overflow: 'hidden',
        border: '1px solid #333',
      }}
    >
      <Stage ref={stageRef} width={previewWidth} height={previewHeight}>
        <Layer>
          {/* Fondos */}
          {elements
            .filter(
              (el) =>
                el.tipo === 'fondoColor' ||
                el.tipo === 'fondoImagen' ||
                el.tipo === 'gradient'
            )
            .map((el) => {
              const baseProps = {
                x: pctToPx(el.xPct, previewWidth),
                y: pctToPx(el.yPct, previewHeight),
                width: pctToPx(el.widthPct, previewWidth),
                height: pctToPx(el.heightPct, previewHeight),
                listening: false,
              };

              if (el.tipo === 'fondoColor') {
                return <Rect key={el.id} {...baseProps} fill={el.color} />;
              }
              if (el.tipo === 'fondoImagen' && el.src) {
                return <URLImage key={el.id} {...baseProps} src={el.src} />;
              }
              if (el.tipo === 'gradient') {
                return <Rect key={el.id} {...baseProps} fill={el.color1 ?? '#CCCCCC'} />;
              }
              return null;
            })}

          {/* Textos y subimágenes */}
          {elements
            .filter(
              (el) =>
                el.tipo === 'texto' ||
                el.tipo === 'textoCurvo' ||
                el.tipo === 'subimagen'
            )
            .map((el) => {
              const baseProps = {
                id: `preview-${el.id}`,
                x: pctToPx(el.xPct, previewWidth),
                y: pctToPx(el.yPct, previewHeight),
                listening: false,
              };

              if (el.tipo === 'texto' || el.tipo === 'textoCurvo') {
                const originalFontSize = (el.fontSizePct / 100) * baseHeight;
                const previewFontSize = originalFontSize * scaleFactor;
                return (
                  <Text
                    key={el.id}
                    {...baseProps}
                    text={el.text}
                    fontSize={previewFontSize}
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
                    key={el.id}
                    {...baseProps}
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
    </div>
  );
};

export default MiniCanvasPreview;
