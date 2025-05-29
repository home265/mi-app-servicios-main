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
/*  Funciones de notificaciones (nuevo flujo)                                 */
/* -------------------------------------------------------------------------- */
export {
  sendJobRequest,
  sendJobAccept,
  sendContactRequest,
  sendAgreementConfirmed,
  sendRatingRequest,
  sendContactFollowupTask,
  contactPendingsOnCreate,
} from './notifications';

/* -------------------------------------------------------------------------- */
/*  Otras funciones de tu proyecto                                            */
/* -------------------------------------------------------------------------- */
export { onPaymentSuccess } from './onPaymentSuccess';
export { scheduledmanagepaginasamarillas } from './managePaginasAmarillas';
