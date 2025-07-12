// src/app/components/common/BotonAyuda.tsx
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom'; // <-- 1. IMPORTAMOS createPortal
import Image from 'next/image';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  children: ReactNode;
}

export default function BotonAyuda({ children }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);
  // Estado para asegurarnos de que el código solo se ejecute en el cliente (necesario para portales)
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);

  // El contenido del modal ahora está en una variable
  const modalContent = (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
      onClick={cerrarModal}
    >
      <div
        className="
          relative w-full max-w-2xl p-8 pt-12 
          bg-background-card text-texto-principal
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
      {/* El botón no cambia */}
      <button
        onClick={abrirModal}
        className="
          w-12 h-12 rounded-full
          flex items-center justify-center 
          bg-background-alt shadow-lg
          transition-transform transform 
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primario
        "
        aria-label="Mostrar ayuda"
      >
        <Image src="/icons/foco-oscuro.jpg" alt="Ícono de ayuda modo claro" width={32} height={32} className="dark:hidden" />
        <Image src="/icons/foco-claro.jpg" alt="Ícono de ayuda modo oscuro" width={32} height={32} className="hidden dark:block" />
      </button>

      {/* --- 2. USAMOS EL PORTAL --- */}
      {/* Si el modal debe estar abierto y estamos en el cliente, "teletransporta" el modalContent al final del <body> */}
      {modalAbierto && isClient && createPortal(modalContent, document.body)}
    </>
  );
}