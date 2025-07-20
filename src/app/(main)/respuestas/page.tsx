'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import {
  useUserStore,
  UserProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Role as UserRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ActingAs,
} from '@/store/userStore';
import {
  subscribeToNotifications,
  removeNotification,
  confirmAgreementAndCleanup,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import {
  doc,
  getDoc,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';

import Logo from '@/app/components/ui/Logo';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';

/* ------------------------ tipos internos mejorados ------------------- */
interface ClientUserProfile extends UserProfile {
  nombre: string;
  selfieURL?: string;
  selfieUrl?: string;
}
interface PrestadorData {
  uid: string;
  collection: string;
  nombre: string;
  selfieUrl: string;
  telefono: string;
}

interface PerfilModalTarget {
  uid: string;
  collection: string;
}

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


export default function RespuestasPage() {
  /* --------- store & router ---------- */
  const currentUser = useUserStore(
    (s) => s.currentUser as ClientUserProfile | null,
  );
  const originalRole = useUserStore((s) => s.originalRole);
  const actingAs = useUserStore((s) => s.actingAs);
  const router = useRouter();

  /* ------------ state --------------- */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorData | null>(null);
  
  const [showPerfilModal, setShowPerfilModal] = useState(false);
  const [perfilModalTarget, setPerfilModalTarget] = useState<PerfilModalTarget | null>(null);

  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);

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
  }, [currentUser, originalRole, actingAs]);

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

  /** Determina remitente de una notificación (con seguridad de tipos) */
  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) {
      return n.from;
    }

    const legacyNotif = n as NotificationWithLegacyFrom;
    const fromId = legacyNotif.fromId ?? (legacyNotif.payload as { fromId?: string }).fromId;
    const fromCollection = legacyNotif.fromCollection ?? (legacyNotif.payload as { fromCollection?: string }).fromCollection;

    if (typeof fromId === 'string' && typeof fromCollection === 'string') {
      return { uid: fromId, collection: fromCollection };
    }

    console.warn('Could not determine sender from notification:', n);
    return null;
  }

  /* ------------- acciones (modificadas para usar toast) ------------- */
  async function handleContactar(notif: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(notif.id);

    try {
      const provider = getSender(notif);
      if (!provider) {
        throw new Error("No se pudo determinar el remitente.");
      }

      const snap = await getDoc(doc(db, provider.collection, provider.uid));
      const data = snap.data() as ProviderDocData | undefined;
      if (!data) {
        throw new Error("No se encontraron datos del proveedor.");
      }

      setSelectedPrestador({
        uid: provider.uid,
        collection: provider.collection,
        nombre: typeof data.nombre === 'string' ? data.nombre : 'Prestador',
        selfieUrl:
          typeof data.selfieURL === 'string' ? data.selfieURL
          : typeof data.selfieUrl === 'string' ? data.selfieUrl
          : '/avatar-placeholder.png',
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
    if (processingNotifId) return;
    setProcessingNotifId(notif.id);

    try {
      const provider = getSender(notif);
      if (!provider) {
        throw new Error("No se pudo determinar el remitente para confirmar el acuerdo.");
      }

      const originalNotifId = notif.payload?.originalNotifId as string | undefined;
      if (!originalNotifId) {
        console.error("Error crítico: No se encontró la 'originalNotifId' en el payload de la notificación de seguimiento.");
        toast.error("Error: No se pudo procesar la solicitud por falta de un identificador clave.");
        setProcessingNotifId(null);
        return;
      }

      await confirmAgreementAndCleanup({
        user: { uid: userUid, collection: userCollection },
        provider: { uid: provider.uid, collection: provider.collection },
        followupNotifId: notif.id,
        originalNotifId: originalNotifId,
        userName: userName || 'Usuario',
      });

      toast.success('Acuerdo confirmado. ¡Gracias por usar nuestros servicios!');

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

  async function handleDelete(notif: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(notif.id);

    try {
      await removeNotification(
        { uid: userUid, collection: userCollection },
        notif.id,
      );
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      toast.error('Error al eliminar notificación.');
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

  /* --------------- UI (Sin cambios) ---------------- */
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
            isProcessing={processingNotifId === n.id}
            onPrimary={() => {
              if (n.type === 'job_accept') {
                handleContactar(n);
              } else if (n.type === 'contact_followup') {
                handleConfirmarAcuerdo(n);
              } else if (n.type.startsWith('rating_request')) {
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