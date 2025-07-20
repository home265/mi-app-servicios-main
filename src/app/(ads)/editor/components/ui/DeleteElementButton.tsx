// src/app/(ads)/editor/components/ui/DeleteElementButton.tsx
'use client';

import React, { useState } from 'react';
import Button from '@/app/components/ui/Button';
import { useEditorStore } from '../../hooks/useEditorStore';
import { Trash2 } from 'lucide-react';
import Modal from '@/app/components/common/Modal'; // 1. Importar el componente Modal

interface DeleteElementButtonProps {
  elementId: string | undefined | null;
  onElementDeleted: () => void;
  className?: string;
  title?: string;
}

export default function DeleteElementButton({
  elementId,
  onElementDeleted,
  className = '',
  title = "Eliminar elemento",
}: DeleteElementButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false); // 2. Añadir estado para el modal
  const removeElement = useEditorStore(state => state.removeElement);

  // 3. La lógica de borrado se mueve a su propia función
  const performDelete = () => {
    if (!elementId) {
      console.warn("DeleteElementButton: No se proporcionó elementId para eliminar.");
      return;
    }
    removeElement(elementId);
    onElementDeleted(); // Llama a la función callback (ej. onClose de la herramienta)
    setIsModalOpen(false); // Cierra el modal después de borrar
  };

  // 4. El handler del botón ahora solo abre el modal
  const handleDeleteClick = () => {
    if (!elementId) {
      console.warn("DeleteElementButton: No se proporcionó elementId para eliminar.");
      return;
    }
    setIsModalOpen(true);
  };

  if (!elementId) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        onClick={handleDeleteClick} // 5. El botón ahora llama al nuevo handler
        title={title}
        className={`p-2 text-red-500 hover:bg-red-500/10 rounded-full ${className}`}
        aria-label={title}
      >
        <Trash2 size={20} />
      </Button>

      {/* 6. Añadir el Modal al JSX */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Confirmar Eliminación"
      >
        <p className="text-sm text-[var(--color-texto-secundario)] mb-6">
          ¿Estás seguro de que deseas eliminar este elemento de forma permanente?
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={performDelete}>
            Sí, Eliminar
          </Button>
        </div>
      </Modal>
    </>
  );
}