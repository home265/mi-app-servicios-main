'use client';

import React from 'react';

interface BotonNavegacionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean; // Opcional, por si en el futuro queremos resaltar el botón activo
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
      className={`flex flex-col items-center justify-center gap-1 w-16 h-full text-center transition-all duration-150 ease-in-out rounded-lg focus:outline-none focus:ring-2 focus:ring-primario/50 active:scale-90 ${
        isActive ? 'text-primario' : 'text-texto-secundario hover:text-texto-principal'
      }`}
    >
      {/* Contenedor del ícono */}
      <div className="w-6 h-6">
        {icon}
      </div>
      {/* Etiqueta de texto */}
      <span className="text-xs font-medium">
        {label}
      </span>
    </button>
  );
};

export default BotonNavegacion;