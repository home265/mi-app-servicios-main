'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserProfile, Role as UserRole, ActingAs } from '@/store/userStore';
import {
  subscribeToNotifications,
  removeNotification,
  sendJobAccept,
  sendRatingRequest,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Recipient as NotificationRecipient,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ResenaForm from '@/app/components/resenas/ResenaForm';
import Logo from '@/app/components/ui/Logo'; //
import { DocumentData } from 'firebase/firestore';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';

// Interfaz para el usuario actual, asegurando los campos necesarios
interface ProviderUserProfile extends UserProfile {
  nombre: string;
  selfieURL?: string;
}

// Interfaz para el target de la reseña (el cliente/usuario)
interface ResenaTarget {
  uid: string;
  collection: string;
}

// Interfaz para el target del PerfilModal
interface PerfilTarget {
    uid: string;
    collection: string;
}

export default function TrabajosPage() {
  const currentUser = useUserStore((s) => s.currentUser) as ProviderUserProfile | null;
  const originalRole = useUserStore((s) => s.originalRole) as UserRole | null;
  const actingAs = useUserStore((s) => s.actingAs) as ActingAs;
  const setUnread = useUserStore((s) => s.setUnread);
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showResena, setShowResena] = useState<boolean>(false);
  const [resenaTarget, setResenaTarget] = useState<ResenaTarget | null>(null);
  const [resenaNotifId, setResenaNotifId] = useState<string | null>(null);

  const [showPerfilModal, setShowPerfilModal] = useState<boolean>(false);
  const [perfilModalTarget, setPerfilModalTarget] = useState<PerfilTarget | null>(null);


  useEffect(() => {
    if (currentUser && currentUser.uid && originalRole && actingAs === 'provider') {
      const userUid = currentUser.uid;
      const userColl =
        originalRole === 'prestador'
          ? 'prestadores'
          : originalRole === 'comercio'
          ? 'comercios'
          : 'usuarios_generales';

      const unsub = subscribeToNotifications(
        { uid: userUid, collection: userColl },
        (list) => {
          const filtered = list.filter((n) =>
            ['job_request', 'agreement_confirmed'].includes(n.type),
          );
          setNotifications(filtered);
          setUnread('jobRequests', filtered.filter(notif => !notif.read).length);
        },
      );
      return unsub;
    }
    return () => {};
  }, [currentUser, originalRole, actingAs, setUnread, setNotifications]);

  if (!currentUser || actingAs !== 'provider') {
    if (typeof window !== 'undefined') {
      router.replace('/bienvenida');
    }
    return null;
  }

  const {
    uid: providerUid,
    nombre: providerName, // Este es el nombre del prestador
    selfieURL: providerAvatar, // Este es el avatar del prestador
  } = currentUser;

  const providerCollection =
    originalRole === 'prestador'
      ? 'prestadores'
      : originalRole === 'comercio'
      ? 'comercios'
      : 'usuarios_generales';

  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) {
      return { uid: n.from.uid, collection: n.from.collection };
    }
    const fromId = (n as DocumentData).fromId || (n.payload as DocumentData)?.fromId;
    const fromCollection = (n as DocumentData).fromCollection || (n.payload as DocumentData)?.fromCollection;

    if (typeof fromId === 'string' && typeof fromCollection === 'string') {
      return { uid: fromId, collection: fromCollection };
    }
    console.warn('Could not determine sender from notification:', n);
    return null;
  }

  async function handleAccept(notif: Notification) {
    const client = getSender(notif);
    if (!client) {
      alert('No se pudo determinar el remitente de la solicitud.');
      return;
    }

    // --- CONSOLE LOGS PARA DEPURACIÓN ---
    console.log('[TRABAJOS_PAGE] handleAccept - Datos del Prestador (currentUser):', { providerName, providerAvatar });
    if (!providerName || providerName.trim() === ''){
      console.warn('[TRABAJOS_PAGE] handleAccept - ADVERTENCIA: providerName está vacío o no definido.');
    }
    if (!providerAvatar || providerAvatar.trim() === ''){
      console.warn('[TRABAJOS_PAGE] handleAccept - ADVERTENCIA: providerAvatar está vacío o no definido.');
    }
    // --- FIN CONSOLE LOGS ---

    const acceptPayload: NotificationPayload = {
      description: `${providerName || 'Un proveedor'} ha aceptado tu solicitud de trabajo.`,
      senderName: providerName || 'Proveedor de Servicios', // Nombre del prestador que envía
      providerAvatar: providerAvatar || '/avatar-placeholder.png', // Avatar del prestador que envía
      category: notif.payload?.category as string || '',
      subcategoria: notif.payload?.subcategoria as string || '',
      originalDescription: notif.payload?.description as string || '',
    };

    // --- CONSOLE LOG PARA DEPURACIÓN DEL PAYLOAD ---
    console.log('[TRABAJOS_PAGE] handleAccept - acceptPayload a enviar:', acceptPayload);
    // --- FIN CONSOLE LOG ---

    try {
      await sendJobAccept({
        to: [{ uid: client.uid, collection: client.collection }],
        from: { uid: providerUid, collection: providerCollection },
        payload: acceptPayload,
      });
      await removeNotification({ uid: providerUid, collection: providerCollection }, notif.id);
      alert('Solicitud aceptada. Se ha notificado al usuario.');
    } catch (error) {
      console.error('Error al aceptar el trabajo:', error);
      alert('Hubo un error al aceptar la solicitud.');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async function handleRatingRequest(notif: Notification) {
    const client = getSender(notif);
    if (!client) {
      alert('No se pudo determinar a quién solicitar la calificación.');
      return;
    }
    const ratingPayload: NotificationPayload = {
      description: `${providerName || 'Tu proveedor'} te solicita que califiques el servicio.`,
      senderName: providerName || 'Proveedor de Servicios', // El proveedor es el remitente de esta solicitud
      providerAvatar: providerAvatar || '/avatar-placeholder.png', // Avatar del proveedor
    };

    try {
      await sendRatingRequest({
        to: [{ uid: client.uid, collection: client.collection }],
        from: { uid: providerUid, collection: providerCollection },
        payload: ratingPayload,
      });
      await removeNotification({ uid: providerUid, collection: providerCollection }, notif.id);
      alert('Solicitud de calificación enviada al usuario.');
    } catch (error) {
      console.error('Error al solicitar calificación:', error);
      alert('Hubo un error al solicitar la calificación.');
    }
  }

  function openResenaFormForClient(notif: Notification) {
    const client = getSender(notif);
    if (!client) {
      alert('No se pudo determinar el cliente a calificar.');
      return;
    }
    setResenaTarget(client);
    setResenaNotifId(notif.id);
    setShowResena(true);
  }

  async function handleResenaSubmitted() {
    if (resenaNotifId && currentUser) {
      await removeNotification({ uid: providerUid, collection: providerCollection }, resenaNotifId);
    }
    setShowResena(false);
    setResenaTarget(null);
    setResenaNotifId(null);
    alert('Reseña enviada y notificación actualizada.');
  }

  async function handleDelete(notif: Notification) {
    if (!currentUser) return;
    try {
      await removeNotification({ uid: providerUid, collection: providerCollection }, notif.id);
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      alert('No se pudo eliminar la notificación.');
    }
  }

  function handleAvatarClick(notif: Notification) {
    const client = getSender(notif);
    if (client) {
        setPerfilModalTarget(client);
        setShowPerfilModal(true);
    }
  }

  return (
    // Aplicando bg-fondo y text-texto-principal para consistencia con el tema
    <div className="flex flex-col items-center p-4 min-h-screen bg-fondo text-texto-principal">
      <div className="mb-6 mt-2">
        <Logo />
      </div>
      {/* Usando text-texto-principal para el título */}
      <h1 className="mb-6 text-2xl font-bold text-texto-principal">Solicitudes y Acuerdos</h1>

      <div className="w-full max-w-lg space-y-4">
        {notifications.length === 0 && (
          // Usando text-texto-secundario para el mensaje
          <p className="text-center text-texto-secundario py-8">No tienes notificaciones.</p>
        )}
        {notifications.map((n) => (
          <NotificacionCard
            key={n.id}
            data={n}
            viewerMode="provider"
            onPrimary={() => {
              if (n.type === 'job_request') {
                handleAccept(n);
              } else if (n.type === 'agreement_confirmed') {
                openResenaFormForClient(n);
              }
            }}
            onSecondary={() => handleDelete(n)}
            onAvatarClick={() => handleAvatarClick(n)}
          />
        ))}
      </div>

      {showResena && resenaTarget && currentUser && (
        <ResenaForm
          target={resenaTarget}
          onSubmitted={handleResenaSubmitted}
        />
      )}

      {showPerfilModal && perfilModalTarget && (
        <PerfilModal
            target={perfilModalTarget}
            viewerMode="provider"
            onClose={() => setShowPerfilModal(false)}
        />
      )}
    </div>
  );
}