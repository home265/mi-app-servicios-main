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
      // --- INICIO DE LA CORRECCIÓN: ESTILO "PLANO" ---
      // Se eliminan todos los estilos de fondo (bg-tarjeta) y sombras (shadow-...).
      // El feedback visual se da ahora solo con el color del texto/icono y la escala.
      className={`
        flex flex-col items-center justify-center
        w-16 h-16 p-1
        transition-all duration-150 ease-in-out
        focus:outline-none
        active:scale-95

        ${isActive ? 'text-primario' : 'text-texto-secundario hover:text-texto-principal'}
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