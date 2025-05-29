import 'dotenv/config';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { CloudTasksClient } from '@google-cloud/tasks';

// <--- NUEVO: URL base de tu aplicación y URL del ícono de notificación
const APP_BASE_URL = "https://mi-app-servicios-3326e.web.app";
const DEFAULT_NOTIFICATION_ICON_URL = `${APP_BASE_URL}/logo.png`; // Asumiendo que tienes public/logo.png en tu frontend

////////////////////////////////////////////////////////////////////////////////
// Inicialización
////////////////////////////////////////////////////////////////////////////////
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore(); // <--- NUEVO: Definir db aquí para uso global en el archivo

////////////////////////////////////////////////////////////////////////////////
// Tipos compartidos (Payload modificado para anidación)
////////////////////////////////////////////////////////////////////////////////
type Primitive = string | number | boolean | null;

// <--- MODIFICADO: Payload ahora puede tener un objeto 'data' para FCM, que puede tener sus propios campos.
// Esto es para permitir que el 'payload' original siga siendo simple, y los datos específicos de FCM
// como click_action vayan dentro de un sub-objeto 'data' si es necesario, o directamente.
// Por ahora, mantendremos tu 'Payload' original simple y construiremos el 'data' de FCM por separado.
export type Payload = Record<string, Primitive>;

export interface Recipient {
  uid: string;
  collection: string;
}

export interface Sender {
  uid: string;
  collection: string;
}

// <--- MODIFICADO: NotificationData ahora puede incluir actionLink para el click_action
export interface NotificationData {
  to: Recipient[];
  from: Sender;
  payload: Payload;
  actionLink?: string; // Opcional: ruta relativa como "/respuestas" o "/trabajos/ID"
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
// Validadores (sin cambios)
////////////////////////////////////////////////////////////////////////////////
function isNotificationData(data: unknown): data is NotificationData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Partial<NotificationData>; // Usar Partial para chequeo gradual

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
    (d.actionLink === undefined || typeof d.actionLink === 'string') // <--- NUEVO: Validar actionLink si existe
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
  actionLink?: string // <--- MODIFICADO: Añadir actionLink opcional
): Promise<void> {
  // const db = admin.firestore(); // db ya está definido globalmente
  const batch = db.batch();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  recipients.forEach(({ uid, collection }) => {
    const ref = db
      .collection(collection)
      .doc(uid)
      .collection('notifications')
      .doc();

    // <--- MODIFICADO: Añadir título y cuerpo al documento de notificación para consistencia
    // y para que el trigger `onNotificationCreatedSendPush` (si lo tuviéramos) pueda usarlos.
    // Por ahora, tu `buildPushPayload` los genera, así que esto es más para el futuro o si quieres logs.
    const notificationDocPayload: Record<string, unknown> = { // Usar Record<string, unknown> para flexibilidad
      fromId: from.uid,
      fromCollection: from.collection,
      type,
      payload, // payload original
      timestamp,
      read: false,
      // Opcional: podrías añadir title y body aquí si quieres que se guarden en Firestore también
      // title: typeof payload.senderName === 'string' && payload.senderName ? payload.senderName : 'Nueva notificación',
      // body: typeof payload.description === 'string' ? payload.description : `Tienes un nuevo mensaje de tipo ${type}`,
      // actionLink: actionLink || "/", // Guardar el actionLink también
    };
    if (actionLink) { // Solo añadir si existe
        notificationDocPayload.actionLink = actionLink;
    }

    batch.set(ref, notificationDocPayload);
  });

  await batch.commit();

  // Enviar notificación push si es necesario
  await Promise.all(
    recipients.map((r) =>
      sendPushNotification(r.uid, r.collection, buildPushPayload(type, from, payload, actionLink)) // <--- MODIFICADO: Pasar actionLink
    )
  );
}

