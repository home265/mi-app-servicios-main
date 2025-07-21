// src/app/(auth)/seleccionar-registro/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';

// --- NUEVO: Importamos los componentes Modal y Button ---
import Modal from '@/app/components/common/Modal';
import Button from '@/app/components/ui/Button';

export default function SeleccionarRegistroPage() {
  const { resolvedTheme } = useTheme();
  const lightLogo = '/logo2.png';
  const darkLogo  = '/logo1.png';

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  // --- NUEVO: Estado para controlar la visibilidad del modal ---
  const [isModalVisible, setModalVisible] = useState(false);

  // --- NUEVO: Handler para el clic en las tarjetas de rol ---
  const handleRoleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Si los términos no están aceptados...
    if (!acceptedTerms) {
      // 1. Prevenimos que el link navegue
      e.preventDefault();
      // 2. Mostramos el modal
      setModalVisible(true);
    }
    // Si los términos sí están aceptados, esta función no hace nada y el Link funciona normalmente.
  };

  return (
    <>
      <Modal
        isOpen={isModalVisible}
        onClose={() => setModalVisible(false)}
        title="Términos y Condiciones"
      >
        <p className="text-base text-texto-secundario">
          Para continuar, primero debes leer y aceptar los Términos y la Política de Privacidad.
        </p>
        <div className="mt-5 flex justify-end">
          <Button onClick={() => setModalVisible(false)}>
            Entendido
          </Button>
        </div>
      </Modal>

      {/* Mantenemos la estructura del contenedor principal */}
      <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-5">
        
        {/* PASO 1: Envolvemos el logo en un 'div' con posicionamiento absoluto */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
          <Image
            src={resolvedTheme === 'dark' ? darkLogo : lightLogo}
            alt="Logo CODYS"
            // PASO 2: Unificamos el tamaño del logo con las otras pantallas
            width={360}
            height={204}
            priority
            // PASO 3: Unificamos las clases y quitamos el margen 'mb-12'
            className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
          />
        </div>
        
        {/* El resto del contenido se centrará automáticamente */}
        <div
          className={`
            w-full max-w-md space-y-6
            rounded-xl border border-borde-tarjeta shadow-card
            bg-tarjeta text-texto
            p-6 md:p-8
            dark:bg-tarjeta dark:text-texto mt-55 mb-15
          `}
        >
          <h1 className="text-center text-2xl font-bold">Elige tu tipo de registro</h1>

          <div className="grid gap-4">
            <Link
              href={acceptedTerms ? "/registro/usuario" : "#"}
              className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="usuario" />
            </Link>
            <Link
              href={acceptedTerms ? "/registro/prestador" : "#"}
              className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="prestador" />
            </Link>
            <Link
              href={acceptedTerms ? "/registro/comercio" : "#"}
              className={!acceptedTerms ? "opacity-50 cursor-not-allowed" : ""}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="comercio" />
            </Link>
          </div>

          <div className="border-t border-borde-tarjeta pt-4">
              <div className="flex items-center justify-center space-x-3">
                  <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-5 w-5 rounded-sm border-gray-300 text-secundario focus:ring-secundario"
                  />
                  <label htmlFor="terms" className="text-sm font-light text-gray-600 dark:text-gray-300">
                      Acepto los{' '}
                      <Link href="/terminos-y-condiciones" className="underline hover:text-secundario dark:hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Términos
                      </Link>
                      {' y la '}
                      <Link href="/politica-de-privacidad" className="underline hover:text-secundario dark:hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Política de Privacidad
                      </Link>.
                  </label>
              </div>
          </div>

          <p className="text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-medium text-secundario hover:underline dark:text-primario"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}