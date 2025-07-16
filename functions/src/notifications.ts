// Este es el archivo completo y corregido. Cópialo y pégalo en tu proyecto.

import 'dotenv/config';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

const APP_BASE_URL = "https://mi-app-servicios-3326e.web.app";
const DEFAULT_NOTIFICATION_ICON_URL = `${APP_BASE_URL}/logo1.png`;

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
  actionLink?: string;
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
    d.payload !== null &&
    (d.actionLink === undefined || typeof d.actionLink === 'string')
  );
}

////////////////////////////////////////////////////////////////////////////////
// Helper principal: creación + push
////////////////////////////////////////////////////////////////////////////////
async function createNotifications(
  recipients: Recipient[],
  from: Sender,
  type: NotificationType,
  payload: Payload,
  actionLink?: string
): Promise<void> {
  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

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
    };
    if (actionLink) {
        notificationDocPayload.actionLink = actionLink;
    }

    batch.set(ref, notificationDocPayload);
  });

  await batch.commit();

  await Promise.all(
    recipients.map((r) =>
      sendPushNotification(r.uid, r.collection, buildPushPayload(type, from, payload, actionLink))
    )
  );
}

function buildPushPayload(
  type: NotificationType,
  from: Sender,
  payload: Payload,
  actionLink?: string
): Omit<admin.messaging.Message, 'token'> {
  const title = typeof payload.senderName === 'string' && payload.senderName ? payload.senderName : 'Nueva notificación';
  const body =
    typeof payload.description === 'string'
      ? payload.description
      : `Tienes un nuevo mensaje de tipo ${type}`;

  const fcmData: Record<string, string> = {
    type,
    fromId: from.uid,
    fromCollection: from.collection,
    click_action: actionLink ? (actionLink.startsWith('http') ? actionLink : `${APP_BASE_URL}${actionLink.startsWith('/') ? actionLink : `/${actionLink}`}`) : APP_BASE_URL,
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
// Cloud Tasks – seguimiento (SECCIÓN MODIFICADA)
////////////////////////////////////////////////////////////////////////////////
const tasksClient = new CloudTasksClient();
const FOLLOWUP_QUEUE = process.env.FOLLOWUP_QUEUE ?? '';
const FUNCTIONS_BASE_URL =
  process.env.FUNCTIONS_BASE_URL ??
  'https://us-central1-mi-app-servicios-3326e.cloudfunctions.net';
// Nueva variable para la cuenta de servicio (configurar en .env)
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL ?? '';

async function scheduleFollowupTask(
  userUid: string,
  docId: string,
  executeEpochSeconds: number,
  userCollection: string, // <-- 1. Se añade 'userCollection' para saber dónde buscar
): Promise<void> {
  if (!FOLLOWUP_QUEUE) {
    console.error('[scheduleFollowupTask] FOLLOWUP_QUEUE env var no definida');
    return;
  }
  if (!FUNCTIONS_BASE_URL.startsWith('https://')) {
     console.error('[scheduleFollowupTask] FUNCTIONS_BASE_URL no parece ser una URL válida:', FUNCTIONS_BASE_URL);
     return;
  }
  // Añadida validación para la cuenta de servicio
  if (!SERVICE_ACCOUNT_EMAIL) {
    console.error('[scheduleFollowupTask] SERVICE_ACCOUNT_EMAIL env var no definida. La tarea no se autenticará.');
    return;
  }

  // Se añade 'userCollection' al payload de la tarea
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
          // <-- 2. Se añade token OIDC para autenticar la tarea en la función HTTP
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

// Lista de colecciones de usuarios permitidas
const ALLOWED_USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

export const contactPendingsOnCreate = onDocumentCreated(
  // <-- 3. El activador ahora escucha en todas las colecciones de usuario
  '{collection}/{uid}/contactPendings/{docId}',
  async (event) => {
    // Se obtienen todos los parámetros de la ruta, incluyendo la colección
    const { collection, uid, docId } = event.params;
    
    // Medida de seguridad: solo procesar si la colección es una de las esperadas
    if (!ALLOWED_USER_COLLECTIONS.includes(collection)) {
        console.log(`[contactPendingsOnCreate] Activador ignorado para colección no permitida: ${collection}`);
        return;
    }

    const pending = event.data?.data() as ContactPending | undefined;

    if (!pending || typeof pending.firstClickTs !== 'number') {
      console.error(`[contactPendingsOnCreate] Documento 'pending' o 'firstClickTs' inválido. Path: ${collection}/${uid}/contactPendings/${docId}.`, pending);
      return;
    }

    const delayInSeconds = 5 * 60; // 5 minutos (puedes ajustar este valor)
    const executeAt = Math.floor(pending.firstClickTs / 1000) + delayInSeconds;
    
    console.log(`[contactPendingsOnCreate] Programando tarea (${delayInSeconds / 60} min) para user: ${collection}/${uid}, provider: ${docId}. executeAt (epoch seconds): ${executeAt}, Fecha ISO: ${new Date(executeAt * 1000).toISOString()}`);

    try {
      // Se pasa el nombre de la colección a la función que crea la tarea
      await scheduleFollowupTask(uid, docId, executeAt, collection);
    } catch (error) {
      console.error(`[contactPendingsOnCreate] Error al llamar a scheduleFollowupTask para user: ${collection}/${uid}, provider: ${docId}. Error:`, error);
    }
  },
);

////////////////////////////////////////////////////////////////////////////////
// Callable Functions – flujo principal
////////////////////////////////////////////////////////////////////////////////
function getActionLinkForNotification(type: NotificationType, payload: Payload): string | undefined {
    switch (type) {
        case NOTIFICATION_TYPE.JOB_REQUEST:
            return typeof payload.jobId === 'string' ? `/trabajos/${payload.jobId}` : '/trabajos';
        case NOTIFICATION_TYPE.JOB_ACCEPT:
            return typeof payload.jobId === 'string' ? `/trabajos/${payload.jobId}` : '/trabajos';
        case NOTIFICATION_TYPE.CONTACT_REQUEST:
            return typeof payload.chatId === 'string' ? `/respuestas?chatId=${payload.chatId}` : '/respuestas';
        case NOTIFICATION_TYPE.CONTACT_FOLLOWUP:
            return '/respuestas';
        case NOTIFICATION_TYPE.AGREEMENT_CONFIRMED:
            return typeof payload.agreementId === 'string' ? `/acuerdos/${payload.agreementId}` : '/respuestas';
        case NOTIFICATION_TYPE.RATING_REQUEST:
            return typeof payload.subjectId === 'string' ? `/calificar/${payload.subjectId}` : '/';
        default:
            return '/';
    }
}

export const sendJobRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.JOB_REQUEST, payload);
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_REQUEST, payload, actionLink);
  return { success: true };
});