function buildPushPayload(
  type: NotificationType,
  from: Sender,
  payload: Payload,
  actionLink?: string // <--- MODIFICADO: Recibir actionLink
): Omit<admin.messaging.Message, 'token'> {
  const title = typeof payload.senderName === 'string' && payload.senderName ? payload.senderName : 'Nueva notificación';
  const body =
    typeof payload.description === 'string'
      ? payload.description
      : `Tienes un nuevo mensaje de tipo ${type}`;

  // <--- MODIFICADO: Construcción del objeto 'data' para FCM
  const fcmData: Record<string, string> = {
    type, // El tipo de notificación original
    fromId: from.uid,
    fromCollection: from.collection,
    // click_action es la clave para el Service Worker.
    // Usamos la APP_BASE_URL para asegurar que sea una URL absoluta si actionLink es relativo,
    // o si actionLink es una URL completa, se usa esa. Si no hay actionLink, va a la raíz de la app.
    click_action: actionLink ? (actionLink.startsWith('http') ? actionLink : `${APP_BASE_URL}${actionLink.startsWith('/') ? actionLink : `/${actionLink}`}`) : APP_BASE_URL,
  };

  // Incluir el payload original en fcmData para que el cliente lo tenga si es necesario
  // (El Service Worker podría usarlo, o la app cuando se abre desde la notificación)
  Object.entries(payload).forEach(([k, v]) => {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') { // Asegurar que solo se añaden primitivos como string
        fcmData[k] = String(v);
    }
  });

  return {
    notification: { // Propiedades básicas de la notificación visibles en muchas plataformas
        title,
        body,
        // 'icon' se mueve a webpush.notification para mejor compatibilidad con FCM Admin SDK y Web Push
    },
    data: fcmData, // Tus datos personalizados, incluyendo el click_action
    webpush: { // Configuración específica para notificaciones web push
        notification: {
            // Aquí es donde comúnmente se especifica el ícono para web push
            icon: DEFAULT_NOTIFICATION_ICON_URL,
            // Podrías añadir más propiedades específicas de webpush aquí si las necesitas:
            // badge: "URL_A_UN_BADGE_ICON",
            // image: "URL_A_UNA_IMAGEN_GRANDE_EN_LA_NOTIFICACION",
            // actions: [
            //   { action: "explore", title: "Ver más" },
            //   { action: "close", title: "Cerrar" }
            // ],
            // tag: "IDENTIFICADOR_PARA_AGRUPAR_O_REEMPLAZAR_NOTIFICACIONES",
            // click_action: fcmData.click_action // Redundante si ya tienes fcmOptions.link y el SW maneja data.click_action, pero a veces se incluye.
                                                // El Service Worker que creamos se basa en data.click_action.
        },
        fcmOptions: {
            // El 'link' aquí es una forma fuerte de indicar al Service Worker
            // (especialmente si el navegador lo soporta directamente) a dónde ir al hacer clic.
            link: fcmData.click_action,
        },
    },
    // Si quisieras soportar APNS (iOS) o Android de forma nativa, añadirías objetos 'apns' y 'android' aquí.
    // apns: { /* ...payload específico de APNS... */ },
    // android: { /* ...payload específico de Android... */ },
  };
}

async function sendPushNotification(
  uid: string,
  collection: string,
  pushMessageContent: Omit<admin.messaging.Message, 'token'>, // <--- MODIFICADO: Renombrado para claridad
): Promise<void> {
  // const db = admin.firestore(); // db ya está definido globalmente
  const userDocRef = db.collection(collection).doc(uid); // <--- NUEVO: Guardar la referencia al documento
  const docSnap = await userDocRef.get();
  const fcmToken = docSnap.data()?.fcmToken as string | undefined; // <--- MODIFICADO: Tipar como string | undefined

  if (typeof fcmToken !== 'string' || fcmToken.length === 0) {
    console.warn(`[sendPushNotification] FCM token no encontrado o inválido para ${collection}/${uid}`);
    return;
  }

  const messageToSend: admin.messaging.Message = {
      ...pushMessageContent,
      token: fcmToken
  };

  try {
    await admin.messaging().send(messageToSend); // <--- MODIFICADO: Usar send() que es más genérico y recomendado
    console.log(`[sendPushNotification] Push enviada a ${collection}/${uid} (Token: ${fcmToken.substring(0,15)}...)`);
  } catch (error: unknown) { // <--- MODIFICADO: Capturar como unknown
    console.error(`[sendPushNotification] Error al enviar push a ${collection}/${uid}:`, error);

    // <--- NUEVO: Manejo básico de errores de token (opcional pero recomendado)
    // Si el token es inválido, lo borramos de Firestore para no reintentar.
    // Es importante que el tipo del error sea el correcto de Firebase Admin SDK
    if (error instanceof Error && 'code' in error) {
        const firebaseAdminError = error as unknown as admin.FirebaseError; // Hacer type assertion
        if (
            firebaseAdminError.code === 'messaging/invalid-registration-token' ||
            firebaseAdminError.code === 'messaging/registration-token-not-registered'
        ) {
            console.warn(`[sendPushNotification] Token FCM inválido para ${collection}/${uid}. Eliminándolo de Firestore.`);
            try {
                await userDocRef.update({
                    fcmToken: admin.firestore.FieldValue.delete(),
                    fcmTokenTimestamp: admin.firestore.FieldValue.delete() // También eliminar el timestamp
                });
                console.log(`[sendPushNotification] Token FCM y timestamp eliminados para ${collection}/${uid}.`);
            } catch (dbError) {
                console.error(`[sendPushNotification] Error al eliminar token FCM de Firestore para ${collection}/${uid}:`, dbError);
            }
        }
    }
    // --- FIN NUEVO ---
  }
}

