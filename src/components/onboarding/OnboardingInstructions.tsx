// src/app/components/onboarding/OnboardingInstructions.tsx

"use client";

import React from 'react';
import Image from 'next/image';
import { FaShareSquare, FaPlusSquare, FaCheckCircle, FaMobileAlt, FaChrome, FaBars } from 'react-icons/fa';

interface OnboardingInstructionsProps {
  os: 'ios' | 'android' | 'unknown';
  onClose: () => void;
}

const OnboardingInstructions: React.FC<OnboardingInstructionsProps> = ({ os, onClose }) => {

  // --- Contenido para iOS (CON IMÁGENES CORREGIDAS) ---
  const iOSInstructions = (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Instalar en tu iPhone o iPad
        </h1>
        <p className="text-lg text-primary font-medium">
          Sigue estos pasos para un acceso directo.
        </p>
      </div>
      <div className="space-y-6">
        {/* PASO 1 */}
        <div className="flex items-center gap-4">
          <div className="relative aspect-[9/16] w-28 rounded-md overflow-hidden shadow-md flex-shrink-0">
            <Image
              src="/images/instalar-ios-1-sin-fondo.png"
              alt="Compartir en Safari"
              fill={true}
              className="object-contain"
              sizes="112px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary flex items-center mb-1"><FaShareSquare className="mr-2" /> Toca &ldquo;Compartir&rdquo;</h3>
            <p className="text-sm text-text-muted">En la barra inferior de Safari, pulsa el ícono de &ldquo;Compartir&rdquo;.</p>
          </div>
        </div>
        {/* PASO 2 */}
        <div className="flex items-center gap-4">
           <div className="relative aspect-[9/16] w-28 rounded-md overflow-hidden shadow-md flex-shrink-0">
            <Image
              src="/images/instalar-ios-3-sin-fondo.png"
              alt="Agregar a Inicio"
              fill={true}
              className="object-contain"
              sizes="112px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary flex items-center mb-1"><FaPlusSquare className="mr-2" /> Busca &ldquo;Agregar a Inicio&rdquo;</h3>
            <p className="text-sm text-text-muted">Desliza hacia abajo y busca la opción <strong>&ldquo;Agregar a Inicio&rdquo;</strong>.</p>
          </div>
        </div>
        {/* PASO 3 */}
        <div className="flex items-center gap-4">
           <div className="relative aspect-[9/16] w-28 rounded-md overflow-hidden shadow-md flex-shrink-0">
            <Image
              src="/images/instalar-ios-4-sin-fondo.png"
              alt="Confirmar y Añadir"
              fill={true}
              className="object-contain"
              sizes="112px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary flex items-center mb-1"><FaCheckCircle className="mr-2" /> Confirma y Añade</h3>
            <p className="text-sm text-text-muted">Pulsa en <strong>&ldquo;Agregar&rdquo;</strong> arriba a la derecha para finalizar.</p>
          </div>
        </div>
        {/* PASO 4 */}
        <div className="flex items-center gap-4">
           <div className="relative aspect-[9/16] w-28 rounded-md overflow-hidden shadow-md flex-shrink-0">
            <Image
              src="/images/instalar-ios-5-sin-fondo.png"
              alt="Acceso Directo Creado"
              fill={true}
              className="object-contain"
              sizes="112px"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-secondary flex items-center mb-1"><FaMobileAlt className="mr-2" /> ¡Listo! Acceso Directo Creado</h3>
            <p className="text-sm text-text-muted">El ícono de <strong>Codys</strong> aparecerá en tu pantalla de inicio.</p>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Contenido para Android (SIN CAMBIOS) ---
  const androidInstructions = (
     <div>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-secondary mb-2">
          Instalar en tu Android
        </h1>
        <p className="text-lg text-primary font-medium">
          ¡Es muy fácil! Tu navegador te lo sugerirá.
        </p>
      </div>
      <div className="space-y-6 text-text-muted">
        <div>
            <h3 className="text-xl font-semibold text-text mb-2 flex items-center"><FaChrome className="mr-3"/>Opción Automática (Recomendada)</h3>
            <p>Al navegar con Chrome, es muy probable que aparezca un aviso o un botón para <strong>&ldquo;Instalar Codys&rdquo;</strong>. Simplemente acéptalo.</p>
        </div>
        <hr className="border-border"/>
        <div>
            <h3 className="text-xl font-semibold text-text mb-2 flex items-center"><FaBars className="mr-3"/>Opción Manual</h3>
            <p>1. Toca el menú de los <strong>tres puntos</strong> en la esquina superior derecha.</p>
            <p>2. Busca y selecciona la opción <strong>&ldquo;Instalar aplicación&rdquo;</strong>.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 bg-bg text-text rounded-lg max-w-md w-full">
      {/* Renderizado condicional */}
      {os === 'ios' && iOSInstructions}
      {os === 'android' && androidInstructions}

      {/* Botón para cerrar */}
      <div className="text-center mt-12">
        <button
          onClick={onClose}
          className="bg-primary text-bg font-semibold py-2 px-6 rounded-full hover:opacity-90 transition-opacity w-full"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export default OnboardingInstructions;