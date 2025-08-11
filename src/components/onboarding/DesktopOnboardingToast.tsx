// src/app/components/onboarding/DesktopOnboardingToast.tsx

"use client";

import React from 'react';
// --- MODIFICACIÓN: Se añade el ícono de Edge ---
import { FaChrome, FaSafari, FaEdge } from 'react-icons/fa';
import { XMarkIcon } from '@heroicons/react/24/solid';

// --- MODIFICACIÓN: Se actualiza la interfaz con los nuevos tipos de plataforma ---
interface DesktopOnboardingToastProps {
  platform: 'desktop-chrome' | 'desktop-edge' | 'desktop-safari';
  onClose: () => void;
}

const DesktopOnboardingToast: React.FC<DesktopOnboardingToastProps> = ({ platform, onClose }) => {

  // --- INICIO: LÓGICA MEJORADA PARA ELEGIR EL ÍCONO ---
  // Usamos un switch para determinar qué ícono mostrar. Es más limpio que un if/else anidado.
  const getIcon = () => {
    switch (platform) {
      case 'desktop-chrome':
        return <FaChrome className="text-2xl text-blue-500" />;
      case 'desktop-edge':
        return <FaEdge className="text-2xl text-sky-500" />;
      case 'desktop-safari':
        return <FaSafari className="text-2xl text-blue-600" />;
      default:
        return null; // No debería ocurrir gracias a TypeScript
    }
  };
  // --- FIN: LÓGICA MEJORADA ---

  // La descripción es la misma para Chrome y Edge.
  const description = (platform === 'desktop-chrome' || platform === 'desktop-edge')
      ? "Busca el ícono de instalación en la barra de direcciones para un acceso más rápido."
      : "Ve al menú 'Archivo' y selecciona 'Agregar al Dock' para instalar la app.";

  return (
    <div className="flex items-center justify-between w-full max-w-sm p-4 bg-fondo rounded-lg shadow-lg border border-border">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-texto">
            Instala la App en tu Escritorio
          </p>
          <p className="text-sm text-text-muted">
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="ml-4 p-1 rounded-full hover:bg-bg-secondary transition-colors"
        aria-label="Cerrar"
      >
        <XMarkIcon className="h-5 w-5 text-text-muted" />
      </button>
    </div>
  );
};

export default DesktopOnboardingToast;