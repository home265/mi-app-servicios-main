/**
 * Punto de entrada principal para Cloud Functions.
 * Reexportamos cada función desde su módulo correspondiente.
 */
import 'dotenv/config';
import * as admin from 'firebase-admin';

// Inicializa el SDK solo una vez.
if (!admin.apps.length) {
  admin.initializeApp();
}

/* -------------------------------------------------------------------------- */
/* Funciones de notificaciones (se mantienen sin cambios)                     */
/* -------------------------------------------------------------------------- */
export {
  confirmAgreementAndCleanup,
  rescheduleFollowup,
  cancelAgreement,
  sendJobRequest,
  sendJobAccept,
  sendAgreementConfirmed,
  sendRatingRequest,
  sendContactFollowupTask,
  contactPendingsOnCreate,
} from './notifications';

/* -------------------------------------------------------------------------- */
/* Funciones de Páginas Amarillas y Pagos                                     */
/* -------------------------------------------------------------------------- */

// Exporta la función que se activa al confirmar un pago.
export { onSubscriptionPayment } from './onSubscriptionPayment';

// Exporta la función programada que desactiva suscripciones expiradas.
export { expireSubscriptions } from './expireAnuncios';