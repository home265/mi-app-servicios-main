// src/app/components/common/BotonAyuda.tsx
'use client';

import { useState, type ReactNode } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface Props {
  children: ReactNode;
}

export default function BotonAyuda({ children }: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const abrirModal = () => setModalAbierto(true);
  const cerrarModal = () => setModalAbierto(false);

  // Define los colores usando las variables CSS para que el tema funcione automáticamente.
  const estiloBoton = {
    backgroundColor: 'var(--color-primario)',
    color: '#FFFFFF', // El color del ícono siempre será blanco.
  };

  const estiloModal = {
    backgroundColor: 'var(--color-tarjeta)',
    color: 'var(--color-texto-principal)',
    borderColor: 'var(--color-borde-tarjeta)',
  };

  return (
    <>
      {/* 1. EL BOTÓN FLOTANTE */}
      <button
        onClick={abrirModal}
        style={estiloBoton}
        className="
          fixed bottom-6 right-6 z-40 
          w-14 h-14 rounded-full 
          flex items-center justify-center 
          shadow-lg 
          transition-transform transform 
          hover:scale-110 active:scale-95
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primario
        "
        aria-label="Mostrar ayuda"
      >
        <QuestionMarkCircleIcon className="w-8 h-8" />
      </button>

      {/* 2. EL MODAL */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm"
          onClick={cerrarModal}
        >
          <div
            style={estiloModal}
            className="relative w-full max-w-2xl p-8 pt-12 border rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón para cerrar el modal */}
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 text-texto-secundario hover:text-texto-principal"
              aria-label="Cerrar"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            {/* Contenido dinámico de las instrucciones */}
            {children}
          </div>
        </div>
      )}
    </>
  );
}