export const sendJobAccept = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.JOB_ACCEPT, payload);
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_ACCEPT, payload, actionLink);
  return { success: true };
});

// ========================================================================
// FUNCIÓN DESACTIVADA PARA EVITAR NOTIFICACIONES FANTASMA
// ========================================================================
export const sendContactRequest = onCall(async (req) => {
  console.log(`[sendContactRequest] Función desactivada, no se creará ninguna notificación para el usuario ${req.auth?.uid}.`);
  return { success: true, message: 'Función desactivada.' };
});

export const sendAgreementConfirmed = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload);
  await createNotifications(to, from, NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload, actionLink);
  return { success: true };
});

export const sendRatingRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.RATING_REQUEST, payload);
  await createNotifications(to, from, NOTIFICATION_TYPE.RATING_REQUEST, payload, actionLink);
  return { success: true };
});

// ========================================================================
// FUNCIÓN CENTRALIZADA PARA LIMPIEZA
// ========================================================================
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
    const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload);

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

    await sendPushNotification(provider.uid, provider.collection, buildPushPayload(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, user, payload, actionLink));

    console.log(`[confirmAgreementAndCleanup] Limpieza completada para el usuario ${user.uid} y notificación enviada al proveedor ${provider.uid}.`);
    return { success: true, message: "Acuerdo confirmado y limpieza realizada." };

  } catch (error) {
    console.error({
        message: "[confirmAgreementAndCleanup] Error detallado al confirmar acuerdo y limpiar.",
        errorDetails: error,
        requestData: data
    });
    throw new HttpsError('internal', 'Ocurrió un error al procesar la solicitud de confirmación. Revisa los logs del backend para más detalles.');
  }
});

// ========================================================================
// HTTP endpoint – ejecutado por Cloud Tasks (SECCIÓN MODIFICADA)
// ========================================================================
export const sendContactFollowupTask = onRequest(async (req, res) => {
  // <-- 4. Se recibe 'userCollection' del payload de la tarea
  const { userUid, docId, userCollection } = req.body as { userUid?: string; docId?: string; userCollection?: string };

  if (!userUid || !docId || !userCollection) {
    console.error('[sendContactFollowupTask] Faltan userUid, docId o userCollection en el body:', req.body);
    res.status(400).send('Bad Request: missing parameters');
    return;
  }

  // Se usa la 'userCollection' dinámica para encontrar el documento
  const pendingSnap = await db
    .collection(userCollection) // <-- 5. Se usa la colección dinámica
    .doc(userUid)
    .collection('contactPendings')
    .doc(docId)
    .get();

  if (!pendingSnap.exists) {
    console.log(`[sendContactFollowupTask] Documento contactPendings no encontrado para user: ${userCollection}/${userUid}, providerId (docId): ${docId}. La tarea no enviará notificación.`);
    res.status(200).send('contactPendings doc not found, followup not sent.');
    return;
  }

  const pending = pendingSnap.data() as ContactPending & { originalNotifId?: string };
  // Se usa la 'userCollection' para crear el destinatario de la notificación
  const to: Recipient[] = [{ uid: userUid, collection: userCollection }]; // <-- 6. Se usa la colección dinámica

  const appSystemSender: Sender = {
    uid: pending.providerId,
    collection: pending.providerCollection,
  };

  const followupPayload: Payload = {
    senderName: 'Co-Dy-S',
    avatarUrl: '/logo1.png',
    description: `¡Hola! Solo queríamos saber si pudiste contactar a ${pending.providerName} y si llegaron a un acuerdo sobre el trabajo/servicio.`,
    originalNotifId: pending.originalNotifId ?? '',
  };

  console.log(`[sendContactFollowupTask] Enviando CONTACT_FOLLOWUP a user: ${userUid} desde ${appSystemSender.uid} (${followupPayload.senderName}), referente a provider: ${pending.providerName}`);

  try {
    const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.CONTACT_FOLLOWUP, followupPayload);

    await createNotifications(
      to,
      appSystemSender,
      NOTIFICATION_TYPE.CONTACT_FOLLOWUP,
      followupPayload,
      actionLink
    );

    res.json({ success: true });
  } catch (error) {
    console.error(`[sendContactFollowupTask] Error al procesar user: ${userUid}, providerId: ${docId}.`, error);
    res.status(500).send('Error processing contact followup task.');
  }
});