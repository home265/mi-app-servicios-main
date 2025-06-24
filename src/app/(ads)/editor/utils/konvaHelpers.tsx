// src/utils/konvaHelpers.tsx
'use client';

import React, { useState, useEffect, useMemo, type FC, type ComponentProps } from 'react';
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
  // Cláusula de guarda para evitar divisiones por cero si las dimensiones no son válidas.
  if (!imgWidth || !imgHeight || !stageWidth || !stageHeight) {
    return { width: stageWidth, height: stageHeight, x: 0, y: 0 };
  }
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
// Componente para cargar imágenes desde una URL en Konva (MODIFICADO)
// -------------------------------------------------------

// Se omite 'image' de las props base de KonvaImage, ya que este componente lo gestionará internamente.
type KonvaImageProps = Omit<ComponentProps<typeof KonvaImage>, 'image'>;

// Se extiende la interfaz de props para añadir la nueva propiedad `objectFit`.
export interface URLImageProps extends KonvaImageProps {
  /** URL de la imagen a cargar */
  src: string;
  /**
   * Define cómo la imagen debe ajustarse a su contenedor.
   * 'cover': Escala la imagen para cubrir el área, manteniendo la proporción (puede recortar partes).
   * 'contain': Escala la imagen para que quepa completamente en el área, manteniendo la proporción (puede dejar espacios vacíos).
   * 'fill': Estira la imagen para llenar el área, ignorando la proporción (comportamiento original).
   */
  objectFit?: 'contain' | 'cover' | 'fill';
}

/**
 * Un componente de imagen para Konva que carga una imagen desde una URL
 * y la muestra sin deformarla, según el modo `objectFit` especificado.
 */
export const URLImage: FC<URLImageProps> = ({ src, objectFit = 'fill', ...props }) => {
  // Estado para almacenar el elemento HTMLImageElement una vez que se ha cargado.
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Efecto para cargar la imagen desde la URL. Se ejecuta cada vez que cambia `src`.
  useEffect(() => {
    // Se resetea la imagen a null para evitar mostrar la imagen anterior si cambia `src`.
    setImage(null);
    const img = new window.Image();
    img.src = src;
    img.crossOrigin = 'Anonymous'; // Necesario para cargar imágenes de otros dominios en un canvas.
    img.onload = () => {
      // Cuando la imagen se carga con éxito, se guarda en el estado.
      setImage(img);
    };
    img.onerror = () => {
      // Manejo de error si la imagen no se puede cargar.
      console.error(`Error al cargar la imagen desde: ${src}`);
      setImage(null);
    };
  }, [src]);

  // `useMemo` para calcular las propiedades finales de la imagen (posición y tamaño).
  // Esto es eficiente porque solo se recalcula si la imagen, las props o `objectFit` cambian.
  const computedProps = useMemo(() => {
    // Si la imagen no se ha cargado o el contenedor no tiene dimensiones, no podemos calcular nada.
    if (!image || !props.width || !props.height) {
      return { ...props, image: null }; // Devuelve `image: null` para no renderizar nada.
    }

    // Se obtienen la posición y dimensiones del contenedor desde las props.
    const containerX = props.x ?? 0;
    const containerY = props.y ?? 0;
    const containerWidth = props.width;
    const containerHeight = props.height;

    // Por defecto, se usa el comportamiento 'fill' (estirar), que era el original.
    let finalX = containerX;
    let finalY = containerY;
    let finalWidth = containerWidth;
    let finalHeight = containerHeight;

    // Si se especifica 'cover', se calcula el tamaño para cubrir el área sin deformar.
    if (objectFit === 'cover') {
      const { width, height, x, y } = computeCoverTransform(image.width, image.height, containerWidth, containerHeight);
      finalWidth = width;
      finalHeight = height;
      // La x/y de la transformación es un desplazamiento, se suma a la posición del contenedor.
      finalX = containerX + x;
      finalY = containerY + y;
    }
    // Si se especifica 'contain', se calcula el tamaño para caber dentro del área sin deformar.
    else if (objectFit === 'contain') {
      const scale = Math.min(containerWidth / image.width, containerHeight / image.height);
      finalWidth = image.width * scale;
      finalHeight = image.height * scale;
      // Se calcula el desplazamiento para centrar la imagen dentro de su contenedor.
      finalX = containerX + (containerWidth - finalWidth) / 2;
      finalY = containerY + (containerHeight - finalHeight) / 2;
    }

    // Se devuelven todas las props originales, pero con la posición, dimensiones y la imagen cargada ya calculadas.
    return {
      ...props,
      x: finalX,
      y: finalY,
      width: finalWidth,
      height: finalHeight,
      image,
    };
  }, [image, props, objectFit]); // Dependencias del hook `useMemo`.

  // Si la imagen aún no está lista (cargada y procesada), no se renderiza nada.
  if (!computedProps.image) {
    return null;
  }

  // Se renderiza el componente KonvaImage con las propiedades calculadas correctamente.
  return <KonvaImage {...computedProps} />;
};