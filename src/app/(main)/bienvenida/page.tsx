'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Asumimos que UserProfile de userStore ya tiene uid, rol, selfieURL, nombre, etc.
// y que 'Role' (si se necesita importar explícitamente) está disponible.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useUserStore, UserProfile } from '@/store/userStore'; //

import Avatar from '@/app/components/common/Avatar'; //
import Navbar from '@/app/components/common/Navbar'; //
import {
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  BookOpenIcon,
  BriefcaseIcon,
  UserCircleIcon,
  UserGroupIcon,
  PlusCircleIcon,
  // MegaphoneIcon, // Ya no se importa aquí, lo maneja BotonCrearEditarAnuncio si lo necesita internamente
  PencilIcon,
} from '@heroicons/react/24/outline'; //

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore'; //
import { db } from '@/lib/firebase/config'; //

// Importa el nuevo componente que creaste
// Asegúrate que la ruta sea correcta a donde guardaste BotonCrearEditarAnuncio.tsx
// Por ejemplo: import BotonCrearEditarAnuncio from './components/BotonCrearEditarAnuncio';
// Si lo pusiste en src/app/(main)/bienvenida/components/BotonCrearEditarAnuncio.tsx
import BotonCrearEditarAnuncio from './components/BotonCrearEditarAnuncio'; //


/* ---------- tipos ---------- */
type IconSvg = React.ComponentType<React.ComponentProps<'svg'>>; //

// Modificamos ActionIconConfig para que IconComponent y path sean opcionales
// y añadimos la propiedad 'component' para renderizar componentes directamente.
interface ActionConfig {
  id: string; //
  label: string; // Puede ser string vacío si el componente ya tiene su label
  IconComponent?: IconSvg; // Opcional si usamos 'component'
  path?: string; // Opcional si usamos 'component' o la lógica de click es interna al componente/función
  requiresActiveAd?: boolean; //
  component?: React.ReactNode; // Para renderizar un componente directamente
}

interface AnuncioFS { //
  status: string; //
  endDate?: Timestamp; //
}

/* ---------- acciones base (sin aplicar filtros) ---------- */
// La acción 'crear_anuncio' se elimina de esta definición estática porque
// se insertará como un componente dinámicamente.
const baseActions: Record<'prestador' | 'comercio', ActionConfig[]> = { //
  prestador: [ //
    { id: 'trabajos_disponibles', label: 'Trabajos Disponibles', IconComponent: BriefcaseIcon,  path: '/trabajos' }, //
    { id: 'buscar_empleados',     label: 'Buscar Empleados',     IconComponent: UserGroupIcon,  path: '/empleados' }, //
    // El ítem para 'Crear/Editar Anuncio' se añadirá dinámicamente
    { id: 'editar_anuncios',      label: 'Mis Anuncios',       IconComponent: PencilIcon,     path: '/mis-anuncios' }, // // Cambiado label por consistencia con otros 'Mis X'
    { id: 'crear_publicacion',    label: 'Crear Publicación',    IconComponent: PlusCircleIcon, path: '/paginas-amarillas/crear',  requiresActiveAd: true }, //
    { id: 'editar_publicacion',   label: 'Editar Publicación',   IconComponent: PencilSquareIcon, path: '/paginas-amarillas/editar', requiresActiveAd: true }, // Path base, se ajustará en handleClick //
    { id: 'modo_usuario',         label: 'Modo Usuario',         IconComponent: UserCircleIcon, path: '#' }, // El path o acción se maneja en handleClick
    { id: 'paginas_amarillas',    label: 'Páginas Amarillas',    IconComponent: BookOpenIcon,   path: '/paginas-amarillas/buscar' }, //
  ],
  comercio: [ //
    { id: 'buscar_empleados_c',   label: 'Buscar Empleados',     IconComponent: UserGroupIcon,  path: '/empleados' }, // renombrado id para unicidad si es necesario
    // El ítem para 'Crear/Editar Anuncio' se añadirá dinámicamente
    { id: 'editar_anuncios_c',    label: 'Mis Anuncios',       IconComponent: PencilIcon,     path: '/mis-anuncios' }, // renombrado id
    { id: 'crear_publicacion_c',  label: 'Crear Publicación',    IconComponent: PlusCircleIcon, path: '/paginas-amarillas/crear',  requiresActiveAd: true }, // renombrado id
    { id: 'editar_publicacion_c', label: 'Editar Publicación',   IconComponent: PencilSquareIcon, path: '/paginas-amarillas/editar', requiresActiveAd: true }, // Path base, se ajustará en handleClick, renombrado id
    { id: 'modo_usuario_c',       label: 'Modo Usuario',         IconComponent: UserCircleIcon, path: '#' }, // El path o acción se maneja en handleClick, renombrado id
    { id: 'paginas_amarillas_c',  label: 'Páginas Amarillas',    IconComponent: BookOpenIcon,   path: '/paginas-amarillas/buscar' }, // renombrado id
  ],
};