////////////////////////////////////////////////////////////////////////////////
// Cloud Tasks – seguimiento (sin cambios en su lógica interna, pero sus llamadas a createNotifications necesitarán `actionLink`)
////////////////////////////////////////////////////////////////////////////////
const tasksClient = new CloudTasksClient();
const FOLLOWUP_QUEUE = process.env.FOLLOWUP_QUEUE ?? '';
const FUNCTIONS_BASE_URL =
  process.env.FUNCTIONS_BASE_URL ??
  'https://us-central1-mi-app-servicios-3326e.cloudfunctions.net'; // <--- MODIFICADO: Usar una URL real si es diferente, o la genérica que tenías si aplica a tu región

// ... (scheduleFollowupTask y contactPendingsOnCreate se mantienen igual en su definición) ...
// PERO la llamada a createNotifications desde sendContactFollowupTask debería incluir el actionLink.

async function scheduleFollowupTask(
  userUid: string,
  docId: string, // Este es el providerId
  executeEpochSeconds: number,
): Promise<void> {
  if (!FOLLOWUP_QUEUE) {
    console.error('[scheduleFollowupTask] FOLLOWUP_QUEUE env var no definida');
    return;
  }
  if (!FUNCTIONS_BASE_URL.startsWith('https://')) {
     console.error('[scheduleFollowupTask] FUNCTIONS_BASE_URL no parece ser una URL válida:', FUNCTIONS_BASE_URL);
     return;
  }

  const taskPayload = { userUid, docId };

  try {
    await tasksClient.createTask({
      parent: FOLLOWUP_QUEUE,
      task: {
        scheduleTime: { seconds: executeEpochSeconds },
        httpRequest: {
          httpMethod: 'POST',
          url: `${FUNCTIONS_BASE_URL}/sendContactFollowupTask`, // Asegúrate que esta función exista y sea HTTP
          body: Buffer.from(JSON.stringify(taskPayload)).toString('base64'),
          headers: { 'Content-Type': 'application/json' },
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
  firstClickTs: number; // epoch ms
}

export const contactPendingsOnCreate = onDocumentCreated(
  'usuarios_generales/{uid}/contactPendings/{docId}',
  async (event) => {
    const { uid, docId } = event.params;
    const pending = event.data?.data() as ContactPending | undefined;

    if (!pending || typeof pending.firstClickTs !== 'number') {
      console.error(`[contactPendingsOnCreate] Documento 'pending' o 'firstClickTs' no encontrado o no es un número. UID: ${uid}, DocID (providerId): ${docId}. Datos de pending:`, pending);
      return;
    }

    const delayInSeconds = 5 * 60; 
    const executeAt = Math.floor(pending.firstClickTs / 1000) + delayInSeconds;
    
    console.log(`[contactPendingsOnCreate] Programando tarea (${delayInSeconds / 60} min) para user: ${uid}, provider: ${docId}. executeAt (epoch seconds): ${executeAt}, Fecha ISO: ${new Date(executeAt * 1000).toISOString()}`);

    try {
      await scheduleFollowupTask(uid, docId, executeAt);
    } catch (error) {
      console.error(`[contactPendingsOnCreate] Error al llamar a scheduleFollowupTask para user: ${uid}, provider: ${docId}. Error:`, error);
    }
  },
);

////////////////////////////////////////////////////////////////////////////////
// Callable Functions – flujo principal
// (Modificadas para pasar actionLink si es aplicable)
////////////////////////////////////////////////////////////////////////////////

// Ejemplo de cómo podrías definir un actionLink para un tipo de notificación
function getActionLinkForNotification(type: NotificationType, payload: Payload): string | undefined {
    switch (type) {
        case NOTIFICATION_TYPE.JOB_REQUEST:
            // Suponiendo que payload.jobId existe para este tipo
            return typeof payload.jobId === 'string' ? `/trabajos/${payload.jobId}` : '/trabajos';
        case NOTIFICATION_TYPE.JOB_ACCEPT:
            return typeof payload.jobId === 'string' ? `/trabajos/${payload.jobId}` : '/trabajos';
        case NOTIFICATION_TYPE.CONTACT_REQUEST: // Para respuestas de prestador
            return typeof payload.chatId === 'string' ? `/respuestas?chatId=${payload.chatId}` : '/respuestas';
        case NOTIFICATION_TYPE.CONTACT_FOLLOWUP: // Para el usuario general
            return '/respuestas'; // O una página específica de seguimiento si la tienes
        case NOTIFICATION_TYPE.AGREEMENT_CONFIRMED:
            return typeof payload.agreementId === 'string' ? `/acuerdos/${payload.agreementId}` : '/respuestas'; // Asumiendo que tienes una página de acuerdos
        case NOTIFICATION_TYPE.RATING_REQUEST:
            return typeof payload.subjectId === 'string' ? `/calificar/${payload.subjectId}` : '/'; // Asumiendo una página para calificar
        default:
            return '/'; // fallback a la página principal
    }
}

export const sendJobRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  
  // <--- MODIFICADO: Validar con la interfaz NotificationData que ahora puede tener actionLink
  // El actionLink vendrá del cliente o se generará aquí. Por ahora, lo generamos aquí.
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload }; // Asumimos que el cliente envía payload como lo hacía antes
  if (!isNotificationData({ ...notificationInput, actionLink: undefined })) // Validar estructura básica
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.JOB_REQUEST, payload); // <--- NUEVO
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_REQUEST, payload, actionLink); // <--- MODIFICADO
  return { success: true };
});

