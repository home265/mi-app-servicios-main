'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast';
import BotonVolver from '@/app/components/common/BotonVolver';
import {
  useUserStore,
  UserProfile,
} from '@/store/userStore'
import {
  subscribeToNotifications,
  removeNotification,
  sendJobAccept,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService'

import NotificacionCard from '@/app/components/notificaciones/NotificacionCard'
import PerfilModal from '@/app/components/notificaciones/PerfilModal'
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaTrabajos from '@/app/components/ayuda-contenido/AyudaTrabajos';

/*────────── Tipos mejorados ──────────*/
interface ProviderUserProfile extends UserProfile {
  nombre: string
  selfieURL?: string
}
interface PerfilTarget {
  uid: string
  collection: string
}
// Tipo para una notificación con campos de 'from' potencialmente en el nivel raíz
type NotificationWithLegacyFrom = Notification & {
  fromId?: string;
  fromCollection?: string;
};


export default function TrabajosPage() {
  /*────────── stores & router ──────────*/
  const currentUser = useUserStore(
    (s) => s.currentUser as ProviderUserProfile | null
  )
  const originalRole = useUserStore((s) => s.originalRole)
  const actingAs = useUserStore((s) => s.actingAs)
  const router = useRouter()

  /*────────── estado local ──────────*/
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [perfilModalTarget, setPerfilModalTarget] =
    useState<PerfilTarget | null>(null)
  
  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);

  /*────────── loader inicial ──────────*/
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-fondo text-primario">
        <span className="animate-pulse">Cargando…</span>
      </div>
    )
  }

  /*────────── redirección segura ──────────*/
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (currentUser && actingAs !== 'provider') {
      router.replace('/bienvenida')
    }
  }, [currentUser, actingAs, router])

  if (actingAs !== 'provider') return null

  /*────────── datos prestador ──────────*/
  const {
    uid: providerUid,
    nombre: providerName,
    selfieURL: providerAvatar,
  } = currentUser
  const providerCollection =
    originalRole === 'prestador'
      ? 'prestadores'
      : originalRole === 'comercio'
      ? 'comercios'
      : 'usuarios_generales'

  /*────────── helpers ──────────*/
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
    return null
  }

   /*────────── suscripción a notificaciones ──────────*/
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!providerUid || !originalRole) return;

    const coll =
      originalRole === 'prestador'
        ? 'prestadores'
        : originalRole === 'comercio'
        ? 'comercios'
        : 'usuarios_generales'

    const unsub = subscribeToNotifications(
      { uid: providerUid, collection: coll },
      (list) => {
        const flt = list.filter((n) =>
          ['job_request', 'agreement_confirmed'].includes(n.type)
        )
        setNotifications(flt)
      }
    )
    return unsub;
  }, [providerUid, originalRole])

  /*────────── handlers ──────────*/
  async function handleAccept(n: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(n.id);

    try {
      const cli = getSender(n);
      if (!cli) {
        throw new Error("No se pudo determinar el cliente para aceptar la solicitud.");
      }

      const payload: NotificationPayload = {
        description: `${providerName || 'Un proveedor'} ha aceptado tu solicitud de trabajo.`,
        senderName: providerName || 'Proveedor',
        providerAvatar: providerAvatar || '/avatar-placeholder.png',
        category: n.payload?.category || '',
        subcategoria: n.payload?.subcategoria || '',
        originalDescription: n.payload?.description || '',
      };
      
      await sendJobAccept({
        to: [cli],
        from: { uid: providerUid, collection: providerCollection },
        payload,
      });

      await removeNotification(
        { uid: providerUid, collection: providerCollection },
        n.id
      );
    } catch (error) {
        console.error("Error al aceptar la solicitud:", error);
        toast.error("Hubo un error al aceptar la solicitud.");
    } finally {
        setProcessingNotifId(null);
    }
  }

  async function handleDelete(n: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(n.id);
    
    try {
      await removeNotification(
        { uid: providerUid, collection: providerCollection },
        n.id
      );
    } catch (error) {
      console.error("Error al eliminar la notificación:", error);
      toast.error("Hubo un error al eliminar la notificación.");
    } finally {
      setProcessingNotifId(null);
    }
  }

  function openResenaFormForClient(n: Notification) {
    if (processingNotifId) return;
    
    const cli = getSender(n)
    if (cli) {
      router.push(`/calificar/${cli.uid}?notifId=${n.id}`);
    }
  }

  function handleAvatarClick(n: Notification) {
    if (processingNotifId) return;

    const cli = getSender(n)
    if (cli) {
      setPerfilModalTarget(cli)
      setShowPerfilModal(true)
    }
  }

  /*────────── UI ──────────*/
  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">

        {/*────────── header ──────────*/}
        <header className="relative flex items-center justify-center py-8">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <BotonAyuda>
              <AyudaTrabajos />
            </BotonAyuda>
          </div>
          <h1 className="text-lg md:text-xl font-medium tracking-wide">
            Solicitudes y acuerdos
          </h1>
        </header>

        <hr className="border-borde-tarjeta" />

        {/*────────── contenido ──────────*/}
        <main className="flex flex-col items-center flex-grow pt-6 pb-8">
          <div className="w-full max-w-lg space-y-4">
            {notifications.length === 0 && (
              <p className="text-center text-sm opacity-70 py-8">
                No tienes notificaciones.
              </p>
            )}

            {notifications.map((n) => (
              <NotificacionCard
                key={n.id}
                data={n}
                viewerMode="provider"
                isProcessing={processingNotifId === n.id}
                onPrimary={() =>
                  n.type === 'job_request'
                    ? handleAccept(n)
                    : openResenaFormForClient(n)
                }
                onSecondary={() => handleDelete(n)}
                onAvatarClick={() => handleAvatarClick(n)}
              />
            ))}
          </div>

          {showPerfilModal && perfilModalTarget && (
            <PerfilModal
              target={perfilModalTarget}
              viewerMode="provider"
              onClose={() => setShowPerfilModal(false)}
            />
          )}
        </main>
      </div>

      {/*────────── FAB volver ──────────*/}
<BotonVolver />
    </div>
  )
}