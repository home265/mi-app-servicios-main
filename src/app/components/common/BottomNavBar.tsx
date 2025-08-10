'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline';
import { useUserStore } from '@/store/userStore';
import BotonNavegacion from './BotonNavegacion';
import Avatar from './Avatar';
import Image from 'next/image';

export default function BottomNavBar() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const toggleHelpModal = useUserStore((s) => s.toggleHelpModal);

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-40 h-24 bg-tarjeta pb-3
                 border-t border-black/20"
    >
      <div className="w-full h-full max-w-md mx-auto flex items-center justify-around px-2">
        
        <BotonNavegacion
          label="Inicio"
          icon={<HomeIcon />}
          onClick={() => router.push('/bienvenida')}
        />

        <BotonNavegacion
          label="Perfil"
          icon={
            <Avatar
              selfieUrl={currentUser?.selfieURL}
              nombre={currentUser?.nombre || 'Usuario'}
              size={28}
            />
          }
          onClick={() => router.push('/perfil')}
        />

        {/* --- INICIO DE LA CORRECCIÓN --- */}
        {/* Este div sigue sirviendo para mantener el espaciado correcto en la barra */}
        <div className="relative w-16 h-16 flex justify-center">
          {/* Se eliminan las clases de fondo, borde y sombra del div interior */}
          <div 
            className="
              flex items-center justify-center 
              cursor-pointer
              transition-transform duration-150 ease-in-out
              active:scale-90
              hover:opacity-80
            "
            onClick={toggleHelpModal}
            role="button"
            aria-label="Mostrar ayuda"
          >
            <Image
              src="/icons/foco-claro.jpg"
              alt="Botón de ayuda"
              width={50}
              height={50}
              className="object-contain"
              priority
            />
          </div>
        </div>
        {/* --- FIN DE LA CORRECCIÓN --- */}

        <BotonNavegacion
          label="Ajustes"
          icon={<Cog6ToothIcon />}
          onClick={() => router.push('/ajustes')}
        />

        <BotonNavegacion
          label="Volver"
          icon={<ArrowUturnLeftIcon />}
          onClick={() => router.back()}
        />
      </div>
    </footer>
  );
}