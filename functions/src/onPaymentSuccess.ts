import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore'; // Importación explícita

// Inicializa la app de Firebase Admin si no está inicializada
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Define una interfaz para el cuerpo del request para mayor claridad y seguridad de tipos
interface PaymentSuccessRequestBody {
  anuncioId?: string; // anuncioId es opcional para poder validar su existencia
}

// Define un tipo para errores personalizados que pueden incluir un código de estado HTTP
interface HttpError extends Error {
  status?: number;
}

/**
 * Webhook para confirmar pago de anuncio.
 * - Espera recibir en el body: { anuncioId: string }
 * - Espera un header 'X-Webhook-Secret' para autenticación (temporalmente comentado para pruebas).
 * - Marca el anuncio como 'active' y calcula startDate/endDate.
 * - Es idempotente: si el anuncio ya está activo, no realiza cambios.
 */
export const onPaymentSuccess = functions.https.onRequest(async (req, res) => {
  // --- INICIO DE LA SECCIÓN AÑADIDA PARA CORS ---
  // Orígenes permitidos. Para desarrollo, incluye localhost.
  // ¡IMPORTANTE! En producción, reemplaza 'http://localhost:3000' o añade tu dominio de producción.
  const allowedOrigins = [
    'http://localhost:3000',
    // 'https://tu-dominio-de-produccion.com' // Ejemplo para producción
  ];
  const origin = req.headers.origin as string;

  if (allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  }

  // Manejar solicitudes preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS'); // Ajusta los métodos según necesites
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret'); // Permite las cabeceras que tu cliente envía
    res.set('Access-Control-Max-Age', '3600'); // Cachear la respuesta preflight por 1 hora
    res.status(204).send('');
    return;
  }
  // --- FIN DE LA SECCIÓN AÑADIDA PARA CORS ---

  // ────────────────────────────────────────────────────────────────────────────────
  // SECCIÓN DE VERIFICACIÓN DE SECRETO COMENTADA TEMPORALMENTE PARA PRUEBAS
  // (Esta sección se mantiene intacta, tal como la tenías)
  // ────────────────────────────────────────────────────────────────────────────────
  // TODO: Configura la variable de entorno 'WEBHOOK_SECRET' en Firebase
  //       (ej. `firebase functions:config:set payment.webhook_secret="TU_CLAVE_SECRETA_AQUI"`)
  //       y DESCOMENTA esta sección si una pasarela de pago real va a usar este webhook.

  /*
  const expectedSecret = functions.config().payment?.webhook_secret;
  const receivedSecret = req.headers['x-webhook-secret'];

  if (!expectedSecret) {
    console.error(
      'Error crítico: El secreto del webhook no está configurado en las variables de entorno.'
    );
    res.status(500).send('Error de configuración interna del servidor.');
    return;
  }

  if (receivedSecret !== expectedSecret) {
    console.warn('Intento de acceso no autorizado al webhook de pago.');
    res.status(403).send('Acceso no autorizado.'); // 403 Forbidden
    return;
  }
  */
  // ────────────────────────────────────────────────────────────────────────────────
  // FIN DE LA SECCIÓN COMENTADA
  // ────────────────────────────────────────────────────────────────────────────────

  // Solo procesar requests POST (común para webhooks que envían datos)
  // Esta verificación es ahora redundante si req.method === 'OPTIONS' ya hizo un return,
  // pero no hace daño dejarla por si acaso o para claridad.
  if (req.method !== 'POST') {
    res.status(405).send('Método no permitido. Usar POST.');
    return;
  }

  try {
    const { anuncioId } = req.body as PaymentSuccessRequestBody;

    // 2. Validación de `anuncioId`
    if (!anuncioId || typeof anuncioId !== 'string') {
      res.status(400).send('El campo "anuncioId" es requerido y debe ser un string.');
      return;
    }

    const db = admin.firestore();
    const docRef = db.collection('anuncios').doc(anuncioId);
    const now = Timestamp.now();

    // 3. Transacción de Firestore para leer-modificar-escribir atómicamente
    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (!snap.exists) {
        const notFoundError = new Error(
          `Anuncio con ID "${anuncioId}" no encontrado.`
        ) as HttpError;
        notFoundError.status = 404;
        throw notFoundError;
      }

      const data = snap.data();
      if (!data) {
        // Esto no debería ocurrir si snap.exists es true, pero es una guarda adicional.
        const dataError = new Error(
          `No se pudieron obtener los datos del anuncio "${anuncioId}".`
        ) as HttpError;
        dataError.status = 500;
        throw dataError;
      }

      // 4. Idempotencia: Verificar si el anuncio ya está activo
      if (data.status === 'active') {
        console.log(
          `El anuncio "${anuncioId}" ya se encuentra activo. No se requieren acciones.`
        );
        return;
      }

      // 5. Validación de `campaignDurationDays`
      const durationDays = data.campaignDurationDays;
      if (typeof durationDays !== 'number' || durationDays <= 0) {
        const durationError = new Error(
          `La duración de la campaña ("campaignDurationDays": ${durationDays}) para el anuncio "${anuncioId}" no es válida o falta.`
        ) as HttpError;
        durationError.status = 400; // Bad Request, ya que los datos del anuncio son incorrectos
        throw durationError;
      }

      // 6. Cálculo de fechas
      const startDate = now;
      const endDate = Timestamp.fromDate(
        new Date(now.toDate().getTime() + durationDays * 24 * 60 * 60 * 1000)
      );

      // 7. Actualizar el anuncio
      transaction.update(docRef, {
        status: 'active',
        startDate: startDate,
        endDate: endDate,
        updatedAt: now, // Actualizar la fecha de última modificación
        paymentConfirmedAt: now, // Opcional: un campo para registrar cuándo se confirmó el pago
      });
      console.log(`Anuncio "${anuncioId}" activado exitosamente.`);
    });

    // Las cabeceras CORS ya se establecieron al principio si el origen es permitido
    res.status(200).send({
      message: `Anuncio "${anuncioId}" procesado y activado exitosamente (o ya estaba activo).`,
    });

  } catch (error: unknown) {
    console.error(`Error en onPaymentSuccess para anuncioId "${(req.body as PaymentSuccessRequestBody)?.anuncioId || 'desconocido'}":`, error);
    // Las cabeceras CORS ya se establecieron al principio si el origen es permitido
    const typedError = error as HttpError;
    if (typedError.status) {
      res.status(typedError.status).send(typedError.message);
    } else {
      // Mensaje genérico para errores inesperados
      res.status(500).send('Ocurrió un error interno al procesar la solicitud.');
    }
  }
});