// src/app/bienvenida/page.tsx
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
  PlusCircleIcon,
  PencilIcon,
  Bars3BottomRightIcon,
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useUserStore } from '@/store/userStore';
import Avatar from '@/app/components/common/Avatar';
import BotonCrearEditarAnuncio from './components/BotonCrearEditarAnuncio';
import { db } from '@/lib/firebase/config';
import { getCvByUid } from '@/lib/services/cvService';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaAjustes from '@/app/components/ayuda-contenido/AyudaAjustes';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';
import BotonDeAccion from '@/app/components/bienvenida/BotonDeAccion';


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
  requiresAd?: boolean;
  component?: React.ReactNode;
}
interface AdFS {
  status: string;
  endDate?: Timestamp;
}

const base: Record<'prestador' | 'comercio', Action[]> = {
  prestador: [
    { id: 'trabajos', label: 'Trabajos', Icon: BriefcaseIcon, path: '/trabajos' },
    { id: 'empleados', label: 'Empleados', Icon: UserGroupIcon, path: '/empleados' },
    { id: 'misAn', label: 'Mis Anuncios', Icon: PencilIcon, path: '/mis-anuncios' },
    {
      id: 'crearAnuncioBtn',
      label: 'Crear / Editar Anuncio',
      Icon: PlusCircleIcon,
      component: <BotonCrearEditarAnuncio />,
      requiresAd: false,
    },
    {
      id: 'crearPub',
      label: 'Crear Publicación',
      Icon: DocumentPlusIcon,
      path: '/paginas-amarillas/crear',
      requiresAd: true,
    },
    {
      id: 'editarPub',
      label: 'Editar Publicación',
      Icon: PencilSquareIcon,
      path: '/paginas-amarillas/editar',
      requiresAd: true,
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
    { id: 'misAn', label: 'Mis Anuncios', Icon: PencilIcon, path: '/mis-anuncios' },
    {
      id: 'crearAnuncioBtn',
      label: 'Crear / Editar Anuncio',
      Icon: PlusCircleIcon,
      component: <BotonCrearEditarAnuncio />,
      requiresAd: false,
    },
    {
      id: 'crearPub',
      label: 'Crear Publicación',
      Icon: DocumentPlusIcon,
      path: '/paginas-amarillas/crear',
      requiresAd: true,
    },
    {
      id: 'editarPub',
      label: 'Editar Publicación',
      Icon: PencilSquareIcon,
      path: '/paginas-amarillas/editar',
      requiresAd: true,
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

export default function BienvenidaPage() {
  const router = useRouter();

  const user = useUserStore((s) => s.currentUser);
  const pinOk = useUserStore((s) => s.isPinVerifiedForSession);
  const toggleMode = useUserStore((s) => s.toggleActingMode);
  const actingAs = useUserStore((s) => s.actingAs);

  const { jobRequests, jobResponses } = useUserStore((s) => s.unread);

  const [hasCv, setCv] = useState<boolean | null>(null);
  const [hasAd, setAd] = useState<boolean | null>(null);
  const [hasPublication, setHasPublication] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.rol !== 'usuario') return;

    (async () => {
      if (!user?.uid) return;
      try {
        const cvData = await getCvByUid(user.uid);
        setCv(cvData !== null);
      } catch (error) {
        console.error('Error al verificar la existencia del CV:', error);
        setCv(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !['prestador', 'comercio'].includes(user.rol)) return;
    (async () => {
      if (!user?.uid) return;
      const q = query(
        collection(db, 'anuncios'),
        where('creatorId', '==', user.uid),
        where('status', '==', 'active'),
      );
      const now = Timestamp.now();
      const snap = await getDocs(q);
      const ok = snap.docs.some((d) => {
        const data = d.data() as AdFS;
        return data.status === 'active' && (!data.endDate || data.endDate > now);
      });
      setAd(ok);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !['prestador', 'comercio'].includes(user.rol)) return;

    (async () => {
      if (!user?.uid) return;
      try {
        const pubDoc = await getDoc(doc(db, 'paginas_amarillas', user.uid));
        setHasPublication(pubDoc.exists());
      } catch (error) {
        console.error('Error al verificar la existencia de la publicación:', error);
        setHasPublication(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!user) router.replace('/login');
    else if (!pinOk) router.replace('/pin-entry');
  }, [user, pinOk, router]);

  const loading =
    !user ||
    !pinOk ||
    (user.rol === 'usuario' && hasCv === null) ||
    (['prestador', 'comercio'].includes(user.rol) && (hasAd === null || hasPublication === null));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-fondo text-primario">
        <span className="animate-pulse text-lg">Cargando…</span>
      </div>
    );
  }

  let actions: Action[] = [];
  if (user && user.rol === 'usuario') {
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
  } else if (user) {
    let availableActions = base[user.rol as 'prestador' | 'comercio'].filter((a) =>
      a.requiresAd ? hasAd === true : true,
    );

    if (hasPublication !== null) {
      if (hasPublication) {
        availableActions = availableActions.filter((a) => a.id !== 'crearPub');
      } else {
        availableActions = availableActions.filter((a) => a.id !== 'editarPub');
      }
    }

    actions = availableActions;
  }

  const fullName = user?.nombre ? toTitleCase(user.nombre) : '';

  // --- PEGA ESTA FUNCIÓN JUSTO ANTES DE TU "return" ---
  // Función auxiliar para navegar con un pequeño retraso y ver la animación.
  const delayedNavigate = (path: string) => {
    setTimeout(() => {
      router.push(path);
    }, 150); // 150ms para que la animación se complete
  };
  // ---------------------------------------------------

 return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">
        <header 
          // <-- MODIFICADO: Revertido a su estado original
          className="flex items-center justify-between py-4 mt-6"
        >
          <button
            onClick={() => delayedNavigate('/perfil')}
            aria-label="Ver mi perfil"
            className="
              flex items-center gap-4 p-3 rounded-xl
              bg-tarjeta text-texto-principal
              transition-all duration-150 ease-in-out
              shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
              hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]
              active:scale-[0.98] active:brightness-90
              active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
            "
          >
            <Avatar selfieUrl={user?.selfieURL ?? undefined} nombre={fullName} size={64} />
            <div className="text-left">
              <p className="text-lg font-semibold">{`Hola, ${fullName}`}</p>
              <span className="text-xs uppercase opacity-70">{user?.rol}</span>
            </div>
          </button>

          <div 
            // <-- MODIFICADO: Clases responsivas añadidas a este div
            className="flex flex-col md:flex-row items-center gap-3 md:gap-4"
          >
            <BotonAyuda>
              <AyudaAjustes />
            </BotonAyuda>

            <button
              onClick={() => delayedNavigate('/ajustes')}
              aria-label="Abrir menú de ajustes"
              className="
                  w-12 h-12 rounded-full
                  flex items-center justify-center
                  bg-tarjeta
                  transition-all duration-150 ease-in-out
                  shadow-[4px_4px_8px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.05)]
                  hover:brightness-110 hover:shadow-[5px_5px_10px_rgba(0,0,0,0.3),-3px_-3px_8px_rgba(255,255,255,0.05)]
                  active:scale-95 active:brightness-90
                  active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]
              "
            >
              <Bars3BottomRightIcon className="w-7 h-7 text-primario" />
            </button>
          </div>
        </header>

        <main className="flex-grow flex justify-center items-start pt-16 pb-6">
          <div
            className="
              w-full grid gap-5 sm:gap-6
              [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]
            "
          >
            {actions.map((a) => {
              if (a.component) {
                return <React.Fragment key={a.id}>{a.component}</React.Fragment>;
              }
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
                if (a.id === 'editarPub') {
                  delayedNavigate(`/paginas-amarillas/editar/${user?.uid}`);
                  return;
                }
                if (a.path && a.path !== '#') {
                  delayedNavigate(a.path);
                }
              };

              const unreadCount =
                a.id === 'trabajos'
                  ? jobRequests
                  : a.id === 'buscar'
                  ? jobResponses
                  : a.id === 'modo'
                  ? jobResponses
                  : 0;

              return (
                <BotonDeAccion
                  key={a.id}
                  label={a.label}
                  Icon={Icon}
                  onClick={click}
                >
                  {unreadCount > 0 && (
                    <div
                      className="
                        absolute top-2 right-2 h-6 w-6 bg-red-600 rounded-full
                        flex items-center justify-center text-white text-xs font-bold
                        ring-2 ring-tarjeta
                      "
                    >
                      {unreadCount}
                    </div>
                  )}
                </BotonDeAccion>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}