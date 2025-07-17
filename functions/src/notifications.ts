// functions/src/notifications.ts

import 'dotenv/config';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

const APP_BASE_URL = "https://mi-app-servicios-3326e.web.app";
const DEFAULT_NOTIFICATION_ICON_URL = `${APP_BASE_URL}/icons/notification-icon.png`; 

////////////////////////////////////////////////////////////////////////////////
// Inicialización
////////////////////////////////////////////////////////////////////////////////
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

////////////////////////////////////////////////////////////////////////////////
// Tipos compartidos
////////////////////////////////////////////////////////////////////////////////
type Primitive = string | number | boolean | null;

export type Payload = Record<string, Primitive>;

export interface Recipient {
  uid: string;
  collection: string;
}

export interface Sender {
  uid: string;
  collection: string;
}

export interface NotificationData {
  to: Recipient[];
  from: Sender;
  payload: Payload;
}

export const NOTIFICATION_TYPE = {
  JOB_REQUEST: 'job_request',
  JOB_ACCEPT: 'job_accept',
  CONTACT_REQUEST: 'contact_request',
  CONTACT_FOLLOWUP: 'contact_followup',
  AGREEMENT_CONFIRMED: 'agreement_confirmed',
  RATING_REQUEST: 'rating_request',
} as const;

type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

////////////////////////////////////////////////////////////////////////////////
// Validadores
////////////////////////////////////////////////////////////////////////////////
function isNotificationData(data: unknown): data is NotificationData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Partial<NotificationData>;

  return (
    Array.isArray(d.to) &&
    d.to.every(
      (it): it is Recipient => typeof it?.uid === 'string' && typeof it?.collection === 'string'
    ) &&
    !!d.from &&
    typeof d.from.uid === 'string' &&
    typeof d.from.collection === 'string' &&
    typeof d.payload === 'object' &&
    d.payload !== null
  );
}


// --- AÑADIDO: Función de ayuda para generar contenido dinámico ---
// Aquí reside toda la inteligencia de las notificaciones.
function getNotificationDetails(
  type: NotificationType,
  payload: Payload
): { title: string; body: string; actionLink: string } {
  const senderName = typeof payload.senderName === 'string' && payload.senderName ? payload.senderName : 'Alguien';
  
  switch (type) {
    case NOTIFICATION_TYPE.JOB_REQUEST:
      const category = typeof payload.category === 'string' ? payload.category : 'un servicio';
      const description = typeof payload.description === 'string' ? `: "${payload.description.substring(0, 80)}..."` : '';
      return {
        title: `Nueva solicitud de ${category}`,
        body: `${senderName} necesita ayuda${description}`,
        actionLink: '/trabajos'
      };

    case NOTIFICATION_TYPE.JOB_ACCEPT:
      return {
        title: '¡Tu solicitud fue aceptada!',
        body: `${senderName} aceptó tu solicitud. ¡Ponte en contacto para coordinar!`,
        actionLink: '/busqueda'
      };
      
    case NOTIFICATION_TYPE.CONTACT_FOLLOWUP:
      const providerName = typeof payload.providerName === 'string' ? payload.providerName : 'el prestador';
      return {
          title: `¿Acordaste con ${providerName}?`,
          body: `Hola, solo para saber si pudiste contactar a ${providerName} y si llegaron a un acuerdo.`,
          actionLink: '/busqueda'
      };
      
    case NOTIFICATION_TYPE.RATING_REQUEST:
        const subjectId = typeof payload.subjectId === 'string' ? payload.subjectId : '';
        return {
            title: '¡Valora tu experiencia!',
            body: `El trabajo con ${senderName} ha finalizado. Por favor, califica el servicio.`,
            actionLink: `/calificar/${subjectId}`
        };

    case NOTIFICATION_TYPE.AGREEMENT_CONFIRMED:
        return {
            title: '¡Acuerdo Confirmado!',
            body: `${senderName} ha confirmado que llegaron a un acuerdo. ¡Ya puedes calificarle!`,
            actionLink: '/trabajos'
        };

    default:
      return {
        title: 'Nueva Notificación',
        body: 'Tienes un nuevo mensaje en la aplicación.',
        actionLink: '/'
      };
  }
}

