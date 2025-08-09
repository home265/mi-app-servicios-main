'use client';

import { useEffect, ReactNode } from 'react';
import { useUserStore } from '@/store/userStore';

/**
 * Hook personalizado para gestionar el contenido de ayuda contextual de una página.
 * Se encarga de registrar y limpiar el componente de ayuda en el estado global.
 * @param helpContent El componente React que se mostrará en el modal de ayuda.
 */
const useHelpContent = (helpContent: ReactNode | null) => {
  // Obtenemos la función para actualizar el contenido de ayuda desde nuestro store.
  const setHelpContent = useUserStore((state) => state.setHelpContent);

  useEffect(() => {
    // 1. Cuando el componente que usa este hook se monta (aparece en pantalla),
    //    establecemos su contenido de ayuda específico en el store.
    setHelpContent(helpContent);

    // 2. Cuando el componente se desmonta (el usuario navega a otra página),
    //    la función de limpieza se ejecuta y borra el contenido de ayuda.
    //    Esto evita que se muestre la ayuda incorrecta en la siguiente pantalla.
    return () => {
      setHelpContent(null);
    };
  }, [helpContent, setHelpContent]); // Se ejecuta solo si el contenido o la función cambian.
};

export default useHelpContent;