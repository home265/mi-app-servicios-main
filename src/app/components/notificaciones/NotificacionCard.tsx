// NotificacionCard.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  CheckCircleIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/solid';
import {
  NotificationDoc as Notification,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import { Timestamp } from 'firebase/firestore';

// --- Helper: Componente Spinner (sin cambios) ---
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// --- Tipos Mejorados (sin cambios) ---
type CardNotificationPayload = NotificationPayload & {
  senderName?: string;
  avatarUrl?: string;
  providerAvatar?: string;
  senderAvatarUrl?: string;
  description?: string;
  timestamp?: Timestamp | number | string;
};

// --- Utilidades (sin cambios) ---
const fmtDate = (ts?: Timestamp | number | string | { seconds: number; nanoseconds: number }) => {
  if (!ts) return '';
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }
  if (typeof ts === 'object' && 'seconds' in ts && 'nanoseconds' in ts) {
    return new Timestamp(ts.seconds, ts.nanoseconds).toDate().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

const toTitleCase = (s: string) =>
  s.toLowerCase().split(' ').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


// --- Props del Componente (sin cambios)---
interface Props {
  data: Notification;
  viewerMode: 'user' | 'provider';
  isProcessing?: boolean;
  onPrimary: () => void | Promise<void>;
  onSecondary?: () => void | Promise<void>;
  onAvatarClick?: () => void;
}

// --- Componente Principal ---
export default function NotificacionCard({
  data,
  viewerMode,
  isProcessing = false,
  onPrimary,
  onSecondary,
  onAvatarClick,
}: Props) {
  const { payload, type } = data;
  const typedPayload = payload as CardNotificationPayload;

  const senderName = toTitleCase(typedPayload.senderName ?? 'Usuario');
  const avatar =
    typedPayload.avatarUrl ||
    typedPayload.providerAvatar ||
    typedPayload.senderAvatarUrl ||
    '/logo1.png';

  const full = typedPayload.description ?? '';
  const needsTrunc = full.length > 100;
  const preview = needsTrunc ? full.slice(0, 100) : full;
  const [expanded, setExpanded] = useState(false);

  const buttonConfig = {
    job_request: { p: viewerMode === 'provider' ? 'Aceptar' : undefined, s: 'Eliminar' },
    job_accept: { p: viewerMode === 'user' ? 'Contactar' : undefined, s: 'Eliminar' },
    contact_followup: { p: viewerMode === 'user' ? 'Sí, acordamos' : undefined, s: viewerMode === 'user' ? 'No, aún no' : 'Eliminar' },
    agreement_confirmed: { p: viewerMode === 'provider' ? 'Calificar usuario' : undefined, s: undefined },
    rating_request: { p: viewerMode === 'user' ? 'Calificar prestador' : undefined, s: 'Eliminar' },
  } as const;

  const { p: primary, s: secondary } = buttonConfig[type as keyof typeof buttonConfig] ?? { p: undefined, s: undefined };
  const hasSecondaryAction = !!(secondary && onSecondary);
  const dateStr = fmtDate(data.timestamp ?? typedPayload.timestamp);

 return (
    <article
      className="relative flex gap-4 rounded-2xl p-4 w-full max-w-[380px] bg-tarjeta
                 shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]"
    >
      {dateStr && (
        <span className="absolute top-[10px] right-3 text-[10px] text-texto-secundario opacity-90">
          {dateStr}
        </span>
      )}

      {/* --- Avatar Interactivo --- */}
      <div className="relative h-12 w-12 shrink-0">
        {onAvatarClick ? (
          <button
            onClick={onAvatarClick}
            disabled={isProcessing}
            className="relative w-full h-full rounded-xl bg-tarjeta transition-all duration-150 ease-in-out
                       shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]
                       hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]
                       active:scale-95 active:brightness-90
                       active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-tarjeta focus:ring-primario"
          >
            <div className="relative w-full h-full rounded-full overflow-hidden">
              <Image
                src={avatar}
                alt="Avatar del remitente"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          </button>
        ) : (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image src={avatar} alt="Avatar del remitente" fill sizes="48px" className="object-cover" />
          </div>
        )}
      </div>

      {/* Texto y Acciones (sin cambios en la lógica) */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-none mb-[2px] text-texto-principal">
          {senderName}
        </p>

        <span className="text-[13px] text-texto-secundario">
          {expanded || !needsTrunc ? full : preview}
          {needsTrunc && (
            <>
              {!expanded && '… '}
              <button
                onClick={() => setExpanded(!expanded)}
                disabled={isProcessing}
                className="inline-flex items-center gap-[1px] text-[11px] font-medium ml-[2px] text-texto-principal hover:text-primario transition"
              >
                {expanded ? (
                  <>ver menos <ChevronUpIcon className="w-3 h-3" /></>
                ) : (
                  <>ver más <ChevronDownIcon className="w-3 h-3" /></>
                )}
              </button>
            </>
          )}
        </span>

        {(primary || hasSecondaryAction) && (
          <div className={`mt-3 grid gap-2 ${primary && hasSecondaryAction ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {primary && (
              <button
                onClick={onPrimary}
                disabled={isProcessing}
                className="btn-primary text-[13px] py-[6px]"
              >
                {isProcessing ? <Spinner /> : <CheckCircleIcon className="w-4 h-4" />}
                {isProcessing ? 'Procesando...' : primary}
              </button>
            )}
            {hasSecondaryAction && (
              <button
                onClick={onSecondary}
                disabled={isProcessing}
                className="btn-destructive text-[13px] py-[6px]"
              >
                <TrashIcon className="w-4 h-4" />
                {secondary}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );

}