////////////////////////////////////////////////////////////////////////////////
// Helper principal: creación + push
////////////////////////////////////////////////////////////////////////////////
// --- MODIFICADO: `createNotifications` ahora decide si enviar PUSH o no ---
async function createNotifications(
  recipients: Recipient[],
  from: Sender,
  type: NotificationType,
  payload: Payload,
  options: { sendPush: boolean } = { sendPush: true } // Por defecto, siempre envía push
): Promise<void> {
  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const { actionLink } = getNotificationDetails(type, payload);

  recipients.forEach(({ uid, collection }) => {
    const ref = db
      .collection(collection)
      .doc(uid)
      .collection('notifications')
      .doc();

    const notificationDocPayload: Record<string, unknown> = {
      fromId: from.uid,
      fromCollection: from.collection,
      type,
      payload,
      timestamp,
      read: false,
      actionLink: actionLink || "/", // Se guarda el enlace dinámico
    };

    batch.set(ref, notificationDocPayload);
  });

  await batch.commit();

  // Se envía el PUSH solo si la opción es verdadera
  if (options.sendPush) {
      await Promise.all(
        recipients.map((r) =>
          sendPushNotification(r.uid, r.collection, buildPushPayload(type, from, payload))
        )
      );
  }
}

// --- MODIFICADO: `buildPushPayload` ahora usa la nueva lógica ---
function buildPushPayload(
  type: NotificationType,
  from: Sender,
  payload: Payload
): Omit<admin.messaging.Message, 'token'> {
  const { title, body, actionLink } = getNotificationDetails(type, payload);
  
  const finalActionLink = actionLink.startsWith('http') 
    ? actionLink 
    : `${APP_BASE_URL}${actionLink.startsWith('/') ? actionLink : `/${actionLink}`}`;

  const fcmData: Record<string, string> = {
    type,
    fromId: from.uid,
    fromCollection: from.collection,
    click_action: finalActionLink,
  };

  Object.entries(payload).forEach(([k, v]) => {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        fcmData[k] = String(v);
    }
  });

  return {
    notification: {
        title,
        body,
    },
    data: fcmData,
    webpush: {
        notification: {
            icon: DEFAULT_NOTIFICATION_ICON_URL,
        },
        fcmOptions: {
            link: fcmData.click_action,
        },
    },
  };
}

async function sendPushNotification(
  uid: string,
  collection: string,
  pushMessageContent: Omit<admin.messaging.Message, 'token'>,
): Promise<void> {
  const userDocRef = db.collection(collection).doc(uid);
  const docSnap = await userDocRef.get();
  const fcmToken = docSnap.data()?.fcmToken as string | undefined;

  if (typeof fcmToken !== 'string' || fcmToken.length === 0) {
    console.warn(`[sendPushNotification] FCM token no encontrado o inválido para ${collection}/${uid}`);
    return;
  }

  const messageToSend: admin.messaging.Message = {
      ...pushMessageContent,
      token: fcmToken
  };

  try {
    await admin.messaging().send(messageToSend);
    console.log(`[sendPushNotification] Push enviada a ${collection}/${uid} (Token: ${fcmToken.substring(0,15)}...)`);
  } catch (error: unknown) {
    console.error(`[sendPushNotification] Error al enviar push a ${collection}/${uid}:`, error);

    if (error instanceof Error && 'code' in error) {
        const firebaseAdminError = error as unknown as admin.FirebaseError;
        if (
            firebaseAdminError.code === 'messaging/invalid-registration-token' ||
            firebaseAdminError.code === 'messaging/registration-token-not-registered'
        ) {
            console.warn(`[sendPushNotification] Token FCM inválido para ${collection}/${uid}. Eliminándolo de Firestore.`);
            try {
                await userDocRef.update({
                    fcmToken: admin.firestore.FieldValue.delete(),
                    fcmTokenTimestamp: admin.firestore.FieldValue.delete()
                });
                console.log(`[sendPushNotification] Token FCM y timestamp eliminados para ${collection}/${uid}.`);
            } catch (dbError) {
                console.error(`[sendPushNotification] Error al eliminar token FCM de Firestore para ${collection}/${uid}:`, dbError);
            }
        }
    }
  }
}

////////////////////////////////////////////////////////////////////////////////
// Cloud Tasks – seguimiento
////////////////////////////////////////////////////////////////////////////////
const tasksClient = new CloudTasksClient();
const FOLLOWUP_QUEUE = process.env.FOLLOWUP_QUEUE ?? '';
const FUNCTIONS_BASE_URL =
  process.env.FUNCTIONS_BASE_URL ??
  'https://us-central1-mi-app-servicios-3326e.cloudfunctions.net';
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL ?? '';

