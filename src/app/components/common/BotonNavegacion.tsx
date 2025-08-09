'use client';

import React from 'react';

interface BotonNavegacionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean; 
}

const BotonNavegacion: React.FC<BotonNavegacionProps> = ({
  icon,
  label,
  onClick,
  isActive = false,
}) => {
  return (
    <button
      onClick={onClick}
      // --- INICIO DE LA CORRECCIÓN ---
      // Se aplican estilos similares a los de 'BotonDeAccion' para un look 3D
      className={`
        flex flex-col items-center justify-center
        w-16 h-16 p-1
        rounded-2xl text-texto-principal
        bg-tarjeta
        transition-all duration-150 ease-in-out
        focus:outline-none

        /* Efecto de Relieve (Outset) */
        shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]

        /* Efecto al pasar el mouse (Hover) */
        hover:brightness-110

        /* Efecto al Presionar (Active) para dar la sensación de pulsación */
        active:scale-95 active:brightness-90
        active:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4)]

        ${isActive ? 'text-primario' : 'text-texto-secundario'}
      `}
      // --- FIN DE LA CORRECCIÓN ---
    >
      {/* Contenedor del ícono */}
      <div className="w-6 h-6">
        {icon}
      </div>
      {/* Etiqueta de texto */}
      <span className="text-xs font-medium mt-1">
        {label}
      </span>
    </button>
  );
};

export default BotonNavegacion;