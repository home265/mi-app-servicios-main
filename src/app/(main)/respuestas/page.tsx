'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useUserStore,
  UserProfile,
  Role as UserRole,
  ActingAs,
} from '@/store/userStore';
import {
  subscribeToNotifications,
  removeNotification,
  sendAgreementConfirmed,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import {
  doc,
  getDoc,
  deleteDoc,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import ResenaForm from '@/app/components/resenas/ResenaForm';
import Logo from '@/app/components/ui/Logo';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';

/* ------------------------ tipos internos ------------------- */
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
interface ResenaTarget {
  uid: string;
  collection: string;
}
interface PerfilModalTarget {
  uid: string;
  collection: string;
}

export default function RespuestasPage() {
  /* --------- store & router ---------- */
  const currentUser = useUserStore(
    (s) => s.currentUser,
  ) as ClientUserProfile | null;
  const originalRole = useUserStore((s) => s.originalRole) as UserRole | null;
  const actingAs = useUserStore((s) => s.actingAs) as ActingAs;
  const router = useRouter();

  /* ------------ state --------------- */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] =
    useState<PrestadorData | null>(null);
  const [showResena, setShowResena] = useState(false);
  const [resenaTarget, setResenaTarget] = useState<ResenaTarget | null>(null);
  const [resenaNotifId, setResenaNotifId] = useState<string | null>(null);
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [perfilModalTarget, setPerfilModalTarget] =
    useState<PerfilModalTarget | null>(null);

 /* ----------- suscripción ----------- */
  useEffect(() => {
    if (currentUser && originalRole && actingAs === 'user') {
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
            ['job_accept', 'contact_followup', 'rating_request'].includes(
              n.type,
            ),
          );
          setNotifications(filtered);
        },
      );
      return unsub;
    }
    return () => {};
  }, [currentUser, originalRole, actingAs]); // <-- Se eliminó setUnread de aquí

  /* ----------- guardas --------------- */
  if (!currentUser || actingAs !== 'user') {
    if (typeof window !== 'undefined') {
      router.replace('/bienvenida');
    }
    return null;
  }

  const { uid: userUid, nombre: userName } = currentUser;
  const userCollection =
    originalRole === 'prestador'
      ? 'prestadores'
      : originalRole === 'comercio'
      ? 'comercios'
      : 'usuarios_generales';

  /** Determina remitente de una notificación */
  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) {
      return { uid: n.from.uid, collection: n.from.collection };
    }
    const fromId =
      (n as DocumentData).fromId ||
      (n.payload as DocumentData)?.fromId;
    const fromCollection =
      (n as DocumentData).fromCollection ||
      (n.payload as DocumentData)?.fromCollection;

    if (typeof fromId === 'string' && typeof fromCollection === 'string') {
      return { uid: fromId, collection: fromCollection };
    }
    console.warn('Could not determine sender from notification:', n);
    return null;
  }

  /* ------------- acciones ------------- */
  async function handleContactar(notif: Notification) {
    const provider = getSender(notif);
    if (!provider) return;

    const snap = await getDoc(doc(db, provider.collection, provider.uid));
    const data = snap.data();
    if (!data) return;

    setSelectedPrestador({
      uid: provider.uid,
      collection: provider.collection,
      nombre: typeof data.nombre === 'string' ? data.nombre : 'Prestador',
      selfieUrl:
        typeof data.selfieURL === 'string'
          ? data.selfieURL
          : typeof data.selfieUrl === 'string'
          ? data.selfieUrl
          : '/avatar-placeholder.png',
      telefono: typeof data.telefono === 'string' ? data.telefono : '',
    });
    setShowContacto(true);
  }

  async function handleConfirmarAcuerdo(notif: Notification) {
    const provider = getSender(notif);
    if (!provider) return;

    const selfieCandidate = currentUser?.selfieURL || currentUser?.selfieUrl;
    const userAvatar =
      typeof selfieCandidate === 'string' && selfieCandidate
        ? selfieCandidate
        : '/avatar-placeholder.png';

    const agreementPayload: NotificationPayload = {
      description: `${userName || 'Un usuario'} ha confirmado que llegaron a un acuerdo.`,
      senderName: userName || 'Usuario',
      avatarUrl: userAvatar,
    };

    try {
      await sendAgreementConfirmed({
        to: [{ uid: provider.uid, collection: provider.collection }],
        from: { uid: userUid, collection: userCollection },
        payload: agreementPayload,
      });

      await deleteDoc(
        doc(
          db,
          'usuarios_generales',
          userUid,
          'contactPendings',
          provider.uid,
        ),
      );

      await removeNotification(
        { uid: userUid, collection: userCollection },
        notif.id,
      );

      alert('Acuerdo confirmado. Se ha notificado al proveedor.');
    } catch (error) {
      console.error('Error al confirmar acuerdo:', error);
      alert('Hubo un error al confirmar el acuerdo.');
    }
  }

  function handleAbrirResena(notif: Notification) {
    const provider = getSender(notif);
    if (!provider) return;

    setResenaTarget(provider);
    setResenaNotifId(notif.id);
    setShowResena(true);
  }

  async function handleResenaSubmitted() {
    if (resenaNotifId) {
      await removeNotification(
        { uid: userUid, collection: userCollection },
        resenaNotifId,
      );
    }
    setShowResena(false);
    setResenaTarget(null);
    setResenaNotifId(null);
    alert('Reseña enviada.');
  }

  async function handleDelete(notif: Notification) {
    try {
      await removeNotification(
        { uid: userUid, collection: userCollection },
        notif.id,
      );
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }

  function handleAvatarClick(notif: Notification) {
    const provider = getSender(notif);
    if (provider) {
      setPerfilModalTarget(provider);
      setShowPerfilModal(true);
    }
  }

  /* --------------- UI ---------------- */
  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-gray-50">
      <div className="mb-6 mt-2">
        <Logo />
      </div>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">
        Mis Respuestas y Notificaciones
      </h1>

      <div className="w-full max-w-lg space-y-4">
        {notifications.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            No tienes respuestas o notificaciones nuevas.
          </p>
        )}

        {notifications.map((n) => (
          <NotificacionCard
            key={n.id}
            data={n}
            viewerMode="user"
            onPrimary={() => {
  if (n.type === 'job_accept') {
    handleContactar(n);
  } else if (n.type === 'contact_followup') {
    handleConfirmarAcuerdo(n);
  } else if (n.type.startsWith('rating_request')) {
    // admite "rating_request", "rating_request_provider", etc.
    handleAbrirResena(n);
  }
}}
            onSecondary={() => handleDelete(n)}
            onAvatarClick={() => handleAvatarClick(n)}
          />
        ))}
      </div>

      {showContacto && selectedPrestador && (
        <ContactoPopup
          userUid={userUid}
          userCollection={userCollection}
          providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection}
          providerName={selectedPrestador.nombre}
          notifId={
            notifications.find(
              (n) =>
                n.type === 'job_accept' &&
                getSender(n)?.uid === selectedPrestador.uid,
            )?.id ?? ''
          }
          onClose={() => setShowContacto(false)} 
        />
      )}

      {showResena && resenaTarget && (
        <ResenaForm
          target={resenaTarget}
          onSubmitted={handleResenaSubmitted}
        />
      )}

      {showPerfilModal && perfilModalTarget && (
        <PerfilModal
          target={perfilModalTarget}
          viewerMode="user"
          onClose={() => setShowPerfilModal(false)}
        />
      )}
    </div>
  );
}