async function scheduleFollowupTask(
  userUid: string,
  docId: string,
  executeEpochSeconds: number,
  userCollection: string,
): Promise<void> {
  if (!FOLLOWUP_QUEUE || !FUNCTIONS_BASE_URL.startsWith('https://') || !SERVICE_ACCOUNT_EMAIL) {
    console.error('[scheduleFollowupTask] Faltan variables de entorno para Cloud Tasks (QUEUE, BASE_URL, SERVICE_ACCOUNT_EMAIL).');
    return;
  }

  const taskPayload = { userUid, docId, userCollection };

  try {
    await tasksClient.createTask({
      parent: FOLLOWUP_QUEUE,
      task: {
        scheduleTime: { seconds: executeEpochSeconds },
        httpRequest: {
          httpMethod: 'POST',
          url: `${FUNCTIONS_BASE_URL}/sendContactFollowupTask`,
          body: Buffer.from(JSON.stringify(taskPayload)).toString('base64'),
          headers: { 'Content-Type': 'application/json' },
          oidcToken: {
            serviceAccountEmail: SERVICE_ACCOUNT_EMAIL,
          },
        },
      },
    });
    console.log(`[scheduleFollowupTask] Tarea programada para ${FUNCTIONS_BASE_URL}/sendContactFollowupTask con payload:`, taskPayload);
  } catch (error) {
    console.error(`[scheduleFollowupTask] Error al crear tarea:`, error);
  }
}

interface ContactPending {
  providerId: string;
  providerCollection: string;
  providerName: string;
  via: 'whatsapp' | 'call';
  firstClickTs: number;
}

const ALLOWED_USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

export const contactPendingsOnCreate = onDocumentCreated(
  '{collection}/{uid}/contactPendings/{docId}',
  async (event) => {
    const { collection, uid, docId } = event.params;
    
    if (!ALLOWED_USER_COLLECTIONS.includes(collection)) {
        console.log(`[contactPendingsOnCreate] Activador ignorado para colección no permitida: ${collection}`);
        return;
    }

    const pending = event.data?.data() as ContactPending | undefined;

    if (!pending || typeof pending.firstClickTs !== 'number') {
      console.error(`[contactPendingsOnCreate] Documento 'pending' o 'firstClickTs' inválido. Path: ${collection}/${uid}/contactPendings/${docId}.`, pending);
      return;
    }

    const delayInSeconds = 5 * 60; // 5 minutos
    const executeAt = Math.floor(pending.firstClickTs / 1000) + delayInSeconds;
    
    console.log(`[contactPendingsOnCreate] Programando tarea (${delayInSeconds / 60} min) para user: ${collection}/${uid}, provider: ${docId}.`);

    try {
      await scheduleFollowupTask(uid, docId, executeAt, collection);
    } catch (error) {
      console.error(`[contactPendingsOnCreate] Error al llamar a scheduleFollowupTask para user: ${collection}/${uid}, provider: ${docId}. Error:`, error);
    }
  },
);

////////////////////////////////////////////////////////////////////////////////
// Callable Functions – flujo principal
////////////////////////////////////////////////////////////////////////////////

// --- ELIMINADO: La función getActionLinkForNotification ya no es necesaria.
// La nueva función getNotificationDetails se encarga de esto.

export const sendJobRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  if (!isNotificationData(data as NotificationData)) throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = data;
  // La notificación push se enviará por defecto
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_REQUEST, payload);
  return { success: true };
});

export const sendJobAccept = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  if (!isNotificationData(data as NotificationData)) throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = data;
  // La notificación push se enviará por defecto
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_ACCEPT, payload);
  return { success: true };
});

export const sendContactRequest = onCall(async (req) => {
  console.log(`[sendContactRequest] Función desactivada, no se creará ninguna notificación para el usuario ${req.auth?.uid}.`);
  return { success: true, message: 'Función desactivada.' };
});

export const sendAgreementConfirmed = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  if (!isNotificationData(data as NotificationData)) throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = data;
  // Esta notificación SÍ enviará un push
  await createNotifications(to, from, NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload, { sendPush: false });
  return { success: true };
});

// --- MODIFICADO: `sendRatingRequest` ya no enviará PUSH ---
export const sendRatingRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  if (!isNotificationData(data as NotificationData)) throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = data;
  await createNotifications(to, from, NOTIFICATION_TYPE.RATING_REQUEST, payload, { sendPush: false });
  return { success: true };
});

