// src/app/components/common/BotonAyuda.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  children: ReactNode;
}

export default function BotonAyuda({ children }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);

  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={cerrarModal}
    >
      <div
        className="
          relative w-full max-w-2xl p-8 pt-12 
          bg-tarjeta text-texto-principal
          border border-borde-tarjeta rounded-xl shadow-2xl 
          max-h-[85vh] overflow-y-auto
        "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={cerrarModal}
          className="absolute top-4 right-4 text-texto-secundario hover:text-texto-principal"
          aria-label="Cerrar"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
        {children}
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={abrirModal}
        aria-label="Mostrar ayuda"
        className="
          w-12 h-12 rounded-full
          flex items-center justify-center 
          bg-tarjeta text-texto-principal
          transition-all duration-150 ease-in-out

          /* Efecto de Relieve (Outset) */
          shadow-[4px_4px_8px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.05)]

          /* Efecto al pasar el mouse (Hover) */
          hover:brightness-110 hover:shadow-[5px_5px_10px_rgba(0,0,0,0.3),-3px_-3px_8px_rgba(255,255,255,0.05)]

          /* Efecto al Presionar (Active) */
          active:scale-95 active:brightness-90
          active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]
        "
      >
        <div className="w-7 h-7 relative">
          {/* ---- MODIFICADO ---- */}
          <Image
            src="/icons/foco-claro.jpg"
            alt="Ícono de ayuda"
            fill
            sizes="32px"
            className="object-contain"
          />
        </div>
      </button>

      {/* La lógica del portal para el modal se mantiene intacta */}
      {modalAbierto && isClient && createPortal(modalContent, document.body)}
    </>
  );
}