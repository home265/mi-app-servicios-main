'use client';

import React, { useState, useEffect } from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import CardFrontal from './CardFrontal';
import CardTrasera from './CardTrasera';

interface Props {
  publicacion: SerializablePaginaAmarillaData;
  duracionFrente: number;
  duracionDorso: number;
}

const AnuncioAnimadoCard: React.FC<Props> = ({
  publicacion,
  duracionFrente,
  duracionDorso,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    const ciclo = duracionFrente + duracionDorso;

    const flipOnce = () => {
      setIsFlipped(false);
      const t = setTimeout(() => setIsFlipped(true), duracionFrente);
      return () => clearTimeout(t);
    };

    const cleanup = flipOnce();
    const interval = setInterval(flipOnce, ciclo);
    return () => {
      cleanup();
      clearInterval(interval);
    };
  }, [duracionFrente, duracionDorso]);

  return (
    // La perspectiva va en el padre, sin rotación
    <div
      className="w-full max-w-sm mx-auto"
      style={{
        perspective: '1000px',
        WebkitPerspective: '1000px',
      }}
    >
      {/* Wrapper sin rotación; solo posición y tamaño */}
      <div
        className="relative w-full h-full"
        style={{
          aspectRatio: '9/12',
          transformStyle: 'preserve-3d',
          WebkitTransformStyle: 'preserve-3d',
        }}
      >
        {/* CARA FRONTAL */}
        <div
          className="absolute inset-0"
          style={{
            transition: 'transform 1000ms',
            transform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            WebkitTransform: isFlipped ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
        >
          <CardFrontal publicacion={publicacion} />
        </div>

        {/* CARA TRASERA */}
        <div
          className="absolute inset-0"
          style={{
            transition: 'transform 1000ms',
            transform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            WebkitTransform: isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            willChange: 'transform',
          }}
        >
          <CardTrasera publicacion={publicacion} />
        </div>
      </div>
    </div>
  );
};

export default AnuncioAnimadoCard;