export const sendJobAccept = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.JOB_ACCEPT, payload); // <--- NUEVO
  await createNotifications(to, from, NOTIFICATION_TYPE.JOB_ACCEPT, payload, actionLink); // <--- MODIFICADO
  return { success: true };
});

export const sendContactRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.CONTACT_REQUEST, payload); // <--- NUEVO
  await createNotifications(to, from, NOTIFICATION_TYPE.CONTACT_REQUEST, payload, actionLink); // <--- MODIFICADO
  return { success: true };
});

export const sendAgreementConfirmed = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload); // <--- NUEVO
  await createNotifications(to, from, NOTIFICATION_TYPE.AGREEMENT_CONFIRMED, payload, actionLink); // <--- MODIFICADO
  return { success: true };
});

export const sendRatingRequest = onCall(async (req) => {
  const { data, auth } = req;
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Authentication required');
  const notificationInput = data as Omit<NotificationData, 'actionLink'> & { payload: Payload };
  if (!isNotificationData({ ...notificationInput, actionLink: undefined }))
    throw new HttpsError('invalid-argument', 'Invalid data payload');

  const { to, from, payload } = notificationInput;
  const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.RATING_REQUEST, payload); // <--- NUEVO
  await createNotifications(to, from, NOTIFICATION_TYPE.RATING_REQUEST, payload, actionLink); // <--- MODIFICADO
  return { success: true };
});


// ========================================================================
// HTTP endpoint – ejecutado por Cloud Tasks (MODIFICADO)
// ========================================================================
export const sendContactFollowupTask = onRequest(async (req, res) => {
  const { userUid, docId } = req.body as { userUid?: string; docId?: string };

  if (!userUid || !docId) {
    console.error('[sendContactFollowupTask] Faltan userUid o docId en el body:', req.body);
    res.status(400).send('Bad Request: missing parameters');
    return;
  }

  // const db = admin.firestore(); // db ya está definido globalmente
  const pendingSnap = await db
    .collection('usuarios_generales')
    .doc(userUid)
    .collection('contactPendings')
    .doc(docId)
    .get();

  if (!pendingSnap.exists) {
    console.log(`[sendContactFollowupTask] Documento contactPendings no encontrado para user: ${userUid}, providerId (docId): ${docId}. La tarea no enviará notificación.`);
    res.status(200).send('contactPendings doc not found, followup not sent.');
    return;
  }

  const pending = pendingSnap.data() as ContactPending; // Asumimos que ContactPending está bien definido
  const to: Recipient[] = [{ uid: userUid, collection: 'usuarios_generales' }];
  
  const appSystemSender: Sender = {
    uid: pending.providerId,
    collection: pending.providerCollection
  };

  const followupPayload: Payload = {
    senderName: 'Co-Dy-S',
    avatarUrl: '/logo.png', // Esta URL es relativa, para la push se usará DEFAULT_NOTIFICATION_ICON_URL
    description: `¡Hola! Solo queríamos saber si pudiste contactar a ${pending.providerName} y si llegaron a un acuerdo sobre el trabajo/servicio.`
  };
  
  console.log(`[sendContactFollowupTask] Enviando CONTACT_FOLLOWUP a user: ${userUid} desde ${appSystemSender.uid} (${followupPayload.senderName}), referente a provider: ${pending.providerName}`);
  
  try {
    // <--- MODIFICADO: Determinar el actionLink para esta notificación específica
    const actionLink = getActionLinkForNotification(NOTIFICATION_TYPE.CONTACT_FOLLOWUP, followupPayload);
    
    await createNotifications(
      to,
      appSystemSender,
      NOTIFICATION_TYPE.CONTACT_FOLLOWUP,
      followupPayload,
      actionLink // <--- MODIFICADO: Pasar el actionLink
    );

    res.json({ success: true });
  } catch (error) {
    console.error(`[sendContactFollowupTask] Error al procesar user: ${userUid}, providerId: ${docId}.`, error);
    res.status(500).send('Error processing contact followup task.');
  }
});