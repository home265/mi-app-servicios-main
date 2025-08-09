'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/solid';
import { useUserStore } from '@/store/userStore';
import BotonNavegacion from './BotonNavegacion';
import Avatar from './Avatar';
import Image from 'next/image'; // ✅ usar next/image

export default function BottomNavBar() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);
  const toggleHelpModal = useUserStore((s) => s.toggleHelpModal);

  return (
    <footer 
      className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-tarjeta/80 backdrop-blur-sm"
      style={{ boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)' }}
    >
      <div className="w-full h-full max-w-md mx-auto flex items-center justify-around px-2">
        {/* ---- Botón 1: Inicio ---- */}
        <BotonNavegacion
          label="Inicio"
          icon={<HomeIcon />}
          onClick={() => router.push('/bienvenida')}
        />

        {/* ---- Botón 2: Perfil (con Avatar) ---- */}
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

        {/* ---- Botón 3: Ayuda (Central y Prominente) ---- */}
        <div className="relative w-16 h-full flex justify-center">
          {/* Este div se posiciona con 'bottom' para que sobresalga */}
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-16 bg-primario rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 cursor-pointer"
            onClick={toggleHelpModal}
            role="button"
            aria-label="Mostrar ayuda"
          >
            <Image
              src="/icons/foco-claro.jpg"
              alt="Botón de ayuda"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* ---- Botón 4: Ajustes ---- */}
        <BotonNavegacion
          label="Ajustes"
          icon={<Cog6ToothIcon />}
          onClick={() => router.push('/ajustes')}
        />

        {/* ---- Botón 5: Volver ---- */}
        <BotonNavegacion
          label="Volver"
          icon={<ArrowUturnLeftIcon />}
          onClick={() => router.back()}
        />
      </div>
    </footer>
  );
}
