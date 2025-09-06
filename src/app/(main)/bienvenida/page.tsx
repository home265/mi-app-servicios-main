'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  BookOpenIcon,
  BriefcaseIcon,
  UserCircleIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Avatar from '@/components/common/Avatar';
// --- INICIO: CAMBIO DE NOMBRE DEL COMPONENTE ---
// Se asume que has renombrado el archivo como conversamos
import BotonGestionSuscripcion from './components/BotonGestionSuscripcion';
// --- FIN: CAMBIO DE NOMBRE DEL COMPONENTE ---
import { getCvByUid } from '@/lib/services/cvService';
import AyudaBienvenida from '@/components/ayuda-contenido/AyudaBienvenida';
import BotonDeAccion from '@/components/bienvenida/BotonDeAccion';
import { useUserStore } from '@/store/userStore';
import useHelpContent from '@/lib/hooks/useHelpContent';
import ContenedorCalculadoras from './components/ContenedorCalculadoras';
import BotonInsumos from './components/BotonInsumos';


const toTitleCase = (s: string) =>
  s
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

type IconSvg = React.ComponentType<React.ComponentProps<'svg'>>;
interface Action {
  id: string;
  label: string;
  Icon?: IconSvg;
  path?: string;
  component?: React.ReactNode;
}

// --- INICIO: LÓGICA DE BOTONES SIMPLIFICADA ---
// Se eliminan los botones 'crearPub' y 'editarPub' que eran redundantes.
const base: Record<'prestador' | 'comercio', Action[]> = {
  prestador: [
    { id: 'trabajos', label: 'Trabajos', Icon: BriefcaseIcon, path: '/trabajos' },
    { id: 'empleados', label: 'Empleados', Icon: UserGroupIcon, path: '/empleados' },
    {
      id: 'gestionSuscripcion',
      label: 'Configurar Suscripción',
      component: <BotonGestionSuscripcion />,
    },
    {
      id: 'paginas',
      label: 'Guía Local',
      Icon: BookOpenIcon,
      path: '/paginas-amarillas/buscar',
    },
    { id: 'modo', label: 'Modo Usuario', Icon: UserCircleIcon, path: '#' },
  ],
  comercio: [
    { id: 'empleados', label: 'Empleados', Icon: UserGroupIcon, path: '/empleados' },
    {
      id: 'gestionSuscripcion',
      label: 'Configurar Suscripción',
      component: <BotonGestionSuscripcion />,
    },
    {
      id: 'paginas',
      label: 'Guía Local',
      Icon: BookOpenIcon,
      path: '/paginas-amarillas/buscar',
    },
    { id: 'modo', label: 'Modo Usuario', Icon: UserCircleIcon, path: '#' },
  ],
};
// --- FIN: LÓGICA DE BOTONES SIMPLIFICADA ---

export default function BienvenidaPage() {
  const router = useRouter();
  useHelpContent(<AyudaBienvenida />); // Corregido para usar la ayuda correcta
  const user = useUserStore((s) => s.currentUser);
  const pinOk = useUserStore((s) => s.isPinVerifiedForSession);
  const toggleMode = useUserStore((s) => s.toggleActingMode);
  const actingAs = useUserStore((s) => s.actingAs);
  const { jobRequests, jobResponses } = useUserStore((s) => s.unread);

  const [hasCv, setCv] = useState<boolean | null>(null);
  
  // Se eliminan los estados 'hasSubscription' y 'hasPublication' que ya no son necesarios aquí.

  useEffect(() => {
    if (user?.rol !== 'usuario') return;
    (async () => {
      if (!user.uid) return;
      try {
        const cvData = await getCvByUid(user.uid);
        setCv(cvData !== null);
      } catch {
        setCv(false);
      }
    })();
  }, [user]);
  
  // La lógica de verificación de suscripción ya no es necesaria aquí.
  // La lógica de verificación de publicación tampoco.

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (!pinOk) router.replace('/pin-entry');
  }, [user, pinOk, router]);

  const loading =
    !user ||
    !pinOk ||
    (user.rol === 'usuario' && hasCv === null);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-fondo text-primario">
        <span className="animate-pulse text-lg">Cargando…</span>
      </div>
    );
  }

  let actions: Action[] = [];
  if (user.rol === 'usuario') {
    actions = [
      { id: 'buscar', label: 'Buscar', Icon: MagnifyingGlassIcon, path: '/busqueda' },
      hasCv
        ? { id: 'editCv', label: 'Editar CV', Icon: PencilSquareIcon, path: '/cv' }
        : { id: 'newCv', label: 'Crear CV', Icon: DocumentPlusIcon, path: '/cv' },
      {
        id: 'pagUsr',
        label: 'Guía Local',
        Icon: BookOpenIcon,
        path: '/paginas-amarillas/buscar',
      },
    ];
  } else {
    // La lógica de filtrado de botones ya no es necesaria, es más simple.
    actions = base[user.rol as 'prestador' | 'comercio'];
  }

  const fullName = user.nombre ? toTitleCase(user.nombre) : '';

  const delayedNavigate = (path: string) => {
    setTimeout(() => {
      router.push(path);
    }, 150);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">
        {/* --- INICIO: CORRECCIÓN DEL HEADER --- */}
        {/* Se cambia 'justify-between' por 'justify-center' para centrar el contenido */}
        <header className="flex items-center justify-center py-4 mt-6">
          <button
            onClick={() => delayedNavigate('/perfil')}
            aria-label="Ver mi perfil"
            // Se ajusta el padding para hacerlo más alto que ancho (px-4 py-5)
            className="flex items-center gap-8 px-10 py-5 rounded-xl bg-tarjeta text-texto-principal transition-all duration-150 ease-in-out shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.02)] hover:brightness-110 active:scale-[0.98] active:brightness-90"
          >
            <Avatar selfieUrl={user.selfieURL ?? undefined} nombre={fullName} size={64} />
            <div className="text-left">
              <p className="text-lg font-semibold">{`Hola, ${fullName}`}</p>
            </div>
          </button>
        </header>
        {/* --- FIN: CORRECCIÓN DEL HEADER --- */}

        <main className="flex-grow flex justify-center items-start pt-10 pb-6">
          <div className="w-full grid gap-5 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]">
            {actions.map((a) => {
              if (a.component) return <React.Fragment key={a.id}>{a.component}</React.Fragment>;
              if (!a.Icon) return null;
              const Icon = a.Icon;

              const click = () => {
                if (a.id === 'trabajos' && actingAs === 'user') {
                  toggleMode();
                  delayedNavigate('/trabajos');
                  return;
                }
                if (a.id.startsWith('modo')) {
                  toggleMode();
                  delayedNavigate('/busqueda');
                  return;
                }
                // La lógica para 'editarPub' ya no es necesaria aquí
                if (a.path && a.path !== '#') delayedNavigate(a.path);
              };

              const unreadCount =
                a.id === 'trabajos' ? jobRequests : a.id === 'buscar' ? jobResponses : 0;

              return (
                <BotonDeAccion key={a.id} label={a.label} Icon={Icon} onClick={click}>
                  {unreadCount > 0 && (
                    <div className="absolute top-2 right-2 h-6 w-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-tarjeta">
                      {unreadCount}
                    </div>
                  )}
                </BotonDeAccion>
              );
            })}
            
            {/* --- AQUÍ SE AÑADE EL COMPONENTE DE CALCULADORAS --- */}
            <ContenedorCalculadoras />
            <BotonInsumos />
          </div>
        </main>
      </div>
    </div>
  );
}