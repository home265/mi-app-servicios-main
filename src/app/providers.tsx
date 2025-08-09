'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, DocumentSnapshot, Timestamp } from 'firebase/firestore'; // Asegúrate que Timestamp esté importado
import { Toaster, toast } from 'react-hot-toast';

import { auth, db } from '@/lib/firebase/config';
import { useUserStore, UserProfile } from '@/store/userStore';

import { useOnboarding } from '@/lib/hooks/useOnboarding';
import OnboardingInstructions from '@/app/components/onboarding/OnboardingInstructions';
import Modal from '@/app/components/common/Modal';
import DesktopOnboardingToast from '@/app/components/onboarding/DesktopOnboardingToast';

import BottomNavBar from '@/app/components/common/BottomNavBar';
import SubscriptionStatusModal from '@/app/components/suscripciones/SubscriptionStatusModal';
import { getPaginaAmarilla } from '@/lib/services/paginasAmarillasService';

const USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  for (const collectionName of USER_COLLECTIONS) {
    try {
      const userDocRef = doc(db, collectionName, userId);
      const userDocSnap: DocumentSnapshot = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data() as UserProfile;
        if (userData.rol) {
          return { ...userData, uid: userId, rol: userData.rol };
        }
      }
    } catch (error) {
      console.error(`Error buscando perfil en ${collectionName}`, error);
    }
  }
  return null;
}

const LoadingScreen = ({ message = 'Cargando aplicación.' }: { message?: string; }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <motion.img src="/logo1.png" alt="App Logo" initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }} className="w-24 h-24 mb-4" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }}>
            {message}
        </motion.div>
    </div>
);

export function Providers({ children }: { children: React.ReactNode }) {
  const {
    currentUser, isLoadingAuth, isPinVerifiedForSession,
    setLoadingAuth, clearUserSession, setUserError,
    isHelpModalOpen, currentHelpContent, toggleHelpModal,
    setSubscriptionModal
  } = useUserStore();

  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { shouldShow, platform, handleOnboardingComplete } = useOnboarding();

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
                        useUserStore.setState({ currentUser: { ...userProfile, email: firebaseUser.email }, originalRole: rol, actingAs });
                    } else {
                        setUserError('Error al cargar el perfil de usuario.');
                        clearUserSession();
                    }
                }
            // --- CORRECCIÓN 2: Se renombra la variable no usada 'error' a '_error' ---
            } catch (_error) {
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

  useEffect(() => {
    if (!isPinVerifiedForSession || !currentUser) {
      return;
    }

    if (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio') {
      return;
    }

    const checkSubscriptionStatus = async () => {
      try {
        const page = await getPaginaAmarilla(currentUser.uid);
        
        if (!page || !page.subscriptionEndDate) {
          return;
        }

        const now = new Date();
        // --- CORRECCIÓN 1: Se elimina la conversión 'as any' ---
        const endDate = (page.subscriptionEndDate as Timestamp).toDate();

        if (!page.isActive && endDate < now) {
          setSubscriptionModal({ isOpen: true, status: 'expired' });
          return;
        }

        const fiveDaysInMillis = 5 * 24 * 60 * 60 * 1000;
        if (page.isActive && (endDate.getTime() - now.getTime()) < fiveDaysInMillis) {
          const timeLeft = endDate.getTime() - now.getTime();
          const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
          setSubscriptionModal({ isOpen: true, status: 'warning', daysLeft: daysLeft > 0 ? daysLeft : 0 });
        }
        
      } catch (error) {
        console.error("Error al comprobar el estado de la suscripción:", error);
      }
    };

    checkSubscriptionStatus();
  }, [isPinVerifiedForSession, currentUser, setSubscriptionModal]);

  useEffect(() => {
    if (!shouldShow) return;
    if (platform === 'desktop-chrome' || platform === 'desktop-edge' || platform === 'desktop-safari') {
        toast.custom((t) => (<DesktopOnboardingToast platform={platform} onClose={() => { toast.dismiss(t.id); handleOnboardingComplete(); }} />),
            { id: 'desktop-onboarding-toast', duration: Infinity, position: 'bottom-right', }
        );
    }
  }, [shouldShow, platform, handleOnboardingComplete]);
  
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

  const showNavBar = currentUser && isPinVerifiedForSession && !isPinEntryPath && !isPublicPath;

  return (
    <>
      <Toaster />

      <SubscriptionStatusModal />
      
      <main className="pb-24">
        {children}
      </main>
      
      {showNavBar && <BottomNavBar />}
      
      {shouldShow && (platform === 'ios' || platform === 'android') && (
        <Modal isOpen={true} onClose={handleOnboardingComplete} title="Guía de Instalación">
            <OnboardingInstructions os={platform} onClose={handleOnboardingComplete} />
        </Modal>
      )}

      {isHelpModalOpen && currentHelpContent && (
        <Modal isOpen={isHelpModalOpen} onClose={toggleHelpModal} title="Ayuda">
          {currentHelpContent}
        </Modal>
      )}
    </>
  );
}