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
    const flipCard = () => {
      setIsFlipped(false);
      const timer = setTimeout(() => setIsFlipped(true), duracionFrente);
      return () => clearTimeout(timer);
    };
    const cleanup = flipCard();
    const intervalo = setInterval(flipCard, ciclo);
    return () => {
      cleanup();
      clearInterval(intervalo);
    };
  }, [duracionFrente, duracionDorso]);

  return (
    // Estructura Principal (Funcional)
    <div className="perspective-1000 w-full max-w-sm mx-auto">
      {/* Contenedor Interior que Gira (Con las clases y estilos correctos) */}
      <div
        className={
          `relative w-full h-full duration-1000 transition-transform preserve-3d ` +
          (isFlipped ? 'rotate-y-180' : '')
        }
        style={{ aspectRatio: '9/12' }}
      >
        {/* CARA FRONTAL: Renderiza el componente especializado */}
        <div className="absolute inset-0 backface-hidden">
          <CardFrontal publicacion={publicacion} />
        </div>

        {/* CARA TRASERA: Renderiza el otro componente especializado */}
        <div className="absolute inset-0 backface-hidden rotate-y-180">
          <CardTrasera publicacion={publicacion} />
        </div>
      </div>
    </div>
  );
};

export default AnuncioAnimadoCard;   