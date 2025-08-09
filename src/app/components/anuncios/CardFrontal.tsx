'use client';

import React, { useRef, useEffect } from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import AvatarCuadrado from '@/app/components/common/AvatarCuadrado'; // Usamos el avatar cuadrado

interface Props {
  publicacion: SerializablePaginaAmarillaData;
}

const CardFrontal: React.FC<Props> = ({ publicacion }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  // Lógica para el efecto 3D dinámico (sin cambios)
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { left, top, width, height } = card.getBoundingClientRect();
      const x = e.clientX - left;
      const y = e.clientY - top;
      
      const rotateX = -1 * ((y - height / 2) / (height / 2)) * 10; // Reducimos la rotación para un efecto más sutil
      const rotateY = ((x - width / 2) / (width / 2)) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    const handleMouseLeave = () => {
      if (card) {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
      }
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Preparación de los textos para mostrar
  const titulo = publicacion.nombrePublico;
  const categoriaPrincipal = publicacion.creatorRole === 'prestador' ? publicacion.categoria : publicacion.rubro;
  const ubicacion = `${publicacion.localidad}, ${publicacion.provincia}`;

  return (
    // Contenedor principal que aplica la transición y el estilo 3D
    <div
      ref={cardRef}
      className="w-full h-full rounded-2xl bg-gray-900 transition-transform duration-300 ease-out flex flex-col items-center justify-center text-center p-6"
      style={{ transformStyle: 'preserve-3d', background: "url('/textura-oscura.png')", backgroundSize: 'cover' }}
    >
      {/* CAPA FLOTANTE DEL AVATAR (más cerca) */}
      <div style={{ transform: 'translateZ(60px)' }}>
        <AvatarCuadrado
          selfieUrl={publicacion.imagenPortadaUrl ?? undefined}
          nombre={titulo}
          size={150} // Aumentamos considerablemente el tamaño
        />
      </div>

      {/* CAPA FLOTANTE DEL TEXTO (un poco más atrás que el avatar) */}
      <div className="text-white mt-6" style={{ transform: 'translateZ(40px)' }}>
        <h3 className="font-bold text-3xl">{titulo}</h3>
        {categoriaPrincipal && <p className="text-lg opacity-80 mt-1">{categoriaPrincipal}</p>}
        <p className="text-sm opacity-60 mt-4">{ubicacion}</p>
      </div>
    </div>
  );
};

export default CardFrontal;