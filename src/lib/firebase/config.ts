// src/lib/firebase/config.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getMessaging, onMessage, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:             process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:         process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:          process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:              process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
} as const;

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth      = getAuth(app);
const db        = getFirestore(app);
const storage   = getStorage(app);
const functions = getFunctions(app);
let messaging: Messaging | null = null;

// Código que solo se ejecuta en el lado del cliente (navegador)
if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
    // Listener para mensajes cuando la app está en primer plano
    onMessage(messaging, (payload) => {
      console.log('Mensaje FCM recibido en primer plano: ', payload);
      if (payload.notification) {
        new Notification(payload.notification.title || "Nueva notificación", {
          body: payload.notification.body || "",
          icon: payload.notification.icon || "/logo_notificacion.png",
        });
      }
    });
  } catch (error) {
    console.error("Error inicializando Firebase Messaging: ", error);
  }
}

export { app, auth, db, storage, functions, messaging };