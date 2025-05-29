'use client';
import React from 'react';

interface BadgeProps {
  /** Número a mostrar; si es 0 u omites `count`, el badge no se renderiza. */
  count?: number;
  /** Si `dot` es `true`, muestra solo un punto rojo sin número. */
  dot?: boolean;
}

/**
 * Pequeño indicador (círculo rojo) para notificaciones sin leer.
 *
 * Uso:
 * <div className="relative">
 *   <Icon ... />
 *   <Badge count={3} />           // con número
 *   <Badge dot count={1} />       // solo punto
 * </div>
 */
const Badge: React.FC<BadgeProps> = ({ count = 0, dot = false }) => {
  if ((!dot && count <= 0) || (dot && count <= 0)) return null;

  return (
    <span
      className="
        absolute -top-1 -right-1 z-10
        flex items-center justify-center
        bg-red-600 text-white
        rounded-full text-[10px] leading-none
        px-1.5 min-w-[1rem] h-4
        select-none
      "
    >
      {dot ? '' : count}
    </span>
  );
};

export default Badge;
