// src/app/providers.tsx
'use client';

import { motion } from 'framer-motion';
// Se ha eliminado la importación de 'ThemeProvider' de 'next-themes'
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, DocumentSnapshot } from 'firebase/firestore';
import { Toaster, toast } from 'react-hot-toast';

import { auth, db } from '@/lib/firebase/config';
import { useUserStore, UserProfile } from '@/store/userStore';

import { useOnboarding } from '@/lib/hooks/useOnboarding';
import OnboardingInstructions from '@/app/components/onboarding/OnboardingInstructions';
import Modal from '@/app/components/common/Modal';
import DesktopOnboardingToast from '@/app/components/onboarding/DesktopOnboardingToast';

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
  
  // --- INICIO: LÓGICA DE ONBOARDING CORREGIDA Y ACTUALIZADA ---
  const { shouldShow, platform, handleOnboardingComplete } = useOnboarding();
  // --- FIN: LÓGICA DE ONBOARDING ---

  /* ========================================================
     1) Listener de Firebase Auth (SIN CAMBIOS)
     ======================================================== */
  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const existingUser = useUserStore.getState().currentUser;
          if (!(existingUser && existingUser.uid === firebaseUser.uid)) {
            const userProfile = await fetchUserProfile(firebaseUser.uid);
            if (userProfile) {
              const { rol } = userProfile;
              const actingAs = rol === 'prestador' || rol === 'comercio' ? 'provider' : 'user';
              useUserStore.setState({
                currentUser: { ...userProfile, email: firebaseUser.email },
                originalRole: rol, actingAs
              });
            } else {
              setUserError('Error al cargar el perfil de usuario.');
              clearUserSession();
            }
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          setUserError('Error al cargar tu perfil.');
          clearUserSession();
        } finally {
          if (useUserStore.getState().isLoadingAuth) setLoadingAuth(false);
        }
      } else {
        if (useUserStore.getState().currentUser || useUserStore.getState().isLoadingAuth) {
          clearUserSession();
          setLoadingAuth(false);
        }
      }
    });
    return () => unsubscribe();
  }, [setLoadingAuth, clearUserSession, setUserError]);

  /* ========================================================
     2) Redirecciones según estado de auth y PIN (SIN CAMBIOS)
     ======================================================== */
  useEffect(() => {
    if (isLoadingAuth || !mounted) return;
    const publicPaths = ['/login', '/seleccionar-registro', '/registro', '/terminos-y-condiciones', '/politica-de-privacidad'];
    const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
    const isPinEntryPath = pathname === '/pin-entry';

    if (!currentUser && !isPublicPath) {
      router.replace('/login');
    } else if (currentUser && !isPinVerifiedForSession && !isPinEntryPath) {
      router.replace('/pin-entry');
    } else if (currentUser && isPinVerifiedForSession && (isPublicPath || isPinEntryPath)) {
      router.replace('/bienvenida');
    }
  }, [isLoadingAuth, currentUser, isPinVerifiedForSession, pathname, router, mounted]);

  // --- INICIO: NUEVO useEffect PARA MANEJAR EL ONBOARDING ---
  useEffect(() => {
    if (!shouldShow) return;

    if (platform === 'desktop-chrome' || platform === 'desktop-edge' || platform === 'desktop-safari') {
      toast.custom(
        (t) => ( 
          <DesktopOnboardingToast
            platform={platform}
            onClose={() => {
              toast.dismiss(t.id);
              handleOnboardingComplete();
            }}
          />
        ),
        {
          id: 'desktop-onboarding-toast',
          duration: Infinity,
          position: 'bottom-right',
        }
      );
    }
  }, [shouldShow, platform, handleOnboardingComplete]);
  // --- FIN: NUEVO useEffect ---
  
  /* ========================================================
     3) Render (CON MODIFICACIÓN)
     ======================================================== */
  if (isLoadingAuth || !mounted) {
    return <LoadingScreen />;
  }

  const publicPaths = ['/login', '/seleccionar-registro', '/registro', '/terminos-y-condiciones', '/politica-de-privacidad'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));
  const isPinEntryPath = pathname === '/pin-entry';

  const shouldRender =
    (!currentUser && isPublicPath) ||
    (currentUser && !isPinVerifiedForSession && isPinEntryPath) ||
    (currentUser && isPinVerifiedForSession && !isPinEntryPath && !isPublicPath);

  if (!shouldRender) {
    return <LoadingScreen message="Verificando acceso..." />;
  }

  return (
    <>
      <Toaster />
      
      {children}
      
      {/* --- INICIO: RENDERIZADO CONDICIONAL DEL MODAL DE ONBOARDING PARA MÓVILES --- */}
      {shouldShow && (platform === 'ios' || platform === 'android') && (
        <Modal 
          isOpen={true} 
          onClose={handleOnboardingComplete}
          title="Guía de Instalación"
        >
            <OnboardingInstructions 
                os={platform} 
                onClose={handleOnboardingComplete} 
            />
        </Modal>
      )}
      {/* --- FIN: RENDERIZADO CONDICIONAL DEL MODAL --- */}
    </>
  );
}