export const confirmAgreementAndCleanup = onCall(async (req) => {
  const { auth, data } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');

  const {
    user,
    provider,
    followupNotifId,
    originalNotifId,
    userName,
  } = data as {
    user: Recipient;
    provider: Recipient;
    followupNotifId: string;
    originalNotifId: string;
    userName: string;
  };

  if (!user?.uid || !provider?.uid || !followupNotifId || !originalNotifId) {
    throw new HttpsError('invalid-argument', 'Faltan parámetros para la limpieza de la notificación.');
  }

  try {
    const batch = db.batch();

    const followupNotifRef = db.collection(user.collection).doc(user.uid).collection('notifications').doc(followupNotifId);
    batch.delete(followupNotifRef);

    const originalNotifRef = db.collection(user.collection).doc(user.uid).collection('notifications').doc(originalNotifId);
    batch.delete(originalNotifRef);

    const pendingDocRef = db.collection(user.collection).doc(user.uid).collection('contactPendings').doc(provider.uid);
    batch.delete(pendingDocRef);

    const agreementNotifRef = db.collection(provider.collection).doc(provider.uid).collection('notifications').doc();
    const payload: Payload = {
      description: `${userName || 'Un usuario'} ha confirmado que llegaron a un acuerdo. ¡Felicidades! Ahora puedes calificarle.`,
      senderName: userName || 'Usuario',
      fromId: user.uid,
      fromCollection: user.collection,
    };
    
    // --- MODIFICADO: Se usa la nueva función para obtener el enlace ---
    const { actionLink } = getNotificationDetails(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload);

    batch.set(agreementNotifRef, {
      fromId: user.uid,
      fromCollection: user.collection,
      type: NOTIFICATION_TYPE.AGREEMENT_CONFIRMED,
      payload,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
      actionLink: actionLink || "/",
    });

    await batch.commit();

    // Se envía el push usando la nueva lógica
    await sendPushNotification(provider.uid, provider.collection, buildPushPayload(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, user, payload));

    console.log(`[confirmAgreementAndCleanup] Limpieza completada para el usuario ${user.uid} y notificación enviada al proveedor ${provider.uid}.`);
    return { success: true, message: "Acuerdo confirmado y limpieza realizada." };

  } catch (error) {
    console.error({
        message: "[confirmAgreementAndCleanup] Error detallado al confirmar acuerdo y limpiar.",
        errorDetails: error,
        requestData: data
    });
    throw new HttpsError('internal', 'Ocurrió un error al procesar la solicitud de confirmación.');
  }
});

// --- MODIFICADO: `sendContactFollowupTask` ya no enviará PUSH ---
export const sendContactFollowupTask = onRequest(async (req, res) => {
  const { userUid, docId, userCollection } = req.body as { userUid?: string; docId?: string; userCollection?: string };

  if (!userUid || !docId || !userCollection) {
    console.error('[sendContactFollowupTask] Faltan userUid, docId o userCollection en el body:', req.body);
    res.status(400).send('Bad Request: missing parameters');
    return;
  }

  const pendingSnap = await db
    .collection(userCollection)
    .doc(userUid)
    .collection('contactPendings')
    .doc(docId)
    .get();

  if (!pendingSnap.exists) {
    console.log(`[sendContactFollowupTask] Documento contactPendings no encontrado para user: ${userCollection}/${userUid}.`);
    res.status(200).send('contactPendings doc not found, followup not sent.');
    return;
  }

  const pending = pendingSnap.data() as ContactPending & { originalNotifId?: string };
  const to: Recipient[] = [{ uid: userUid, collection: userCollection }]; 
  const appSystemSender: Sender = {
    uid: pending.providerId,
    collection: pending.providerCollection,
  };

  const followupPayload: Payload = {
    senderName: 'Co-Dy-S',
    providerName: pending.providerName, // Se usa para el texto dinámico
    description: `¡Hola! Solo queríamos saber si pudiste contactar a ${pending.providerName} y si llegaron a un acuerdo.`,
    originalNotifId: pending.originalNotifId ?? '',
  };

  console.log(`[sendContactFollowupTask] Creando notificación CONTACT_FOLLOWUP (sin push) para user: ${userUid}.`);

  try {
    // Se añade la opción para no enviar PUSH
    await createNotifications(
      to,
      appSystemSender,
      NOTIFICATION_TYPE.CONTACT_FOLLOWUP,
      followupPayload,
      { sendPush: false }
    );
    res.json({ success: true });
  } catch (error) {
    console.error(`[sendContactFollowupTask] Error al procesar user: ${userUid}, providerId: ${docId}.`, error);
    res.status(500).send('Error processing contact followup task.');
  }
});