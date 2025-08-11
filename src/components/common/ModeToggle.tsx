// src/app/components/common/ModeToggle.tsx
import React from 'react';
import { useUserStore } from '@/store/userStore';
import Button from '@/components/ui/Button';

/**
 * Componente para alternar entre modo usuario y modo prestador.
 * Solo se muestra si el usuario tiene rol principal 'prestador' o 'comercio'.
 */
const ModeToggle: React.FC = () => {
  const { originalRole, actingAs, toggleActingMode } = useUserStore();

  // Solo mostrar para prestadores o comercios
  if (!originalRole || originalRole === 'usuario') return null;

  const label =
    actingAs === 'user' ? 'Ver como prestador' : 'Ver como usuario';

  return (
    <Button
      onClick={toggleActingMode}
      variant="ghost"
      className="ml-2"
    >
      {label}
    </Button>
  );
};

export default ModeToggle;
