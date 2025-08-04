// src/hooks/useNotificationHandler.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useUserStore, UserProfile } from '@/store/userStore';
import {
  subscribeToNotifications,
  removeNotification,
  confirmAgreementAndCleanup,
  rescheduleFollowup,
  cancelAgreement,
  NotificationDoc as Notification,
  Sender as NotificationSender,
} from '@/lib/services/notificationsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// Tipos internos que el hook necesita
interface ClientUserProfile extends UserProfile {
  nombre: string;
}
interface PrestadorData {
  uid: string;
  collection: string;
  nombre: string;
  selfieUrl: string;
  telefono: string;
}
type PerfilModalTarget = { uid: string; collection: string };
type ProviderDocData = {
  nombre?: unknown;
  selfieURL?: unknown;
  selfieUrl?: unknown;
  telefono?: unknown;
};
type NotificationWithLegacyFrom = Notification & {
  fromId?: string;
  fromCollection?: string;
};

/**
 * Hook centralizado para manejar toda la lógica de notificaciones del lado del cliente.
 */
export default function useNotificationHandler() {
  // --- STORE Y ROUTER ---
  const currentUser = useUserStore((s) => s.currentUser as ClientUserProfile | null);
  const originalRole = useUserStore((s) => s.originalRole);
  const actingAs = useUserStore((s) => s.actingAs);
  const router = useRouter();

  // --- ESTADOS (Ahora centralizados aquí) ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);
  
  // Estados para los diferentes popups/modales
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorData | null>(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [perfilModalTarget, setPerfilModalTarget] = useState<PerfilModalTarget | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  // --- OBTENER DATOS DEL USUARIO ---
  const userUid = currentUser?.uid;
  const userName = currentUser?.nombre;
  const userCollection =
    originalRole === 'prestador' ? 'prestadores'
    : originalRole === 'comercio' ? 'comercios'
    : 'usuarios_generales';

  // --- SUSCRIPCIÓN A NOTIFICACIONES ---
  useEffect(() => {
    if (currentUser && originalRole && actingAs === 'user') {
      const unsub = subscribeToNotifications(
        { uid: currentUser.uid, collection: userCollection },
        (list) => {
          const filtered = list.filter((n) =>
            ['job_accept', 'contact_followup', 'rating_request'].includes(n.type)
          );
          setNotifications(filtered);
        }
      );
      return unsub;
    }
    return () => {};
  }, [currentUser, originalRole, actingAs, userCollection]);

  // --- HELPER INTERNO ---
  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) return n.from;
    const legacyNotif = n as NotificationWithLegacyFrom;
    const fromId = legacyNotif.fromId ?? (legacyNotif.payload as { fromId?: string }).fromId;
    const fromCollection = legacyNotif.fromCollection ?? (legacyNotif.payload as { fromCollection?: string }).fromCollection;
    if (typeof fromId === 'string' && typeof fromCollection === 'string') {
      return { uid: fromId, collection: fromCollection };
    }
    console.warn('Could not determine sender from notification:', n);
    return null;
  }

  // --- HANDLERS DE ACCIONES (Ahora centralizados aquí) ---
  async function handleContactar(notif: Notification) {
    // (Esta función es la misma que tenías en tus páginas)
    if (processingNotifId) return;
    setProcessingNotifId(notif.id);
    try {
      const provider = getSender(notif);
      if (!provider) throw new Error("No se pudo determinar el remitente.");
      const snap = await getDoc(doc(db, provider.collection, provider.uid));
      const data = snap.data() as ProviderDocData | undefined;
      if (!data) throw new Error("No se encontraron datos del proveedor.");
      setSelectedPrestador({
        uid: provider.uid, collection: provider.collection,
        nombre: typeof data.nombre === 'string' ? data.nombre : 'Prestador',
        selfieUrl: typeof data.selfieURL === 'string' ? data.selfieURL : typeof data.selfieUrl === 'string' ? data.selfieUrl : '/avatar-placeholder.png',
        telefono: typeof data.telefono === 'string' ? data.telefono : '',
      });
      setShowContacto(true);
    } catch (error) {
      console.error("Error al contactar:", error);
      toast.error("Hubo un error al obtener los datos de contacto.");
    } finally {
      setProcessingNotifId(null);
    }
  }

  async function handleConfirmarAcuerdo(notif: Notification) {
    if (processingNotifId || !userUid) return;
    setProcessingNotifId(notif.id);
    try {
      const provider = getSender(notif);
      if (!provider) throw new Error("No se pudo determinar el remitente.");
      const originalNotifId = notif.payload?.originalNotifId as string | undefined;
      if (!originalNotifId) {
        toast.error("Error: Falta un identificador clave.");
        return;
      }
      await confirmAgreementAndCleanup({
        user: { uid: userUid, collection: userCollection },
        provider,
        followupNotifId: notif.id,
        originalNotifId,
        userName: userName || 'Usuario',
      });
      toast.success('Acuerdo confirmado. ¡Gracias!');
    } catch (error) {
      console.error('Error al confirmar acuerdo:', error);
      toast.error('Hubo un error al confirmar el acuerdo.');
    } finally {
      setProcessingNotifId(null);
    }
  }

  function handleAbrirResena(notif: Notification) {
    if (processingNotifId) return;
    const provider = getSender(notif);
    if (provider) {
      router.push(`/calificar/${provider.uid}?notifId=${notif.id}`);
    }
  }

  async function handleReschedule(notif: Notification) {
    if (processingNotifId || !userUid) return;
    const provider = getSender(notif);
    if (!provider) return;
    setProcessingNotifId(notif.id);
    try {
      await rescheduleFollowup({
        user: { uid: userUid, collection: userCollection },
        provider,
        notificationId: notif.id,
      });
      toast.success("El seguimiento se ha pospuesto.");
    } catch (error) {
      console.error("Error al posponer:", error);
      toast.error("No se pudo posponer el seguimiento.");
    } finally {
      setProcessingNotifId(null);
    }
  }

  async function handleCancel(notif: Notification) {
    if (processingNotifId || !userUid) return;
    const provider = getSender(notif);
    if (!provider) return;
    const providerName = notif.payload?.providerName as string || 'el prestador';
    setProcessingNotifId(notif.id);
    try {
      await cancelAgreement({
        user: { uid: userUid, collection: userCollection },
        provider,
        notificationId: notif.id,
      });
      setTimeout(() => {
        setAlertMessage(`Proceso con ${providerName} cancelado. Si ya no necesitas sus datos, puedes eliminar la notificación original para mantener tu pantalla más limpia.`);
        setShowAlert(true);
      }, 0);
    } catch (error) {
      console.error("Error al cancelar:", error);
      toast.error("No se pudo cancelar el proceso.");
    } finally {
      setProcessingNotifId(null);
    }
  }

  async function handleDelete(notif: Notification) {
    if (processingNotifId || !userUid) return;
    setProcessingNotifId(notif.id);
    try {
      await removeNotification({ uid: userUid, collection: userCollection }, notif.id);
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar la notificación.');
    } finally {
      setProcessingNotifId(null);
    }
  }

  function handleAvatarClick(notif: Notification) {
    if (processingNotifId) return;
    const provider = getSender(notif);
    if (provider) {
      setPerfilModalTarget(provider);
      setShowPerfilModal(true);
    }
  }

  // --- LÓGICA GENÉRICA PARA LOS BOTONES DE NotificacionCard ---
  // Esto simplificará el JSX en las páginas
  const onPrimaryAction = (n: Notification) => {
    if (n.type === 'job_accept') handleContactar(n);
    else if (n.type === 'contact_followup') handleConfirmarAcuerdo(n);
    else if (n.type.startsWith('rating_request')) handleAbrirResena(n);
  };

  const onSecondaryAction = (n: Notification) => {
    if (n.type === 'contact_followup') handleReschedule(n);
    else handleDelete(n);
  };

  const onTertiaryAction = (n: Notification) => {
    if (n.type === 'contact_followup') handleCancel(n);
  };
  
  // --- VALORES Y FUNCIONES QUE EL HOOK EXPONE ---
  return {
    // Datos y estado
    notifications,
    processingNotifId,
    // Estado y datos para Popups
    showContacto,
    selectedPrestador,
    showPerfilModal,
    perfilModalTarget,
    showAlert,
    alertMessage,
    // Acciones genéricas para NotificacionCard
    onPrimaryAction,
    onSecondaryAction,
    onTertiaryAction,
    onAvatarClick: handleAvatarClick,
    // Funciones para cerrar los popups
    closeContactoPopup: () => setShowContacto(false),
    closePerfilModal: () => setShowPerfilModal(false),
    closeAlertPopup: () => setShowAlert(false),
    // Información del usuario (por si la página la necesita)
    currentUser,
    userUid,
    userCollection,
  };
}