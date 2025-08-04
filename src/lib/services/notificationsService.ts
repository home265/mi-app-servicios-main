/* notificationsService.ts – flujo v2 + compatibilidad con removeNotification/Notification */

import {
  getFunctions,
  httpsCallable,
  connectFunctionsEmulator,
  Functions,
} from 'firebase/functions';
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { app } from '../../lib/firebase/config';          // ← ajusta ruta si cambia

/* ------------------------------------------------------------------ */
/* 1. Tipos                                                           */
/* ------------------------------------------------------------------ */
export type Primitive = string | number | boolean | null;

export interface Recipient { uid: string; collection: string }
export interface Sender     { uid: string; collection: string }

export interface Payload extends Record<string, Primitive> {
  description: string;
}

interface NotificationInput {
  to: Recipient[];
  from: Sender;
  payload: Payload;
}

/* ---------- NUEVOS TIPOS para la función de limpieza ---------- */
// Datos que el frontend debe enviar a la nueva función
export interface ConfirmAgreementData {
  user: Recipient;
  provider: Recipient;
  followupNotifId: string;
  originalNotifId: string;
  userName: string;
}

// Respuesta que se espera de la nueva función
export interface ConfirmAgreementResult {
  success: boolean;
  message: string;
}
/* -------------------------------------------------------------- */

/* ---------- INICIO DE CÓDIGO AÑADIDO: Tipos para nuevas funciones ---------- */
// Datos para las nuevas acciones de seguimiento (reprogramar y cancelar)
export interface FollowupActionData {
  user: Recipient;
  provider: Recipient;
  notificationId: string;
}

// Respuesta esperada para las nuevas acciones de seguimiento
export interface FollowupActionResult {
  success: boolean;
  message?: string;
}
/* ---------- FIN DE CÓDIGO AÑADIDO ---------- */


/* ---------- Documento recibido en el listener ---------- */
export interface NotificationDoc extends NotificationInput {
  id: string;
  type: string;
  timestamp: { seconds: number; nanoseconds: number };
  read: boolean;
}

/* ---------- Alias para compatibilidad con los componentes ---------- */
export type Notification = NotificationDoc;

/* ------------------------------------------------------------------ */
/* 2. Instancia de Cloud Functions                                     */
/* ------------------------------------------------------------------ */
const functions: Functions = (() => {
  const f = getFunctions(app, 'us-central1');   // cambia región si usas otra
  if (process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === 'true') {
    connectFunctionsEmulator(f, 'localhost', 5001);
  }
  return f;
})();

/* ------------------------------------------------------------------ */
/* 3. Helpers callables                                                */
/* ------------------------------------------------------------------ */
function callable(name: string) {
  return httpsCallable<NotificationInput, void>(functions, name);
}

export const sendJobRequest          = callable('sendJobRequest');
export const sendJobAccept           = callable('sendJobAccept');
export const sendContactRequest      = callable('sendContactRequest');
export const sendAgreementConfirmed  = callable('sendAgreementConfirmed');
export const sendRatingRequest       = callable('sendRatingRequest');
export const sendContactFollowupTask = callable('sendContactFollowupTask'); // opcional

/* ---------- NUEVO HELPER para la función de limpieza ---------- */
// Se define explícitamente con sus tipos de entrada (Request) y salida (Result)
export const confirmAgreementAndCleanup = httpsCallable<ConfirmAgreementData, ConfirmAgreementResult>(
  functions,
  'confirmAgreementAndCleanup'
);
/* -------------------------------------------------------------- */

/* ---------- INICIO DE CÓDIGO AÑADIDO: Helpers para nuevas funciones ---------- */
// Helper para reprogramar el seguimiento ("No, aún no")
export const rescheduleFollowup = httpsCallable<FollowupActionData, FollowupActionResult>(
  functions,
  'rescheduleFollowup'
);

// Helper para cancelar el seguimiento ("No hubo acuerdo")
export const cancelAgreement = httpsCallable<FollowupActionData, FollowupActionResult>(
  functions,
  'cancelAgreement'
);
/* ---------- FIN DE CÓDIGO AÑADIDO ---------- */


/* ------------------------------------------------------------------ */
/* 4. Suscripción en tiempo real                                       */
/* ------------------------------------------------------------------ */
export function subscribeToNotifications(
  user: { uid: string; collection: string },
  callback: (snapshot: NotificationDoc[]) => void,
): Unsubscribe {
  const db = getFirestore(app);
  const q = query(
    collection(db, user.collection, user.uid, 'notifications'),
    orderBy('timestamp', 'desc'),
  );

  return onSnapshot(q, (snap) => {
    const list: NotificationDoc[] = snap.docs.map((d) => {
      const raw = d.data() as Omit<NotificationDoc, 'id'> & {
        fromId: string;
        fromCollection: string;
      };

      return {
        id: d.id,
        type: raw.type,
        to: raw.to,
        payload: raw.payload,
        timestamp: raw.timestamp,
        read: raw.read,
        from: {
          uid: raw.fromId,
          collection: raw.fromCollection,
        },
      };
    });

    callback(list);
  });
}

/* ------------------------------------------------------------------ */
/* 5. removeNotification – elimina una tarjeta                         */
/* ------------------------------------------------------------------ */
export async function removeNotification(
  user: { uid: string; collection: string },
  notificationId: string,
): Promise<void> {
  const db = getFirestore(app);
  const ref = doc(db, user.collection, user.uid, 'notifications', notificationId);
  await deleteDoc(ref);
}