import { create } from 'zustand';
// <--- NUEVO: Importar 'messaging' (como firebaseMessaging para evitar colisión de nombres si tuvieras otra variable messaging) y 'db' desde tu config.ts
import { auth, messaging as firebaseMessaging, db } from '@/lib/firebase/config';
import { getUserData } from '@/lib/firebase/authHelpers';
import type { DocumentData } from 'firebase/firestore';
// <--- NUEVO: Importar funciones de Firestore para guardar el token y el tipo Messaging
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { doc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getToken as getFCMToken, type Messaging } from 'firebase/messaging'; // <--- NUEVO
import { deleteUserFCMToken } from '@/lib/firebase/firestore';
// ──────────────────────────────────────────────────────────────
// Tipos básicos
// ──────────────────────────────────────────────────────────────
export type Role     = 'usuario' | 'prestador' | 'comercio';
export type ActingAs = 'user'    | 'provider';

/** Contador de notificaciones sin leer */
type UnreadCounters = {
  jobRequests : number;   // para prestador
  jobResponses: number;   // para usuario
};

/**
 * Perfil completo guardado en el estado global.
 * Incluye todos los campos del documento de Firestore
 * más los obligatorios que necesitamos en la app.
 */
export type UserProfile = DocumentData & {
  uid  : string;
  email: string | null;
  rol  : Role;
  fcmToken?: string;          // <--- NUEVO: Añadir fcmToken opcional al perfil
  fcmTokenTimestamp?: Timestamp; // <--- NUEVO: opcional, para saber cuándo se actualizó
};

// ──────────────────────────────────────────────────────────────
// Definición del store
// ──────────────────────────────────────────────────────────────
interface UserStoreState {
  currentUser : UserProfile | null;
  originalRole: Role  | null;
  actingAs    : ActingAs;
  isPinVerifiedForSession: boolean;
  userError   : string | null;
  isLoadingAuth: boolean;
  fcmToken    : string | null; // <--- NUEVO: Para el token FCM actual en el estado

  /** 🔔 contadores de notificaciones sin leer */
  unread: UnreadCounters;
  /** Actualiza uno de los contadores */
  setUnread: (key: keyof UnreadCounters, n: number) => void;

  // acciones
  loadUser         : () => Promise<void>;
  toggleActingMode : () => void;
  setUserError     : (error: string | null) => void;
  setPinVerified   : (isVerified: boolean) => void;
  resetStore       : () => void;
  requestNotificationPermission: () => Promise<void>; // <--- NUEVO: Acción para notificaciones
  disableNotifications: () => Promise<void>;
  // helpers para flujo de auth / providers
  clearUserSession : () => void;
  setCurrentUser   : (user: UserProfile | null) => void;
  setLoadingAuth   : (loading: boolean) => void;
}

// <--- NUEVO: Tu VAPID Key obtenida de Firebase Console
const VAPID_KEY =
  'BEV7mpWmR7MHQ_0a3_cDm_h_MRQnj-xecYfXp1Zg_ZZ-TpDO6UB-DPxgajjYHK_HazR6mSGCde9Q5g6Xlge6TS0';

