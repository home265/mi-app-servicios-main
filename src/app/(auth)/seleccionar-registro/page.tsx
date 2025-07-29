// src/app/(auth)/seleccionar-registro/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SeleccionRolCard from '@/app/components/auth/SeleccionRolCard';
import Modal from '@/app/components/common/Modal';
import Button from '@/app/components/ui/Button';

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
          <Button onClick={() => setModalVisible(false)}>
            Entendido
          </Button>
        </div>
      </Modal>

      <div className="relative flex min-h-screen flex-col items-center justify-center bg-fondo text-texto-principal px-5">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full flex justify-center">
          <Image
            src="/logo1.png" // Logo estático del tema oscuro
            alt="Logo CODYS"
            width={360}
            height={204}
            priority
            className="h-auto w-60 flex-shrink-0 object-contain md:w-72"
          />
        </div>
        
        {/* Se eliminaron las clases dark:* del contenedor */}
        <div
          className={`
            w-full max-w-md space-y-6
            rounded-xl border border-borde-tarjeta shadow-card
            bg-tarjeta text-texto-principal
            p-6 md:p-8
            mt-55 mb-15
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
                  {/* Checkbox estilizado para ser coherente con el tema */}
                  <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="h-5 w-5 rounded-sm border-borde-tarjeta bg-transparent text-primario focus:ring-2 focus:ring-primario focus:ring-offset-fondo"
                  />
                  {/* Label estilizado para ser coherente con el tema */}
                  <label htmlFor="terms" className="text-sm font-light text-texto-secundario">
                      Acepto los{' '}
                      <Link href="/terminos-y-condiciones" className="underline hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Términos
                      </Link>
                      {' y la '}
                      <Link href="/politica-de-privacidad" className="underline hover:text-primario" target="_blank" rel="noopener noreferrer">
                          Política de Privacidad
                      </Link>.
                  </label>
              </div>
          </div>

          <p className="text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            {/* Se eliminó la clase dark:* del enlace */}
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