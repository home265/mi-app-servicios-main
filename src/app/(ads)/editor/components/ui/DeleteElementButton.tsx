// src/app/(ads)/editor/components/ui/DeleteElementButton.tsx
'use client';

import React from 'react';
import Button from '@/app/components/ui/Button'; // Tu componente Button general
import { useEditorStore } from '../../hooks/useEditorStore'; // Ajusta la ruta si es necesario
import { Trash2 } from 'lucide-react';

interface DeleteElementButtonProps {
  elementId: string | undefined | null; // ID del elemento a eliminar
  onElementDeleted: () => void; // Función a llamar después de eliminar (ej. para cerrar el modal de la herramienta)
  className?: string; // Para estilos adicionales si es necesario
  title?: string; // Tooltip para el botón
}

export default function DeleteElementButton({
  elementId,
  onElementDeleted,
  className = '',
  title = "Eliminar elemento",
}: DeleteElementButtonProps) {
  const removeElement = useEditorStore(state => state.removeElement);

  const handleDelete = () => {
    if (!elementId) {
      console.warn("DeleteElementButton: No se proporcionó elementId para eliminar.");
      return;
    }

    const wantsToDelete = window.confirm("¿Estás seguro de que deseas eliminar este elemento?");
    if (wantsToDelete) {
      removeElement(elementId);
      onElementDeleted(); // Llama a la función callback (ej. onClose de la herramienta)
    }
  };

  // No mostrar el botón si no hay un elementId válido para eliminar
  if (!elementId) {
    return null;
  }

  return (
    <Button
      variant="ghost" // Usa "ghost" para un look de icono, o "danger" si prefieres un fondo rojo
      onClick={handleDelete}
      title={title}
      className={`p-2 text-red-500 hover:bg-red-500/10 rounded-full ${className}`} // Estilos base
      aria-label={title}
    >
      <Trash2 size={20} />
    </Button>
  );
}