/* NotificacionCard.tsx — Implementa estado de procesamiento y mejora de tipos (v2) */
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
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

// --- Helper: Componente Spinner ---
// Un spinner simple para mostrar durante el procesamiento.
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

// --- Tipos Mejorados ---
// Un tipo más específico para el payload para evitar el uso de `any` o `DocumentData`.
// Extiende el tipo base y añade los campos opcionales que usas.
type CardNotificationPayload = NotificationPayload & {
  senderName?: string;
  avatarUrl?: string;
  providerAvatar?: string;
  senderAvatarUrl?: string;
  description?: string;
  timestamp?: Timestamp | number | string;
};

// --- Utilidades ---
// CORREGIDO: Se reestructura la lógica para evitar el error de `instanceof`.
const fmtDate = (ts?: Timestamp | number | string | { seconds: number; nanoseconds: number }) => {
  if (!ts) return '';

  // 1. Maneja el caso de una instancia real de Timestamp.
  if (ts instanceof Timestamp) {
    return ts.toDate().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }
  
  // 2. Maneja el caso de un objeto de Timestamp serializado desde Firestore.
  if (typeof ts === 'object' && 'seconds' in ts && 'nanoseconds' in ts) {
    return new Timestamp(ts.seconds, ts.nanoseconds).toDate().toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
  }

  // 3. Maneja los casos restantes (string, number), que son válidos para `new Date()`.
  return new Date(ts).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
};

const toTitleCase = (s: string) =>
  s.toLowerCase().split(' ').filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');


// --- Props del Componente ---
interface Props {
  data: Notification;
  viewerMode: 'user' | 'provider';
  isProcessing?: boolean; // NUEVO: para controlar el estado de carga
  onPrimary: () => void | Promise<void>;
  onSecondary?: () => void | Promise<void>;
  onAvatarClick?: () => void;
}

// --- Componente Principal ---
export default function NotificacionCard({
  data,
  viewerMode,
  isProcessing = false, // Valor por defecto
  onPrimary,
  onSecondary,
  onAvatarClick,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isDark = useTheme().resolvedTheme === 'dark';

  const C = useMemo(() => ({
    cardBg: '#184840',
    cardBrd: '#2F5854',
    txt: '#F9F3D9',
    subTxt: '#F9F3D9',
    accBg: 'transparent',
    accTxt: '#F9F3D9',
    accBrd: '#F9F3D9',
    delBg: '#DC2626',
    delTxt: '#F9F3D9',
  }), []);

  const { payload, type } = data;
  const typedPayload = payload as CardNotificationPayload; // Usamos el tipo específico

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

  // El campo `timestamp` ahora puede venir directamente en el documento o en el payload
  const dateStr = fmtDate(data.timestamp ?? typedPayload.timestamp);

 return (
    <article
      className="relative flex gap-3 rounded-xl p-4 shadow-md w-full max-w-[380px]"
      style={{ backgroundColor: C.cardBg, border: `1px solid ${C.cardBrd}` }}
    >
      {dateStr && (
        <span className="absolute top-[10px] right-3 text-[10px]" style={{ color: C.subTxt, opacity: 0.9 }}>
          {dateStr}
        </span>
      )}

      {/* Avatar */}
      <div className="relative h-12 w-12 shrink-0 rounded-full overflow-hidden">
        {onAvatarClick ? (
          <button
            onClick={onAvatarClick}
            className="relative w-full h-full focus:outline-none"
            disabled={isProcessing} // Deshabilitar también al procesar
          >
            <Image src={avatar} alt="Avatar del remitente" fill sizes="48px" className="object-cover" />
          </button>
        ) : (
          <Image src={avatar} alt="Avatar del remitente" fill sizes="48px" className="object-cover" />
        )}
      </div>

      {/* Texto y Acciones */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold leading-none mb-[2px]" style={{ color: C.txt }}>
          {senderName}
        </p>

        <span className="text-[13px]" style={{ color: C.subTxt }}>
          {expanded || !needsTrunc ? full : preview}
          {needsTrunc && (
            <>
              {!expanded && '… '}
              <button
                onClick={() => setExpanded(!expanded)}
                disabled={isProcessing}
                className="inline-flex items-center gap-[1px] text-[11px] font-medium ml-[2px]"
                style={{ color: C.txt }}
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

        {/* --- INICIO DE LA SECCIÓN MODIFICADA --- */}
        {(primary || hasSecondaryAction) && (
          <div className={`mt-3 grid gap-2 ${primary && hasSecondaryAction ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {primary && (
              <button
                onClick={onPrimary}
                disabled={isProcessing}
                // Se aplican las clases del estilo estándar de la app
                className="flex items-center justify-center gap-2 px-3 py-[6px] rounded-md text-[13px] font-medium w-full !bg-[var(--color-primario)] !text-[var(--color-fondo)] border-none !focus:shadow-none hover:!brightness-90 disabled:opacity-60"
              >
                {isProcessing ? <Spinner /> : <CheckCircleIcon className="w-4 h-4" />}
                {isProcessing ? 'Procesando...' : primary}
              </button>
            )}
            {hasSecondaryAction && (
              // Este botón de eliminar se mantiene sin cambios, con su estilo rojo original
              <button
                onClick={onSecondary}
                disabled={isProcessing}
                className="flex items-center justify-center gap-1 px-3 py-[6px] rounded-md text-[13px] font-medium w-full transition-opacity duration-200"
                style={{
                  backgroundColor: C.delBg,
                  color: C.delTxt,
                  opacity: isProcessing ? 0.6 : 1,
                }}
              >
                <TrashIcon className="w-4 h-4" />
                {secondary}
              </button>
            )}
          </div>
        )}
        {/* --- FIN DE LA SECCIÓN MODIFICADA --- */}
      </div>
    </article>
  );
}