// src/app/components/bienvenida/BotonDeAccion.tsx
import React from 'react';

// Definimos los tipos para las props del componente.
// Esto asegura que siempre se pasen los datos correctos.
interface BotonDeAccionProps {
  label: string;
  // El Icono es un componente de React que recibe props de un SVG.
  Icon: React.ComponentType<React.ComponentProps<'svg'>>;
  onClick: () => void;
  // 'children' se usará para pasar elementos extra, como el contador de notificaciones.
  children?: React.ReactNode;
}

export default function BotonDeAccion({
  label,
  Icon,
  onClick,
  children,
}: BotonDeAccionProps) {
  return (
    <button
      onClick={onClick}
      className="
        relative flex flex-col items-center justify-center
        aspect-square w-full max-w-[180px]
        rounded-xl text-texto-principal
        bg-tarjeta
        transition-all duration-150 ease-in-out

        /* --- Efecto de Relieve (Outset) --- */
        /* Sombra oscura abajo-derecha y sombra clara arriba-izquierda para dar volumen */
        shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]

        /* --- Efecto al pasar el mouse (Hover) --- */
        /* Aumenta ligeramente el brillo y la sombra para destacar */
        hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]

        /* --- Efecto al Presionar (Active) --- */
        /* Encoge el botón, baja el brillo e invierte la sombra (Inset) para que parezca hundido */
        active:scale-95 active:brightness-90
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
      "
    >
      {/* Renderiza el contenido extra (notificaciones) si existe */}
      {children}

      <Icon className="w-10 h-10 mb-2" />
      <span className="text-sm text-center px-1">{label}</span>
    </button>
  );
}