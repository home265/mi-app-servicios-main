// src/lib/firebase/config.ts
import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,        // ← tipo explícito
} from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { 
  getMessaging, 
  onMessage, 
  type Messaging  // <--- NUEVO: Importar Messaging y su tipo
} from 'firebase/messaging';

/* -------------------------------------------------------------------------- */
/* 1. Configuración mediante variables de entorno                             */
/* -------------------------------------------------------------------------- */
const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

/* -------------------------------------------------------------------------- */
/* 2. Inicializar (o recuperar) la app                                        */
/* -------------------------------------------------------------------------- */
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized!');
} else {
  app = getApp();
}

/* -------------------------------------------------------------------------- */
/* 3. Instancias de servicios                                                 */
/* -------------------------------------------------------------------------- */
const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const functions = getFunctions(app);
let messaging: Messaging | null = null; // <--- NUEVO: Declarar messaging con tipo explícito

// Código que solo se ejecuta en el lado del cliente (navegador)
if (typeof window !== 'undefined') { // <--- NUEVO: Condicional para código de cliente
  try {
    messaging = getMessaging(app); // <--- NUEVO: Inicializar Firebase Messaging
    console.log('Firebase Messaging initialized (or attempted)');

    // Registrar el Service Worker
    if ('serviceWorker' in navigator) { // <--- NUEVO
      navigator.serviceWorker.register('/firebase-messaging-sw.js') // <--- NUEVO: Ruta a tu service worker
        .then((registration) => { // <--- NUEVO
          console.log('Service Worker registrado con éxito. Scope:', registration.scope); // <--- NUEVO
        }).catch((error) => { // <--- NUEVO
          console.error('Error al registrar el Service Worker:', error); // <--- NUEVO
        });
    }

    // Manejar mensajes cuando la app está en primer plano (opcional pero recomendado)
    onMessage(messaging, (payload) => { // <--- NUEVO
      console.log('Mensaje FCM recibido en primer plano: ', payload); // <--- NUEVO
      // Aquí puedes mostrar una notificación en la app si lo deseas.
      // Por ejemplo, usando la API de Notificaciones del navegador:
      if (payload.notification) { // <--- NUEVO
        new Notification(payload.notification.title || "Nueva notificación", { // <--- NUEVO
          body: payload.notification.body || "", // <--- NUEVO
          icon: payload.notification.icon || "/logo_notificacion.png", // <--- NUEVO: Un ícono por defecto
        });
      }
    });

  } catch (error) { // <--- NUEVO: Capturar errores de inicialización de messaging
    console.error("Error inicializando Firebase Messaging: ", error);
    // Esto podría suceder si Firebase no puede inicializar messaging,
    // por ejemplo, en navegadores que no lo soportan o configuraciones específicas.
  }
}

/* -------------------------------------------------------------------------- */
/* 4. Exports                                                                 */
/* -------------------------------------------------------------------------- */
export { app, auth, db, storage, functions, messaging }; // <--- MODIFICADO: Exportar messaging