export const useUserStore = create<UserStoreState>((set, get) => ({
  // ── estado ──────────────────────────────────────────────
  currentUser : null,
  originalRole: null,
  actingAs    : 'user',

  // ── ACTUALIZADO: lee sessionStorage al iniciar ──────────
  isPinVerifiedForSession:
    typeof window !== 'undefined'
      ? sessionStorage.getItem('pinVerified') === 'true'
      : false,

  userError   : null,
  isLoadingAuth: true,
  fcmToken    : null, // <--- NUEVO: Inicializar fcmToken

  /** 🔔 contadores sin leer */
  unread: { jobRequests: 0, jobResponses: 0 },

  // ── acciones ────────────────────────────────────────────
  /** Lee el usuario autenticado y su perfil de Firestore */
  loadUser: async () => {
    // <--- MODIFICADO: Limpiar fcmToken al inicio de la carga o si no hay usuario
    set({ isLoadingAuth: true, userError: null, fcmToken: null });
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        set({
          currentUser: null,
          originalRole: null,
          isPinVerifiedForSession: false,
          isLoadingAuth: false, // <--- MODIFICADO: Asegurar que isLoadingAuth se ponga en false
        });
        if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified'); // <--- NUEVO
        return;
      }

      const result = await getUserData(firebaseUser.uid);
      if (!result) {
        set({
          currentUser: null,
          originalRole: null,
          isPinVerifiedForSession: false,
          userError: 'No se encontraron datos del perfil del usuario.', // <--- MODIFICADO: Mensaje de error
          isLoadingAuth: false, // <--- MODIFICADO
        });
        if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified'); // <--- NUEVO
        return;
      }

      const { data, collection } = result;
      const role: Role =
        collection === 'prestadores'
          ? 'prestador'
          : collection === 'comercios'
          ? 'comercio'
          : 'usuario';

      const actingAs: ActingAs =
        role === 'prestador' || role === 'comercio' ? 'provider' : 'user'; // <--- MODIFICADO: corregir lógica para 'comercio'

      const userProfile: UserProfile = {
        // <--- MODIFICADO: crear el objeto perfil explícitamente
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        rol: role,
        ...data,
      };

      set({
        currentUser: userProfile,
        originalRole: role,
        actingAs,
        fcmToken: userProfile.fcmToken || null, // <--- NUEVO: cargar fcmToken desde el perfil
        isLoadingAuth: false, // <--- MODIFICADO
      });
    } catch (error: unknown) {
      set({
        userError: error instanceof Error ? error.message : String(error),
        isLoadingAuth: false, // <--- MODIFICADO
        currentUser: null, // <--- MODIFICADO: limpiar usuario en caso de error
        originalRole: null,
        fcmToken: null,
      });
    }
  },
  
  disableNotifications: async () => {
  const { currentUser } = get();
  if (!currentUser?.uid || !currentUser.rol) {
    throw new Error("No se puede desactivar notificaciones: falta información del usuario.");
  }
  await deleteUserFCMToken(currentUser.uid, currentUser.rol);
  set({ fcmToken: null });
},
  /** Alterna entre actuar como usuario (app cliente) o como prestador/comercio */
  toggleActingMode: () => {
    const { originalRole, actingAs } = get();
    if (!originalRole || originalRole === 'usuario') return;
    set({ actingAs: actingAs === 'user' ? 'provider' : 'user' });
  },

  // <--- NUEVO: Acción para solicitar permisos y obtener/guardar token FCM
  requestNotificationPermission: async () => {
    // Asegurarse de que este código solo se ejecuta en el cliente
    if (
      typeof window === 'undefined' ||
      !('Notification' in window) ||
      !firebaseMessaging
    ) {
      console.log(
        'Notificaciones no soportadas o Firebase Messaging no inicializado.'
      );
      set({
        userError:
          'Este navegador no soporta notificaciones o el servicio no está listo.',
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      set({ userError: null }); // Limpiar errores previos

      if (permission === 'granted') {
        console.log('Permiso de notificación concedido.');

        // firebaseMessaging es la instancia de Messaging exportada desde config.ts
        const currentToken = await getFCMToken(firebaseMessaging, {
          vapidKey: VAPID_KEY,
        });

        if (currentToken) {
          console.log('FCM Token obtenido:', currentToken);
          set({ fcmToken: currentToken });
          const userId   = get().currentUser?.uid;
          const userRole = get().currentUser?.rol;

          if (userId && userRole) {
            let collectionName: string;
            switch (userRole) {
              case 'prestador':
                collectionName = 'prestadores';
                break;
              case 'comercio':
                collectionName = 'comercios';
                break;
              case 'usuario':
              default:
                collectionName = 'usuarios_generales';
                break;
            }

            const userDocRef = doc(db, collectionName, userId);
            await updateDoc(userDocRef, {
              fcmToken          : currentToken,
              fcmTokenTimestamp : serverTimestamp(),
            });
            console.log(
              `FCM Token guardado en Firestore para ${collectionName}/${userId}`
            );
          } else {
            console.warn(
              'No se pudo guardar el FCM Token: userId o userRole no disponibles.'
            );
          }
        } else {
          console.log(
            'No se pudo obtener el token FCM. Asegúrate que el Service Worker está registrado y la VAPID key es correcta.'
          );
          set({
            userError:
              'No se pudo obtener el token para notificaciones (token vacío).',
          });
        }
      } else {
        console.log('Permiso de notificación denegado.');
        set({
          userError: 'Permiso de notificación denegado por el usuario.',
        });
      }
    } catch (error: unknown) {
      console.error(
        'Error al solicitar permiso de notificación o token:',
        error
      );
      let errorMessage =
        'Error desconocido al configurar notificaciones.';
      if (error instanceof Error) {
        errorMessage = error.message;
        // Errores comunes de FCM y Service Worker
        if (
          error.message.includes('Service Worker') ||
          error.message.includes('VAPID') ||
          error.message.includes('messaging')
        ) {
          errorMessage = `Error con el servicio de notificaciones: ${error.message}. Revisa la consola para más detalles.`;
        }
      }
      set({ userError: errorMessage });
    }
  },

  // ── setters simples ─────────────────────────────────────
  setUserError: (error) => set({ userError: error }),

  // ── ACTUALIZADO: persiste el flag en sessionStorage ─────
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

  setCurrentUser: (user) => set({ currentUser: user }), // Considerar si esto debe limpiar fcmToken
  setLoadingAuth: (loading) => set({ isLoadingAuth: loading }),

  /** 🔔 actualiza contadores sin leer */
  setUnread: (key, n) =>
    set((s) => ({ unread: { ...s.unread, [key]: n } })),

  // ── limpiadores ─────────────────────────────────────────
  resetStore: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified'); // <--- NUEVO
    set({
      currentUser: null,
      originalRole: null,
      actingAs: 'user',
      isPinVerifiedForSession: false,
      userError: null,
      fcmToken: null, // <--- NUEVO: Limpiar fcmToken
      unread: { jobRequests: 0, jobResponses: 0 },
      isLoadingAuth: false, // <--- NUEVO: asegurar que se resetea
    });
  },

  clearUserSession: () => {
    if (typeof window !== 'undefined') sessionStorage.removeItem('pinVerified'); // <--- NUEVO
    set({
      currentUser: null,
      originalRole: null,
      actingAs: 'user',
      isPinVerifiedForSession: false,
      userError: null,
      fcmToken: null, // <--- NUEVO: limpiar fcmToken
      unread: { jobRequests: 0, jobResponses: 0 },
      isLoadingAuth: false, // <--- NUEVO: asegurar que se resetea
    });
  },
}));