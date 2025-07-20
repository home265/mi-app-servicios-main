// src/app/providers.tsx
'use client';

import { motion } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { Toaster } from 'react-hot-toast'; // <-- 1. IMPORTACIÓN AÑADIDA

import { auth, db } from '@/lib/firebase/config';
import { useUserStore, UserProfile } from '@/store/userStore';

const USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

/* ------------------------------------------------------------------
   Utilidad para recuperar el perfil desde Firestore (SIN CAMBIOS)
   ------------------------------------------------------------------ */
async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  for (const collectionName of USER_COLLECTIONS) {
    try {
      const userDocRef = doc(db, collectionName, userId);
      const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        if (userData.rol) {
          console.log(
            `Perfil encontrado en ${collectionName} para UID: ${userId}`
          );
          return { ...userData, uid: userId, rol: userData.rol };
        } else {
          console.warn(
            `Perfil encontrado en ${collectionName} para UID: ${userId}, pero falta el campo 'rol'.`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error buscando perfil en ${collectionName} para UID: ${userId}`,
        error
      );
    }
  }
  console.warn(`No se encontró perfil en ninguna colección para UID: ${userId}`);
  return null;
}

/* ------------------------------------------------------------------ */

const LoadingScreen = ({
  message = 'Cargando aplicación.',
}: {
  message?: string;
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
    <motion.img
      src="/logo1.png"
      alt="App Logo"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1 }}
      className="w-24 h-24 mb-4"
    />
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      {message}
    </motion.div>
  </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
  /* ---------------- global store (SIN CAMBIOS) ---------------- */
  const {
    currentUser,
    isLoadingAuth,
    isPinVerifiedForSession,
    setLoadingAuth,
    clearUserSession,
    setUserError,
  } = useUserStore();

  /* ---------------- router, path, mounting (SIN CAMBIOS) ---------------- */
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  /* ========================================================
     1) Listener de Firebase Auth (SIN CAMBIOS)
     ======================================================== */
  useEffect(() => {
    setMounted(true);
    console.log('Providers: Registrando onAuthStateChanged listener.');

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        console.log(
          'Providers: onAuthStateChanged disparado. firebaseUser:',
          firebaseUser?.uid || null
        );

        if (firebaseUser) {
          try {
            const existingUser = useUserStore.getState().currentUser;

            if (existingUser && existingUser.uid === firebaseUser.uid) {
              console.log(
                'Providers: Usuario ya existe en el store, no se recarga perfil.'
              );
              if (useUserStore.getState().isLoadingAuth) {
                setLoadingAuth(false);
              }
            } else {
              console.log(
                'Providers: Buscando perfil para usuario:',
                firebaseUser.uid
              );
              const userProfile = await fetchUserProfile(firebaseUser.uid);

              if (userProfile) {
                const { rol } = userProfile;
                const actingAs = rol === 'prestador' ? 'provider' : 'user';

                useUserStore.setState({
                  currentUser: {
                    ...userProfile,
                    email: firebaseUser.email,
                  },
                  originalRole: rol,
                  actingAs,
                });
              } else {
                console.error(
                  'Providers: Usuario autenticado pero perfil no encontrado o sin rol.'
                );
                setUserError('Error al cargar el perfil de usuario.');
                clearUserSession();
              }
              setLoadingAuth(false);
            }
          } catch (error) {
            console.error('Providers: Error al obtener perfil:', error);
            setUserError('Error al cargar tu perfil.');
            clearUserSession();
            setLoadingAuth(false);
          }
        } else {
          console.log('Providers: No hay usuario en Firebase.');
          if (
            useUserStore.getState().currentUser !== null ||
            useUserStore.getState().isLoadingAuth
          ) {
            clearUserSession();
            setLoadingAuth(false);
          }
        }
      }
    );

    return () => {
      console.log(
        'Providers: Desmontando y desuscribiendo onAuthStateChanged.'
      );
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================================================
     2) Redirecciones según estado de auth y PIN (SIN CAMBIOS)
     ======================================================== */
  useEffect(() => {
    if (isLoadingAuth || !mounted) return;

    const publicPaths = [
      '/login',
      '/seleccionar-registro',
      '/registro',
      '/terminos-y-condiciones',
      '/politica-de-privacidad',
    ];

    const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
    const isPinEntryPath = pathname === '/pin-entry';

    console.log(
      `Providers Redirection Check: Path=${pathname}, isLoadingAuth=${isLoadingAuth}, currentUser=${!!currentUser}, isPinVerified=${isPinVerifiedForSession}, isPublic=${isPublicPath}, isPinEntry=${isPinEntryPath}`
    );

    if (!currentUser && !isPublicPath) {
      router.replace('/login');
    }
    else if (currentUser && !isPinVerifiedForSession && !isPinEntryPath) {
      router.replace('/pin-entry');
    }
    else if (
      currentUser &&
      isPinVerifiedForSession &&
      (pathname === '/login' || isPinEntryPath)
    ) {
      router.replace('/bienvenida');
    }
  }, [
    isLoadingAuth,
    currentUser,
    isPinVerifiedForSession,
    pathname,
    router,
    mounted,
  ]);

  /* ========================================================
     3) Render (CON MODIFICACIÓN)
     ======================================================== */
  if (isLoadingAuth || !mounted) {
    return <LoadingScreen />;
  }

  const publicPaths = [
    '/login',
    '/seleccionar-registro',
    '/registro',
    '/terminos-y-condiciones',
    '/politica-de-privacidad',
  ];

  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isPinEntryPath = pathname === '/pin-entry';

  const shouldRender =
    (!currentUser && isPublicPath) ||
    (currentUser && !isPinVerifiedForSession && isPinEntryPath) ||
    (currentUser && isPinVerifiedForSession && !isPinEntryPath);

  if (!shouldRender) {
    return <LoadingScreen message="Verificando acceso..." />;
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {/* --- 2. COMPONENTE AÑADIDO PARA MOSTRAR NOTIFICACIONES --- */}
      <Toaster
        position="top-center"
        toastOptions={{
          // Estilos para que las notificaciones coincidan con el tema de la app
          style: {
            background: 'var(--color-tarjeta)',
            color: 'var(--color-texto-principal)',
            border: '1px solid var(--color-borde-tarjeta)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          // Estilos para los íconos de éxito y error
          success: {
            iconTheme: {
              primary: 'var(--color-primario)',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-error)',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </ThemeProvider>
  );
}