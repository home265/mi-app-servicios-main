'use client';

import { useEffect, type ReactNode } from 'react';
import { useUserStore } from '@/store/userStore';

/**
 * Hook personalizado para gestionar el contenido de ayuda contextual de una página.
 * Se encarga de registrar y limpiar el componente de ayuda en el estado global.
 * @param helpContent El componente React que se mostrará en el modal de ayuda.
 */
const useHelpContent = (helpContent: ReactNode | null) => {
  const setHelpContent = useUserStore((state) => state.setHelpContent);

  useEffect(() => {
    // 1. Cuando el componente se monta, establecemos su contenido de ayuda.
    setHelpContent(helpContent);

    // 2. Cuando el componente se desmonta, limpiamos el contenido de ayuda.
    return () => {
      setHelpContent(null);
    };
    // --- INICIO DE LA CORRECCIÓN ---
    // Al quitar 'helpContent' de las dependencias, evitamos el bucle infinito.
    // Le decimos a React: "Ejecuta este efecto solo una vez al montar el componente".
    // El comentario de abajo es para decirle a ESLint que confiamos en esta decisión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setHelpContent]);
  // --- FIN DE LA CORRECCIÓN ---
};

export default useHelpContent;