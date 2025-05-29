// src/utils/konvaHelpers.tsx
'use client';

import React, { useState, useEffect, type FC, type ComponentProps } from 'react';
import { Image as KonvaImage } from 'react-konva';

/**
 * Calcula las dimensiones y posición para que una imagen cubra todo el canvas (tipo "cover").
 * @param imgWidth Ancho original de la imagen.
 * @param imgHeight Alto original de la imagen.
 * @param stageWidth Ancho del canvas.
 * @param stageHeight Alto del canvas.
 * @returns Objetos width, height, x, y para aplicar al nodo Konva.Image.
 */
export function computeCoverTransform(
  imgWidth: number,
  imgHeight: number,
  stageWidth: number,
  stageHeight: number
): { width: number; height: number; x: number; y: number } {
  const scale = Math.max(stageWidth / imgWidth, stageHeight / imgHeight);
  const width = imgWidth * scale;
  const height = imgHeight * scale;
  const x = (stageWidth - width) / 2;
  const y = (stageHeight - height) / 2;
  return { width, height, x, y };
}

/**
 * Calcula la duración por pantalla redondeada hacia arriba al medio segundo más cercano.
 * @param totalDuration Duración total del reel en segundos.
 * @param screensCount Número de pantallas a usar.
 * @returns Duración por pantalla en segundos (incrementos de 0.5).
 */
export function computeDurationPerScreen(
  totalDuration: number,
  screensCount: number
): number {
  if (screensCount <= 0) return 0;
  const raw = totalDuration / screensCount;
  return Math.ceil(raw * 2) / 2;
}

// -------------------------------------------------------
// Componente para cargar imágenes desde una URL en Konva
// -------------------------------------------------------

type KonvaImageProps = Omit<ComponentProps<typeof KonvaImage>, 'image'>;

export interface URLImageProps extends KonvaImageProps {
  /** URL de la imagen a cargar */
  src: string;
}

export const URLImage: FC<URLImageProps> = ({ src, ...props }) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.crossOrigin = 'Anonymous';
    img.onload = () => setImage(img);
  }, [src]);

  if (!image) return null;

  return <KonvaImage image={image} {...props} />;
};
