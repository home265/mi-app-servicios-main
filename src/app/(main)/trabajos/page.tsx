/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  ChevronLeftIcon,
} from '@heroicons/react/24/outline'

import {
  useUserStore,
  UserProfile,
  Role as UserRole,
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
import ResenaForm from '@/app/components/resenas/ResenaForm'
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
    marca: '/MARCA_CODYS_14.png',
  },
  light: {
    fondo: '#F9F3D9',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#0F2623',
    resalte: '#EFC71D',
    marca: '/MARCA_CODYS_13.png',
  },
}

interface ProviderUserProfile extends UserProfile {
  nombre: string
  selfieURL?: string
}
interface ResenaTarget {
  uid: string
  collection: string
}
interface PerfilTarget {
  uid: string
  collection: string
}

export default function TrabajosPage() {
  /*────────── stores & router ──────────*/
  const currentUser = useUserStore(
    (s) => s.currentUser
  ) as ProviderUserProfile | null
  const originalRole = useUserStore((s) => s.originalRole) as UserRole | null
  const actingAs = useUserStore((s) => s.actingAs) as ActingAs
  const setUnread = useUserStore((s) => s.setUnread)
  const router = useRouter()

  const { resolvedTheme } = useTheme()
  const P = resolvedTheme === 'dark' ? palette.dark : palette.light

  /*────────── estado local ──────────*/
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showResena, setShowResena] = useState(false)
  const [resenaTarget, setResenaTarget] = useState<ResenaTarget | null>(null)
  const [resenaNotifId, setResenaNotifId] = useState<string | null>(null)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [perfilModalTarget, setPerfilModalTarget] =
    useState<PerfilTarget | null>(null)

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
    if (n.from?.uid) return n.from
    const id = (n as any).fromId
    const col = (n as any).fromCollection
    return typeof id === 'string' && typeof col === 'string'
      ? { uid: id, collection: col }
      : null
  }

  /*────────── suscripción a notificaciones ──────────*/
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const coll =
      originalRole === 'prestador'
        ? 'prestadores'
        : originalRole === 'comercio'
        ? 'comercios'
        : 'usuarios_generales'

    return subscribeToNotifications(
      { uid: providerUid, collection: coll },
      (list) => {
        const flt = list.filter((n) =>
          ['job_request', 'agreement_confirmed'].includes(n.type)
        )
        setNotifications(flt)
        setUnread(
          'jobRequests',
          flt.filter((x) => !x.read).length
        )
      }
    )
  }, [providerUid, originalRole, setUnread])

  /*────────── handlers ──────────*/
  async function handleAccept(n: Notification) {
    const cli = getSender(n)
    if (!cli) return
    const payload: NotificationPayload = {
      description: `${
        providerName || 'Un proveedor'
      } ha aceptado tu solicitud de trabajo.`,
      senderName: providerName || 'Proveedor',
      providerAvatar: providerAvatar || '/avatar-placeholder.png',
      category: n.payload?.category || '',
      subcategoria: n.payload?.subcategoria || '',
      originalDescription: n.payload?.description || '',
    }
    await sendJobAccept({
      to: [cli],
      from: { uid: providerUid, collection: providerCollection },
      payload,
    })
    await removeNotification(
      { uid: providerUid, collection: providerCollection },
      n.id
    )
  }
  async function handleDelete(n: Notification) {
    await removeNotification(
      { uid: providerUid, collection: providerCollection },
      n.id
    )
  }
  function openResenaFormForClient(n: Notification) {
    const cli = getSender(n)
    if (!cli) return
    setResenaTarget(cli)
    setResenaNotifId(n.id)
    setShowResena(true)
  }
  async function handleResenaSubmitted() {
    if (resenaNotifId) {
      await removeNotification(
        { uid: providerUid, collection: providerCollection },
        resenaNotifId
      )
    }
    setShowResena(false)
    setResenaTarget(null)
    setResenaNotifId(null)
  }
  function handleAvatarClick(n: Notification) {
    const cli = getSender(n)
    if (cli) {
      setPerfilModalTarget(cli)
      setShowPerfilModal(true)
    }
  }

  /*────────── UI ──────────*/
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: P.fondo, color: P.texto }}
    >
      {/*────────── header ──────────*/}
      <header className="relative flex items-center justify-center px-5 py-8">
  {/* Contenedor para posicionar el botón de ayuda a la izquierda */}
  <div className="absolute left-5 top-1/2 -translate-y-1/2">
    <BotonAyuda>
      <AyudaTrabajos />
    </BotonAyuda>
  </div>

  {/* Título centrado */}
  <h1 className="text-lg md:text-xl font-medium tracking-wide">
    Solicitudes y acuerdos
  </h1>
</header>

      <hr className="mx-5" style={{ borderColor: P.borde }} />

      {/*────────── contenido ──────────*/}
      <main className="flex flex-col items-center flex-grow pt-6 pb-8 px-4">
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

        {showResena && resenaTarget && (
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
      </main>

      {/*────────── FAB volver ──────────*/}
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