export default function BienvenidaPage() {
  const router = useRouter(); //

  // currentUser debería ser de tipo UserProfile | null directamente desde el store
   
  // SE MODIFICA LA SIGUIENTE SECCIÓN PARA USAR SELECTORES INDIVIDUALES:
  const currentUser = useUserStore((state) => state.currentUser);
  const isPinVerifiedForSession = useUserStore((state) => state.isPinVerifiedForSession);
  const toggleActingMode = useUserStore((state) => state.toggleActingMode);
  // const actingAs = useUserStore((state) => state.actingAs); // actingAs no se usa directamente más adelante, se usa currentUser.rol
                                                            // Si necesitas actingAs para lógica específica que no sea determinar rol para acciones, descomenta.

  /* ---------- saber si el usuario ya tiene CV ---------- */
  const [hasCv, setHasCv] = useState<boolean | null>(null); //

  /* ---------- saber si el prestador/comercio tiene anuncio activo ---------- */
  const [hasActiveAd, setHasActiveAd] = useState<boolean | null>(null); //

  /* ---------- chequeo de CV (solo rol usuario) ---------- */
  useEffect(() => { //
    if (currentUser?.rol === 'usuario') { //
      (async () => { //
        if (currentUser && currentUser.uid) { // currentUser.uid es seguro aquí //
          const ref = doc(db, 'usuarios_generales', currentUser.uid, 'cv', 'main'); //
          const snap = await getDoc(ref); //
          setHasCv(snap.exists()); //
        }
      })().catch(console.error);
    }
  }, [currentUser]); //

  /* ---------- chequeo de anuncio activo (prestador / comercio) ---------- */
  useEffect(() => { //
    if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) return; //

    (async () => { //
      try { //
        if (currentUser && currentUser.uid) { // currentUser.uid es seguro aquí //
          const anunciosRef = collection(db, 'anuncios'); //
          const q = query( //
            anunciosRef, //
            where('creatorId', '==', currentUser.uid), //
            where('status', '==', 'active'), //
          );
          const snap = await getDocs(q); //

          const now = Timestamp.now(); //
          const activo = snap.docs.some(docSnap => { //
            const data = docSnap.data() as AnuncioFS; //
            if (data.status !== 'active') return false; //
            if (data.endDate) return data.endDate > now; //
            return true; //
          });
          setHasActiveAd(activo); //
        }
      } catch (e) { //
        console.error('Error comprobando anuncio activo:', e); //
        setHasActiveAd(false); //
      }
    })();
  }, [currentUser]); //

  /* ---------- redirecciones de seguridad ---------- */
  useEffect(() => { //
    if (!currentUser) { router.replace('/login'); return; } //
    if (!isPinVerifiedForSession) { router.replace('/pin-entry'); return; } //
  }, [currentUser, isPinVerifiedForSession, router]); //

  /* ---------- estados de carga ---------- */
  const waitingForCv = currentUser?.rol === 'usuario' && hasCv === null; //
  const waitingForAd = (currentUser?.rol === 'prestador' || currentUser?.rol === 'comercio') && hasActiveAd === null; //
  const isLoading = !currentUser || !isPinVerifiedForSession || waitingForCv || waitingForAd; //

  if (isLoading) { //
    return ( //
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p>Cargando tu espacio...</p>
      </div>
    );
  }

  if (!currentUser) { //
    // Esto no debería ocurrir si isLoading es falso y currentUser es la primera condición,
    // pero es una buena salvaguarda.
    return ( //
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p>Error: Usuario no disponible. Por favor, intente recargar.</p>
      </div>
    );
  }

  /* ---------- construir acciones dinámicas ---------- */
  let userActions: ActionConfig[] = []; // Usar el tipo ActionConfig modificado

  // Usamos `currentUser.rol` para determinar las acciones.
  const rolParaAcciones = currentUser.rol; //

  if (rolParaAcciones === 'usuario') { //
    userActions = [ //
      { id: 'buscar_servicios', label: 'Buscar Servicios', IconComponent: MagnifyingGlassIcon, path: '/busqueda' }, //
      hasCv //
        ? { id: 'editar_cv',  label: 'Editar CV',  IconComponent: PencilSquareIcon, path: '/cv' } //
        : { id: 'crear_cv',   label: 'Crear CV',   IconComponent: DocumentPlusIcon, path: '/cv' }, //
      { id: 'paginas_amarillas_usr', label: 'Páginas Amarillas', IconComponent: BookOpenIcon, path: '/paginas-amarillas/buscar' }, //
    ];
  } else if (rolParaAcciones === 'prestador' || rolParaAcciones === 'comercio') { //
    const rolActual = rolParaAcciones as 'prestador' | 'comercio'; //
    const base = baseActions[rolActual]; //
    
    const accionesFiltradas = base.filter(a => a.requiresActiveAd ? hasActiveAd === true : true); //

    // Insertar el componente BotonCrearEditarAnuncio en la lista de acciones
    // Lo pongo primero, puedes ajustar el orden.
    userActions = [ //
      {
        id: 'crear_o_editar_anuncio_action', // ID único para esta acción de componente
        label: '', // El componente tiene su propio label y estilo
        component: <BotonCrearEditarAnuncio /> //
      },
      ...accionesFiltradas, // Añadir el resto de las acciones filtradas
    ];
  }

  /* ---------- render ---------- */
  return ( //
    <div className="flex flex-col min-h-screen bg-fondo text-texto">
      {/* Tu Navbar original no toma props, si BotonCrearEditarAnuncio necesita algo del navbar,
          la comunicación tendría que ser vía store o props drilling si Navbar lo renderiza.
          Asumo que Navbar es independiente. */}
      <Navbar /> {/* */}

      <main className="flex-grow flex flex-col items-center pt-8 md:pt-12 px-4">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <Avatar selfieUrl={currentUser.selfieURL || undefined} nombre={currentUser.nombre || undefined} size={128} /> {/* */}
          <h1 className="text-2xl md:text-3xl font-bold text-primario mt-4">¡Hola, {currentUser.nombre || 'Usuario'}!</h1> {/* */}
          <p className="text-sm text-texto-secundario capitalize">{currentUser.rol}</p> {/* */}
        </div>

        {userActions.length ? ( //
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 max-w-2xl w-full">
            {userActions.map(({ id, label, IconComponent, path, component }) => { // Añadir 'component' a la desestructuración
              // Si la acción es un componente, renderizarlo directamente
              if (component) { //
                // El componente (BotonCrearEditarAnuncio) ya tiene su propio estilo de tarjeta
                return <React.Fragment key={id}>{component}</React.Fragment>; //
              }

              // Si no es un componente, proceder con la lógica original para iconos/labels/paths
              // Asegurarse que IconComponent exista antes de llamarlo
              if (!IconComponent) return null; //

              const handleClick = () => { //
                // Manejo de toggleActingMode para 'modo_usuario'
                if (id === 'modo_usuario' || id === 'modo_usuario_c' || id === 'modo_usuario_btn' || id === 'modo_usuario_btn_c') { // Unificar IDs para modo_usuario si es posible
                  toggleActingMode(); //
                  // Decidir a dónde redirigir después de cambiar de modo.
                  // Si el rol actual (currentUser.rol) es 'prestador' o 'comercio',
                  // y se cambia a 'usuario', entonces ir a '/busqueda'.
                  // Si era 'usuario' y se cambia (si tuvieras esa opción aquí), ir a '/bienvenida' o similar.
                  // Para este caso específico, es de proveedor/comercio a usuario:
                  router.push('/busqueda'); //
                } else if (id === 'editar_publicacion' || id === 'editar_publicacion_c' || id === 'editar_publicacion_pa' || id === 'editar_publicacion_pa_c') { // Unificar IDs
                  router.push(`/paginas-amarillas/editar/${currentUser.uid}`); //
                } else if (path && path !== '#') { // Asegurarse que hay un path válido
                  router.push(path); //
                }
                // Si el path es '#' o no hay path y no es un caso especial, no hace nada.
              };

              return ( //
                <div
                  key={id}
                  onClick={handleClick}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick();}} // Para accesibilidad
                  role="button" // Para accesibilidad
                  tabIndex={0} // Para accesibilidad
                  className="
                    flex flex-col items-center justify-center
                    p-4 aspect-square
                    bg-transparent
                    border-2 border-borde-tarjeta
                    rounded-lg shadow-md
                    cursor-pointer
                    hover:bg-tarjeta/10
                    transition-all duration-200 ease-in-out
                  "
                >
                  <IconComponent className="w-12 h-12 mb-2 text-primario" /> {/* */}
                  <span className="text-sm font-medium text-texto-principal text-center">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : ( //
          <p>No hay acciones disponibles para tu rol.</p> //
        )}
      </main>
    </div>
  );
}