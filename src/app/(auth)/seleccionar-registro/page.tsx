'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';
import Modal from '@/app/components/common/Modal';
// --- 1. IMPORTAR LOS ÍCONOS DE CANDADO ---
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/solid';

export default function SeleccionarRegistroPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);

  const handleRoleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!acceptedTerms) {
      e.preventDefault();
      setModalVisible(true);
    }
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
          <button onClick={() => setModalVisible(false)} className="btn-primary">
            Entendido
          </button>
        </div>
      </Modal>

      <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto-principal px-5">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
          <Image
            src="/logo1.png"
            alt="Logo CODYS"
            width={360}
            height={204}
            priority
            className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
          />
        </div>
        
        <div
          className={`
            w-full max-w-md space-y-6
            rounded-2xl bg-tarjeta text-texto-principal
            p-6 md:p-8
            shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
            mt-52 mb-10
          `}
        >
          <h1 className="text-center text-2xl font-bold">Elige tu tipo de registro</h1>

          <div className="space-y-4">
            {/* --- 2. SE AÑADEN LOS ÍCONOS DE CANDADO A CADA OPCIÓN --- */}
            <Link
              href={acceptedTerms ? "/registro/usuario" : "#"}
              className={`relative block transition-opacity duration-300 ${!acceptedTerms ? "opacity-50 cursor-not-allowed" : "group"}`}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="usuario" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-texto-secundario">
                {acceptedTerms 
                  ? <LockOpenIcon className="h-5 w-5 text-primario transition-opacity duration-300" /> 
                  : <LockClosedIcon className="h-5 w-5 transition-opacity duration-300" />
                }
              </div>
            </Link>
            <Link
              href={acceptedTerms ? "/registro/prestador" : "#"}
              className={`relative block transition-opacity duration-300 ${!acceptedTerms ? "opacity-50 cursor-not-allowed" : "group"}`}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="prestador" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-texto-secundario">
                {acceptedTerms 
                  ? <LockOpenIcon className="h-5 w-5 text-primario transition-opacity duration-300" /> 
                  : <LockClosedIcon className="h-5 w-5 transition-opacity duration-300" />
                }
              </div>
            </Link>
            <Link
              href={acceptedTerms ? "/registro/comercio" : "#"}
              className={`relative block transition-opacity duration-300 ${!acceptedTerms ? "opacity-50 cursor-not-allowed" : "group"}`}
              onClick={handleRoleClick}
              aria-disabled={!acceptedTerms}
            >
              <SeleccionRolCard rol="comercio" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-texto-secundario">
                {acceptedTerms 
                  ? <LockOpenIcon className="h-5 w-5 text-primario transition-opacity duration-300" /> 
                  : <LockClosedIcon className="h-5 w-5 transition-opacity duration-300" />
                }
              </div>
            </Link>
          </div>

          <div className="border-t border-borde-tarjeta pt-4">
              <div className="flex items-center justify-center">
                <label htmlFor="terms-toggle" className="flex items-center cursor-pointer text-sm font-light text-texto-secundario select-none">
                  <span className="pr-3">
                      Acepto los{' '}
                      <Link href="/terminos-y-condiciones" className="underline hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Términos
                      </Link>
                      {' y la '}
                      <Link href="/politica-de-privacidad" className="underline hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Política de Privacidad
                      </Link>.
                  </span>
                  <div className="relative">
                      <input
                          type="checkbox"
                          id="terms-toggle"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-fondo rounded-full shadow-[inset_1px_1px_4px_rgba(0,0,0,0.6)] peer-checked:bg-primario transition-colors duration-300"></div>
                      <div className="absolute left-1 top-1 w-5 h-5 bg-texto-secundario rounded-full transition-transform duration-300 ease-in-out peer-checked:translate-x-5 peer-checked:bg-fondo"></div>
                  </div>
                </label>
              </div>
          </div>

          <p className="text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-medium text-secundario hover:underline"
            >
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}