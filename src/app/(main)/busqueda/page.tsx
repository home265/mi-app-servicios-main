'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, UserProfile } from '@/store/userStore';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import Button from '@/app/components/ui/Button';
import { getProvidersByFilter } from '@/lib/services/providersService';
import {
  sendJobRequest,
  subscribeToNotifications,
  removeNotification,
  sendAgreementConfirmed,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  Recipient as NotificationRecipient,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import ResenaForm from '@/app/components/resenas/ResenaForm';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import Logo from '@/app/components/ui/Logo';
import { doc, getDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/* ───── Tipos internos ───── */
interface PrestadorData {
  uid: string;
  collection: string;
  nombre: string;
  selfieUrl: string;
  telefono: string;
}
interface UserProfileWithLocalidad extends UserProfile {
  localidad: { nombre: string; provinciaNombre: string };
  selfieURL?: string;
  nombre: string;
}
type ResenaTarget = { uid: string; collection: string };
type PerfilTarget = { uid: string; collection: string };

export default function BusquedaPage() {
  /* ─── store & router ─── */
  const currentUser = useUserStore((s) => s.currentUser) as UserProfileWithLocalidad | null;
  const originalRole = useUserStore((s) => s.originalRole);
  const setUnread = useUserStore((s) => s.setUnread);
  const router = useRouter();

  /* ─── state ─── */
  const [categorySel, setCategorySel] = useState<CategoriaSeleccionada | null>(null);
  const [description, setDescription] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorData | null>(null);

  // reseñas
  const [showResena, setShowResena] = useState(false);
  const [resenaTarget, setResenaTarget] = useState<ResenaTarget | null>(null);
  const [resenaNotifId, setResenaNotifId] = useState<string | null>(null);

  // perfil
  const [showPerfil, setShowPerfil] = useState(false);
  const [perfilTarget, setPerfilTarget] = useState<PerfilTarget | null>(null);

  /* ─── helpers ─── */
  const userCollection =
    originalRole === 'prestador'
      ? 'prestadores'
      : originalRole === 'comercio'
      ? 'comercios'
      : 'usuarios_generales';

  const handleCategoriaChange = useCallback((sel: CategoriaSeleccionada | null) => {
    setCategorySel(sel ? { categoria: sel.categoria, subcategoria: sel.subcategoria || null } : null);
  }, []);

  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) return { uid: n.from.uid, collection: n.from.collection };
    const fromId = (n as DocumentData).fromId || (n.payload as DocumentData)?.fromId;
    const fromCollection = (n as DocumentData).fromCollection || (n.payload as DocumentData)?.fromCollection;
    return typeof fromId === 'string' && typeof fromCollection === 'string'
      ? { uid: fromId, collection: fromCollection }
      : null;
  }

  /* ─── suscripción ─── */
  useEffect(() => {
    if (currentUser && originalRole) {
      const unsub = subscribeToNotifications(
        { uid: currentUser.uid, collection: userCollection },
        (list) => {
          const filtered = list.filter((n) =>
            ['job_accept', 'contact_followup', 'rating_request'].includes(n.type),
          );
          setNotifications(filtered);
          setUnread('jobResponses', filtered.filter((n) => !n.read).length);
        },
      );
      return unsub;
    }
    return () => {};
  }, [currentUser, originalRole, userCollection, setUnread]);

  /* ─── guards ─── */
  if (!currentUser || !currentUser.localidad) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }

  const {
    uid: userUid,
    nombre: userName,
    selfieURL: userAvatar,
    localidad: { provinciaNombre: province, nombre: locality },
  } = currentUser;

  /* ─── búsqueda ─── */
  async function handleSearch() {
    if (!categorySel) {
      alert('Selecciona una categoría antes de buscar.');
      return;
    }
    const { categoria, subcategoria } = categorySel;

    try {
      const providers = await getProvidersByFilter(
        categoria,
        subcategoria || undefined,
        province,
        locality,
      );
      if (!providers.length) {
        alert('No se encontraron prestadores en tu zona.');
        return;
      }

      const toRecipients: NotificationRecipient[] = providers.map((p) => ({
        uid: p.uid,
        collection: p.collection,
      }));
      const fromSender: NotificationSender = { uid: userUid, collection: userCollection };

      const jobPayload: NotificationPayload = {
        category: categoria,
        subcategoria: subcategoria ?? '',
        description,
        senderName: userName,
        avatarUrl: userAvatar || '/logo1.png',
        timestamp: Date.now(),
      };

      await sendJobRequest({ to: toRecipients, from: fromSender, payload: jobPayload });
      alert('¡Solicitud enviada con éxito!');
      setDescription('');
    } catch (err) {
      console.error('[Busqueda] Error al enviar solicitud:', err);
      alert('Ocurrió un error al enviar la solicitud.');
    }
  }

  /* ─── acciones tarjeta ─── */
  async function handlePrimary(n: Notification) {
  const sender = getSender(n);
  if (!sender) return;

  if (n.type === 'job_accept') {
    const snap = await getDoc(doc(db, sender.collection, sender.uid));
    const data = snap.data();
    if (!data) {
      alert('No se pudieron cargar los datos del prestador.');
      return;
    }
    setSelectedPrestador({
      uid: sender.uid,
      collection: sender.collection,
      nombre: data.nombre ?? 'Prestador',
      selfieUrl: data.selfieURL ?? data.selfieUrl ?? '/avatar-placeholder.png',
      telefono: data.telefono ?? '',
    });
    setShowContacto(true);

  } else if (n.type === 'contact_followup') {
    await sendAgreementConfirmed({
      to: [sender],
      from: { uid: userUid, collection: userCollection },
      payload: {
        description: `${userName} confirmó que llegaron a un acuerdo.`,
        senderName: userName,
        avatarUrl: userAvatar ?? '/avatar-placeholder.png',
      },
    });

    // 🗑️ Eliminar contactPendings para que la Cloud Function no reprograme
    await deleteDoc(
      doc(db, 'usuarios_generales', userUid, 'contactPendings', sender.uid),
    );

    await removeNotification({ uid: userUid, collection: userCollection }, n.id);
    alert('Respuesta enviada. Se ha notificado al prestador.');

  } else if (n.type.startsWith('rating_request')) {
    setResenaTarget(sender);
    setResenaNotifId(n.id);
    setShowResena(true);
  }
}

  async function handleSecondary(n: Notification) {
    await removeNotification({ uid: userUid, collection: userCollection }, n.id);
  }

  function handleAvatarClick(n: Notification) {
    const sender = getSender(n);
    if (sender) {
      setPerfilTarget(sender);
      setShowPerfil(true);
    }
  }

  /* ─── reseña enviada ─── */
  async function handleResenaSubmitted() {
    if (resenaNotifId) {
      await removeNotification({ uid: userUid, collection: userCollection }, resenaNotifId);
    }
    setShowResena(false);
    setResenaTarget(null);
    setResenaNotifId(null);
    alert('¡Reseña enviada!');
  }

  /* ─── render ─── */
  return (
    <div className="flex flex-col items-center p-4 min-h-screen bg-fondo text-texto-principal">
      <div className="mb-6 mt-2">
        <Logo />
      </div>

      {/* --- formulario búsqueda --- */}
      <div className="w-full max-w-lg space-y-6 bg-tarjeta p-6 rounded-xl shadow-lg border border-borde-tarjeta mb-8">
        <SelectorCategoria
          idCategoria="busqueda-categoria"
          idSubcategoria="busqueda-subcategoria"
          onCategoriaChange={handleCategoriaChange}
        />
        <div>
          <label
            htmlFor="descripcion"
            className="block text-sm font-medium text-texto-secundario mb-1"
          >
            Descripción del trabajo (opcional)
          </label>
          <textarea
            id="descripcion"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Necesito un plomero para arreglar una pérdida en el baño."
            className="block w-full px-3 py-2 bg-input text-texto-principal border border-borde-input rounded-md shadow-sm placeholder-texto-placeholder focus:outline-none focus:ring-primario focus:border-primario sm:text-sm"
          />
        </div>
        <Button onClick={handleSearch} disabled={!categorySel} fullWidth>
          Buscar Prestadores
        </Button>
      </div>

      {/* --- notificaciones --- */}
      {notifications.length > 0 && (
        <h2 className="text-xl font-semibold text-texto-principal mb-4">
          Notificaciones Recibidas
        </h2>
      )}
      <div className="w-full max-w-lg space-y-4">
        {notifications.length === 0 && (
          <p className="text-center text-texto-secundario py-4">
            No tienes notificaciones nuevas.
          </p>
        )}
        {notifications.map((n) => (
          <NotificacionCard
            key={n.id}
            data={n}
            viewerMode="user"
            onPrimary={() => handlePrimary(n)}
            onSecondary={() => handleSecondary(n)}
            onAvatarClick={() => handleAvatarClick(n)}
          />
        ))}
      </div>

      {/* --- pop-ups --- */}
      {showContacto && selectedPrestador && (
        <ContactoPopup
          userUid={userUid}
          userCollection={userCollection}
          providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection}
          providerName={selectedPrestador.nombre}
          notifId={
            notifications.find(
              (notif) =>
                notif.type === 'job_accept' && getSender(notif)?.uid === selectedPrestador.uid,
            )?.id ?? ''
          }
          onClose={() => setShowContacto(false)}
        />
      )}

      {showResena && resenaTarget && (
        <ResenaForm target={resenaTarget} onSubmitted={handleResenaSubmitted} />
      )}

      {showPerfil && perfilTarget && (
        <PerfilModal
          target={perfilTarget}
          viewerMode="user"
          onClose={() => setShowPerfil(false)}
        />
      )}
    </div>
  );
}
