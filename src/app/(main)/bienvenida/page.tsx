// src/app/bienvenida/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
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
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { useUserStore } from '@/store/userStore';
import Avatar from '@/app/components/common/Avatar';
import BotonCrearEditarAnuncio from './components/BotonCrearEditarAnuncio';
import { db } from '@/lib/firebase/config';

const palette = {
  dark: {
    fondo: '#0F2623',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#F9F3D9',
    iconTxt: '#F9F3D9',
    resalte: '#EFC71D',
    logo: '/logo1.png',
  },
  light: {
    fondo: '#F9F3D9',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#0F2623',
    iconTxt: '#F9F3D9',
    resalte: '#EFC71D',
    logo: '/logo2.png',
  },
};

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
      id: 'crearPub',
      label: 'Crear / Editar Anuncio',
      Icon: PlusCircleIcon,
      component: <BotonCrearEditarAnuncio />,
      requiresAd: false,
    },
    {
      id: 'paginas',
      label: 'Páginas Amarillas',
      Icon: BookOpenIcon,
      path: '/paginas-amarillas/buscar',
    },
    { id: 'modo', label: 'Modo Usuario', Icon: UserCircleIcon, path: '#' },
  ],
  comercio: [
  { id: 'empleados', label: 'Empleados', Icon: UserGroupIcon, path: '/empleados' },
    { id: 'misAn', label: 'Mis Anuncios', Icon: PencilIcon, path: '/mis-anuncios' },
    {
      id: 'crearPub',
      label: 'Crear / Editar Anuncio',
      Icon: PlusCircleIcon,
      component: <BotonCrearEditarAnuncio />,
      requiresAd: false,
    },
    {
      id: 'paginas',
      label: 'Páginas Amarillas',
      Icon: BookOpenIcon,
      path: '/paginas-amarillas/buscar',
    },
    { id: 'modo', label: 'Modo Usuario', Icon: UserCircleIcon, path: '#' },
],
};

export default function BienvenidaPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const P = resolvedTheme === 'dark' ? palette.dark : palette.light;

  const user = useUserStore((s) => s.currentUser);
  const pinOk = useUserStore((s) => s.isPinVerifiedForSession);
  const toggleMode = useUserStore((s) => s.toggleActingMode);
  const actingAs = useUserStore((s) => s.actingAs);

  const [hasCv, setCv] = useState<boolean | null>(null);
  const [hasAd, setAd] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.rol !== 'usuario') return;
    (async () => {
      const ok = (await getDoc(doc(db, 'usuarios_generales', user.uid, 'cv', 'main'))).exists();
      setCv(ok);
    })();
  }, [user]);

  useEffect(() => {
    if (!user || !['prestador', 'comercio'].includes(user.rol)) return;
    (async () => {
      const q = query(
        collection(db, 'anuncios'),
        where('creatorId', '==', user.uid),
        where('status', '==', 'active')
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
    if (!user) router.replace('/login');
    else if (!pinOk) router.replace('/pin-entry');
  }, [user, pinOk, router]);

  const loading =
    !user ||
    !pinOk ||
    (user.rol === 'usuario' && hasCv === null) ||
    (['prestador', 'comercio'].includes(user.rol) && hasAd === null);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ backgroundColor: P.fondo, color: P.resalte }}
      >
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
      { id: 'pagUsr', label: 'Páginas Amarillas', Icon: BookOpenIcon, path: '/paginas-amarillas/buscar' },
    ];
  } else {
    actions = base[user.rol as 'prestador' | 'comercio'].filter((a) => (a.requiresAd ? hasAd : true));
  }

  const fullName = user.nombre ? toTitleCase(user.nombre) : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: P.fondo, color: P.texto }}>
      {/* ─── Cabecera ───────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-4 mt-6">
        <div className="flex items-center gap-4">
          <Avatar selfieUrl={user.selfieURL ?? undefined} nombre={fullName} size={64} />
          <div>
            <p className="text-lg font-semibold">{`Hola, ${fullName}`}</p>
            <span className="text-xs uppercase opacity-70">{user.rol}</span>
          </div>
        </div>
        <button
          onClick={() => router.push('/ajustes')}
          style={{ backgroundColor: P.tarjeta }}
          className="rounded-full p-2.5"
        >
          <Bars3BottomRightIcon className="w-7 h-7" style={{ color: P.resalte }} />
        </button>
      </header>

      {/* ─── El logo central fue eliminado ──────────────────── */}

      {/* ─── Grid de Acciones ───────────────────────────────── */}
      <main className="flex-grow flex justify-center pt-16 pb-6">
        <div className="w-full px-4">
          <div
            className="
              grid gap-5 sm:gap-6 place-items-center
              [grid-template-columns:repeat(auto-fit,minmax(9.5rem,1fr))]
            "
          >
            {actions.map((a) => {
              if (a.component) return <React.Fragment key={a.id}>{a.component}</React.Fragment>;
              if (!a.Icon) return null;
              const Icon = a.Icon;
              const click = () => {
                if (a.id === 'trabajos' && actingAs === 'user') {
                  toggleMode();
                  router.push('/trabajos');
                  return;
                }
                if (a.id.startsWith('modo')) {
                  toggleMode();
                  router.push('/busqueda');
                  return;
                }
                if (a.id.startsWith('editarPub')) {
                  router.push(`/paginas-amarillas/editar/${user.uid}`);
                  return;
                }
                if (a.path && a.path !== '#') router.push(a.path);
              };
              return (
                <button
                  key={a.id}
                  onClick={click}
                  className="
                    flex flex-col items-center justify-center
                    aspect-square w-full max-w-[180px]
                    rounded-xl transition active:scale-95 shadow-md hover:shadow-lg
                  "
                  style={{
                    backgroundColor: P.tarjeta,
                    border: `1px solid ${P.borde}`,
                    color: P.iconTxt,
                  }}
                >
                  <Icon className="w-10 h-10 mb-2" style={{ color: P.iconTxt }} />
                  <span className="text-sm">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}