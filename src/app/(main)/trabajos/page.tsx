'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast';

import {
  useUserStore,
  UserProfile,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Role as UserRole,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ActingAs,
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

/*────────── paleta & assets ──────────*/
const palette = {
  dark: {
    fondo: '#0F2623',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#F9F3D9',
    resalte: '#EFC71D',
    marca: '/logo3.png',
  },
  light: {
    fondo: '#F9F3D9',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#0F2623',
    resalte: '#EFC71D',
    marca: '/logo2.png',
  },
}

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

  const { resolvedTheme } = useTheme()
  const P = resolvedTheme === 'dark' ? palette.dark : palette.light

  /*────────── estado local ──────────*/
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [perfilModalTarget, setPerfilModalTarget] =
    useState<PerfilTarget | null>(null)
  
  // NUEVO: Estado para gestionar la notificación en procesamiento
  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);

  /*────────── loader inicial ──────────*/
  if (!currentUser) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ backgroundColor: P.fondo, color: P.resalte }}
      >
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
    
    // Acceso seguro a propiedades que podrían no existir
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
    // El rol original no debería cambiar, pero lo incluimos por consistencia
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

  /*────────── handlers (modificados para gestionar estado) ──────────*/
  async function handleAccept(n: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(n.id);

    try {
      const cli = getSender(n);
      if (!cli) {
        throw new Error("No se pudo determinar el cliente para aceptar la solicitud.");
      }

      // El payload se construye con seguridad de tipos
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

      // Idealmente, esta eliminación debería ser parte de una transacción en el backend.
      // Se mantiene aquí para no alterar la lógica existente.
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
      // Redirige a la nueva página pasándole el UID del usuario a calificar
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

  /*────────── UI (modificada para pasar estado) ──────────*/
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: P.fondo, color: P.texto }}
    >
      {/* 1. Contenedor que limita y centra el contenido principal */}
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">

        {/*────────── header ──────────*/}
        {/* El header ahora está DENTRO del contenedor y se le quita el padding propio */}
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

        {/* La línea ahora respeta el ancho del contenedor padre */}
        <hr style={{ borderColor: P.borde }} />

        {/*────────── contenido ──────────*/}
        {/* El main también está DENTRO del contenedor y se simplifica */}
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
      {/* Este botón tiene `position: fixed`, por lo que DEBE estar FUERA del contenedor centrado */}
      <button
        onClick={() => router.push('/bienvenida')}
        aria-label="Volver a inicio"
        className="fixed bottom-6 right-4 md:bottom-8 md:left-6 z-40 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring"
        style={{ backgroundColor: P.tarjeta }}
      >
        <ChevronLeftIcon className="h-6 w-6" style={{ color: P.resalte }} />
      </button>
    </div>
  )
}