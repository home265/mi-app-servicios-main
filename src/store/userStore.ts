import { create } from 'zustand';
import { auth, messaging as firebaseMessaging, db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/authHelpers';
import type { DocumentData } from 'firebase/firestore';
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { getToken as getFCMToken } from 'firebase/messaging';
import { deleteUserFCMToken } from '@/lib/firebase/firestore';
import { ReactNode } from 'react'; // Importación necesaria

// ──────────────────────────────────────────────────────────────
// Tipos básicos (sin cambios)
// ──────────────────────────────────────────────────────────────
export type Role = 'usuario' | 'prestador' | 'comercio';
export type ActingAs = 'user' | 'provider';

type UnreadCounters = {
  jobRequests: number;
  jobResponses: number;
};

export type UserProfile = DocumentData & {
  uid: string;
  email: string | null;
  rol: Role;
  fcmToken?: string;
  fcmTokenTimestamp?: Timestamp;
};

// ──────────────────────────────────────────────────────────────
// Definición del store
// ──────────────────────────────────────────────────────────────
interface UserStoreState {
  currentUser: UserProfile | null;
  originalRole: Role | null;
  actingAs: ActingAs;
  isPinVerifiedForSession: boolean;
  userError: string | null;
  isLoadingAuth: boolean;
  fcmToken: string | null;

  /** 🔔 contadores de notificaciones sin leer */
  unread: UnreadCounters;
  setUnread: (key: keyof UnreadCounters, n: number) => void;

  // --- INICIO: CAMPOS AÑADIDOS PARA EL MODAL DE AYUDA ---
  isHelpModalOpen: boolean;
  currentHelpContent: ReactNode | null;
  setHelpContent: (content: ReactNode | null) => void;
  toggleHelpModal: () => void;
  // --- FIN: CAMPOS AÑADIDOS ---

  // --- INICIO: CAMPOS AÑADIDOS PARA EL MODAL DE SUSCRIPCIÓN ---
  subscriptionModal: {
    isOpen: boolean;
    status: 'warning' | 'expired' | null;
    daysLeft?: number;
  };
  setSubscriptionModal: (
    newState: Partial<UserStoreState['subscriptionModal']>
  ) => void;
  // --- FIN: CAMPOS AÑADIDOS ---

  // acciones
  loadUser: () => Promise<void>;
  toggleActingMode: () => void;
  setUserError: (error: string | null) => void;
  setPinVerified: (isVerified: boolean) => void;
  resetStore: () => void;
  requestNotificationPermission: () => Promise<void>;
  disableNotifications: () => Promise<void>;
  clearUserSession: () => void;
  setCurrentUser: (user: UserProfile | null) => void;
  setLoadingAuth: (loading: boolean) => void;
}

const VAPID_KEY =
  'BEV7mpWmR7MHQ_0a3_cDm_h_MRQnj-xecYfXp1Zg_ZZ-TpDO6UB-DPxgajjYHK_HazR6mSGCde9Q5g6Xlge6TS0';

export const useUserStore = create<UserStoreState>((set, get) => ({
  // ── estado ──────────────────────────────────────────────
  currentUser: null,
  originalRole: null,
  actingAs: 'user',
  isPinVerifiedForSession:
    typeof window !== 'undefined'
      ? sessionStorage.getItem('pinVerified') === 'true'
      : false,
  userError: null,
  isLoadingAuth: true,
  fcmToken: null,
  unread: { jobRequests: 0, jobResponses: 0 },

  // --- ESTADO INICIAL PARA LA AYUDA ---
  isHelpModalOpen: false,
  currentHelpContent: null,

  // --- ESTADO INICIAL PARA EL MODAL DE SUSCRIPCIÓN ---
  subscriptionModal: {
    isOpen: false,
    status: null,
  },

  // ── acciones ────────────────────────────────────────────
  loadUser: async () => {
    // ... esta función se mantiene exactamente como la tienes ...
    set({ isLoadingAuth: true, userError: null, fcmToken: null });
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        set({ currentUser: null, originalRole: null, isPinVerifiedForSession: false, isLoadingAuth: false });
        if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified');
        return;
      }
      const result = await getUserData(firebaseUser.uid);
      if (!result) {
        set({ currentUser: null, originalRole: null, isPinVerifiedForSession: false, userError: 'No se encontraron datos del perfil del usuario.', isLoadingAuth: false });
        if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified');
        return;
      }
      const { data, collection } = result;
      const role: Role = collection === 'prestadores' ? 'prestador' : collection === 'comercios' ? 'comercio' : 'usuario';
      const actingAs: ActingAs = role === 'prestador' || role === 'comercio' ? 'provider' : 'user';
      const userProfile: UserProfile = { uid: firebaseUser.uid, email: firebaseUser.email, rol: role, ...data };
      set({ currentUser: userProfile, originalRole: role, actingAs, fcmToken: userProfile.fcmToken || null, isLoadingAuth: false });
    } catch (error: unknown) {
      set({ userError: error instanceof Error ? error.message : String(error), isLoadingAuth: false, currentUser: null, originalRole: null, fcmToken: null });
    }
  },
  
  disableNotifications: async () => {
    // ... esta función se mantiene exactamente como la tienes ...
    const { currentUser } = get();
    if (!currentUser?.uid || !currentUser.rol) {
      throw new Error("No se puede desactivar notificaciones: falta información del usuario.");
    }
    await deleteUserFCMToken(currentUser.uid, currentUser.rol);
    set({ fcmToken: null });
  },

  toggleActingMode: () => {
    // ... esta función se mantiene exactamente como la tienes ...
    const { originalRole, actingAs } = get();
    if (!originalRole || originalRole === 'usuario') return;
    set({ actingAs: actingAs === 'user' ? 'provider' : 'user' });
  },

  requestNotificationPermission: async () => {
    // ... esta función se mantiene exactamente como la tienes ...
    if (typeof window === 'undefined' || !('Notification' in window) || !firebaseMessaging) {
      set({ userError: 'Este navegador no soporta notificaciones o el servicio no está listo.' });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      set({ userError: null });
      if (permission === 'granted') {
        const currentToken = await getFCMToken(firebaseMessaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          set({ fcmToken: currentToken });
          const userId = get().currentUser?.uid;
          const userRole = get().currentUser?.rol;
          if (userId && userRole) {
            let collectionName: string;
            switch (userRole) {
              case 'prestador': collectionName = 'prestadores'; break;
              case 'comercio': collectionName = 'comercios'; break;
              default: collectionName = 'usuarios_generales'; break;
            }
            const userDocRef = doc(db, collectionName, userId);
            await updateDoc(userDocRef, { fcmToken: currentToken, fcmTokenTimestamp: serverTimestamp() });
          }
        } else {
          set({ userError: 'No se pudo obtener el token para notificaciones (token vacío).' });
        }
      } else {
        set({ userError: 'Permiso de notificación denegado por el usuario.' });
      }
    } catch (error: unknown) {
      let errorMessage = 'Error desconocido al configurar notificaciones.';
      if (error instanceof Error) {
        errorMessage = error.message;
        if (error.message.includes('Service Worker') || error.message.includes('VAPID')) {
          errorMessage = `Error con el servicio de notificaciones: ${error.message}.`;
        }
      }
      set({ userError: errorMessage });
    }
  },

  // --- INICIO: ACCIONES PARA EL MODAL DE AYUDA ---
  setHelpContent: (content) => {
    set({ currentHelpContent: content });
  },

  toggleHelpModal: () => {
    set((state) => ({ isHelpModalOpen: !state.isHelpModalOpen }));
  },
  // --- FIN: ACCIONES PARA EL MODAL DE AYUDA ---

  // --- ACCIÓN PARA MODIFICAR EL MODAL DE SUSCRIPCIÓN ---
  setSubscriptionModal: (newState) =>
    set((state) => ({
      subscriptionModal: { ...state.subscriptionModal, ...newState },
    })),

  setUserError: (error) => set({ userError: error }),

  setPinVerified: (flag) => {
    set({ isPinVerifiedForSession: flag });
    if (typeof window !== 'undefined') {
      if (flag) {
        sessionStorage.setItem('pinVerified', 'true');
      } else {
        sessionStorage.removeItem('pinVerified');
      }
    }
  },

  setCurrentUser: (user) => set({ currentUser: user }),
  setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),
  setUnread: (key, n) => set((s) => ({ unread: { ...s.unread, [key]: n } })),

  resetStore: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified');
    set({
      currentUser: null,
      originalRole: null,
      actingAs: 'user',
      isPinVerifiedForSession: false,
      userError: null,
      fcmToken: null,
      unread: { jobRequests: 0, jobResponses: 0 },
      isLoadingAuth: false,
      // --- Limpiar estado de ayuda al resetear ---
      isHelpModalOpen: false,
      currentHelpContent: null,
      // --- Limpiar estado de suscripción al resetear ---
      subscriptionModal: { isOpen: false, status: null },
    });
  },

  clearUserSession: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified');
    set({
      currentUser: null,
      originalRole: null,
      actingAs: 'user',
      isPinVerifiedForSession: false,
      userError: null,
      fcmToken: null,
      unread: { jobRequests: 0, jobResponses: 0 },
      isLoadingAuth: false,
       // --- Limpiar estado de ayuda al cerrar sesión ---
      isHelpModalOpen: false,
      currentHelpContent: null,
      // --- Limpiar estado de suscripción al cerrar sesión ---
      subscriptionModal: { isOpen: false, status: null },
    });
  },
}));