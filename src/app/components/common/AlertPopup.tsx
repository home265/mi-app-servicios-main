// src/app/components/common/AlertPopup.tsx
'use client';

import Modal from './Modal'; // Importamos tu modal base

interface AlertPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export default function AlertPopup({
  isOpen,
  onClose,
  title,
  message,
  buttonText = 'Entendido', // Le damos un valor por defecto
}: AlertPopupProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      {/* Este es el contenido que irá dentro de tu modal genérico */}
      <div className="flex flex-col items-center gap-y-4 pt-2">
        <p className="text-sm text-texto-secundario text-center">
          {message}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="btn-primary w-full sm:w-auto px-6" // Adapta las clases a tu estilo
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}