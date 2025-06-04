import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

if (admin.apps.length === 0) {
  admin.initializeApp();
}

interface PaymentSuccessRequestBody {
  anuncioId?: string;
}

interface HttpError extends Error {
  status?: number;
}

// --- INICIO SECCIÓN CORS MODIFICADA ---
// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:3000',                     // Para desarrollo local
  'https://mi-app-servicios-3326e.web.app'   // <--- TU DOMINIO DE PRODUCCIÓN AÑADIDO
  // Puedes añadir más orígenes si es necesario (ej. tus URLs de preview de Firebase Hosting)
  // 'https://<tu-proyecto>.web.app',
  // 'https://<tu-proyecto>.firebaseapp.com',
];

export const onPaymentSuccess = functions.https.onRequest(async (req, res) => {
  const origin = req.headers.origin as string;

  // Establecer cabeceras CORS si el origen está permitido
  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else if (origin) { // Si el origen existe pero no está permitido, aún así es bueno manejar OPTIONS
    console.warn(`onPaymentSuccess: Origen ${origin} no está en allowedOrigins.`);
    // Podrías no setear 'Access-Control-Allow-Origin' aquí o setearlo a un valor que no lo permita,
    // pero para OPTIONS, usualmente se responde positivamente si el método es OPTIONS.
  } else {
    console.warn(`onPaymentSuccess: No se detectó header 'origin' en la solicitud.`);
  }

  // Siempre manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    console.log('onPaymentSuccess: OPTIONS request received from:', origin || 'origen desconocido');
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); // Asegúrate que POST esté aquí
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret'); // 'Authorization' si usas tokens, 'Content-Type' es común
    res.set('Access-Control-Max-Age', '3600'); // Cachear la respuesta preflight por 1 hora
    res.status(204).send(''); // 204 No Content es la respuesta estándar para OPTIONS exitoso
    return;
  }

  // Después de manejar OPTIONS, si no es un método permitido, rechazar.
  // Para este webhook, probablemente solo quieras POST.
  if (req.method !== 'POST') {
    console.log(`onPaymentSuccess: Método ${req.method} no permitido.`);
    // El navegador ya podría haber bloqueado esto si las cabeceras OPTIONS no permitían POST,
    // pero es una buena segunda capa de defensa.
    res.setHeader('Allow', 'POST, OPTIONS'); // Informar al cliente qué métodos son permitidos
    res.status(405).send({ error: 'Método no permitido. Solo se acepta POST.' });
    return;
  }
  // --- FIN SECCIÓN CORS MODIFICADA ---

  // ────────────────────────────────────────────────────────────────────────────────
  // SECCIÓN DE VERIFICACIÓN DE SECRETO (sin cambios, la mantienes comentada)
  // ────────────────────────────────────────────────────────────────────────────────
  /*
  const expectedSecret = functions.config().payment?.webhook_secret;
  // ... (resto de tu lógica de secreto)
  */
  // ────────────────────────────────────────────────────────────────────────────────

  try {
    console.log('onPaymentSuccess: POST request received. Body:', req.body);
    const { anuncioId } = req.body as PaymentSuccessRequestBody;

    if (!anuncioId || typeof anuncioId !== 'string') {
      console.warn('onPaymentSuccess: anuncioId no válido o faltante en el body:', anuncioId);
      res.status(400).send({ error: 'El campo "anuncioId" es requerido y debe ser un string.' });
      return;
    }

    const db = admin.firestore();
    const docRef = db.collection('anuncios').doc(anuncioId);
    const now = Timestamp.now();

    await db.runTransaction(async (transaction) => {
      console.log(`onPaymentSuccess: Iniciando transacción para anuncioId: ${anuncioId}`);
      const snap = await transaction.get(docRef);

      if (!snap.exists) {
        console.warn(`onPaymentSuccess: Anuncio con ID "${anuncioId}" no encontrado en transacción.`);
        const notFoundError = new Error(
          `Anuncio con ID "${anuncioId}" no encontrado.`
        ) as HttpError;
        notFoundError.status = 404;
        throw notFoundError;
      }

      const data = snap.data();
      if (!data) {
        console.error(`onPaymentSuccess: No se pudieron obtener los datos del anuncio "${anuncioId}" a pesar de que existe.`);
        const dataError = new Error(
          `No se pudieron obtener los datos del anuncio "${anuncioId}".`
        ) as HttpError;
        dataError.status = 500;
        throw dataError;
      }

      if (data.status === 'active') {
        console.log(
          `onPaymentSuccess: El anuncio "${anuncioId}" ya se encuentra activo. No se requieren acciones.`
        );
        return; 
      }

      const durationDays = data.campaignDurationDays;
      if (typeof durationDays !== 'number' || durationDays <= 0) {
        console.warn(`onPaymentSuccess: Duración de campaña inválida (${durationDays}) para anuncio "${anuncioId}".`);
        const durationError = new Error(
          `La duración de la campaña ("campaignDurationDays": ${durationDays}) para el anuncio "${anuncioId}" no es válida o falta.`
        ) as HttpError;
        durationError.status = 400;
        throw durationError;
      }

      const startDate = now;
      const endDate = Timestamp.fromDate(
        new Date(now.toDate().getTime() + durationDays * 24 * 60 * 60 * 1000)
      );

      console.log(`onPaymentSuccess: Actualizando anuncio "${anuncioId}" a activo. StartDate: ${startDate.toDate()}, EndDate: ${endDate.toDate()}`);
      transaction.update(docRef, {
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        updatedAt: now,
        paymentConfirmedAt: now,
      });
      console.log(`onPaymentSuccess: Anuncio "${anuncioId}" marcado para activación en transacción.`);
    });

    console.log(`onPaymentSuccess: Transacción completada para anuncioId: ${anuncioId}. Enviando respuesta 200.`);
    // Las cabeceras CORS ya se establecieron al principio si el origen es permitido.
    res.status(200).send({
      message: `Anuncio "${anuncioId}" procesado y activado exitosamente (o ya estaba activo).`,
    });

  } catch (error: unknown) {
    const typedError = error as HttpError;
    const idFromBody = (req.body as PaymentSuccessRequestBody)?.anuncioId || 'desconocido';
    console.error(`Error en onPaymentSuccess para anuncioId "${idFromBody}":`, typedError.message, typedError.status ? `Status: ${typedError.status}` : '', error);
    
    // Las cabeceras CORS ya se establecieron al principio si el origen es permitido
    // No es necesario volver a setearlas aquí a menos que quieras una lógica de error específica para CORS.
    
    const statusCode = typedError.status || 500;
    const errorMessage = typedError.message || 'Ocurrió un error interno al procesar la solicitud.';
    res.status(statusCode).send({ error: errorMessage });
  }
});