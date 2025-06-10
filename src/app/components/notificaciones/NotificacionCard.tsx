/* NotificacionCard.tsx – versión ajustada para logo de la app y avatar del usuario */
import Image from 'next/image';
import Button from '@/app/components/ui/Button';
import { NotificationDoc as Notification } from '@/lib/services/notificationsService';
import { DocumentData } from 'firebase/firestore';

interface Props {
  data: Notification;
  viewerMode: 'user' | 'provider';
  onPrimary: () => void | Promise<void>;
  onSecondary?: () => void | Promise<void>;
  onAvatarClick?: () => void;
}

export default function NotificacionCard({
  data,
  viewerMode,
  onPrimary,
  onSecondary,
  onAvatarClick,
}: Props) {
  const { payload, type, from } = data;

  /* ───── Determinar nombre y avatar ───── */
  const profileUid =
    typeof from?.uid === 'string'
      ? from.uid
      : (payload as DocumentData)?.fromId ?? '';

  const senderName =
    (payload as DocumentData)?.senderName?.trim() || 'Usuario';

  let avatarUrl: string | null = null;
  if (payload) {
    const p = payload as DocumentData;
    if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim()) {
      avatarUrl = p.avatarUrl;
    } else if (typeof p.providerAvatar === 'string' && p.providerAvatar.trim()) {
      avatarUrl = p.providerAvatar;
    } else if (
      typeof p.senderAvatarUrl === 'string' &&
      p.senderAvatarUrl.trim()
    ) {
      avatarUrl = p.senderAvatarUrl;
    }
  }
  const avatarSrc = avatarUrl || '/logo1.png';

  /* ───── Botones según tipo de notificación ───── */
  const map = {
    job_request: {
      primary: viewerMode === 'provider' ? 'Aceptar' : undefined,
      secondary: 'Eliminar',
    },
    job_accept: {
      primary: viewerMode === 'user' ? 'Contactar' : undefined,
      secondary: 'Eliminar',
    },
    contact_followup: {
      primary: viewerMode === 'user' ? 'Sí, acordamos' : undefined,
      secondary: viewerMode === 'user' ? 'No, aún no' : 'Eliminar',
    },
    agreement_confirmed: {
      primary: viewerMode === 'provider' ? 'Calificar Usuario' : undefined,
      secondary: undefined,
    },
    rating_request: {
      primary: viewerMode === 'user' ? 'Calificar Prestador' : undefined,
      secondary: 'Eliminar',
    },
  } as const;

  const cfg = map[type as keyof typeof map];
  const { primary, secondary } = cfg ?? {};

  /* ───── Render ───── */
  return (
    <div className="flex gap-3 rounded-xl bg-tarjeta p-4 shadow-md border border-borde-tarjeta">
      {/* Avatar */}
      <div className="relative w-12 h-12 shrink-0 rounded-full overflow-hidden">
        {onAvatarClick && profileUid ? (
          <button
            onClick={onAvatarClick}
            className="focus:outline-none w-full h-full block"
          >
            <Image
              src={avatarSrc}
              alt={`Avatar de ${senderName}`}
              fill
              sizes="48px"
              className="object-cover"
            />
          </button>
        ) : profileUid ? (
          <a href={`/perfil/${profileUid}`} className="block w-full h-full">
            <Image
              src={avatarSrc}
              alt={`Avatar de ${senderName}`}
              fill
              sizes="48px"
              className="object-cover"
            />
          </a>
        ) : (
          <Image
            src={avatarSrc}
            alt={`Avatar de ${senderName}`}
            fill
            sizes="48px"
            className={
              avatarSrc === '/logo1.png' ? 'object-contain p-1' : 'object-cover'
            }
          />
        )}
      </div>

      {/* Texto y acciones */}
      <div className="flex-1">
        <p className="font-semibold text-texto-principal">{senderName}</p>
        {payload?.description && (
          <p className="text-sm text-texto-secundario">
            {(payload as DocumentData).description}
          </p>
        )}

        {(primary || (secondary && onSecondary)) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {primary && (
              <Button onClick={onPrimary} variant="primary">
                {primary}
              </Button>
            )}
            {secondary && onSecondary && (
              <Button onClick={onSecondary} variant="outline">
                {secondary}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
