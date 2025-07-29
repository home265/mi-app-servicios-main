'use client';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaBusqueda from '@/app/components/ayuda-contenido/AyudaBusqueda';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { useUserStore, UserProfile } from '@/store/userStore';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import { getProvidersByFilter } from '@/lib/services/providersService';
import {
  sendJobRequest,
  subscribeToNotifications,
  removeNotification,
  confirmAgreementAndCleanup,
  NotificationDoc as Notification,
  Sender as NotificationSender,
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import BotonVolver from '@/app/components/common/BotonVolver';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/*────────── Tipos mejorados ──────────*/
interface PrestadorData {
  uid: string;
  collection: string;
  nombre: string;
  selfieUrl: string;
  telefono: string;
}
interface UserProfileWithLocalidad extends UserProfile {
  localidad?: { nombre: string; provinciaNombre: string };
  selfieURL?: string;
  nombre: string;
}
type PerfilTarget = { uid: string; collection: string };

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


export default function BusquedaPage() {
  const currentUser = useUserStore(s => s.currentUser as UserProfileWithLocalidad | null);
  const originalRole = useUserStore(s => s.originalRole);
  const router = useRouter();

  /*────────── Estado Local ──────────*/
  const [categorySel, setCategorySel] = useState<CategoriaSeleccionada | null>(null);
  const [description, setDescription] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorData | null>(null);
  const [showPerfil, setShowPerfil] = useState(false);
  const [perfilTarget, setPerfilTarget] = useState<PerfilTarget | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [processingNotifId, setProcessingNotifId] = useState<string | null>(null);


  const userCollection =
    originalRole === 'prestador' ? 'prestadores' :
    originalRole === 'comercio'   ? 'comercios' :
    'usuarios_generales';

  const handleCategoriaChange = useCallback((sel: CategoriaSeleccionada | null) => {
    setCategorySel(sel);
  }, []);

  /*────────── Helpers ──────────*/
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

  /*────────── Suscripción a Notificaciones ──────────*/
  useEffect(() => {
    if (currentUser && originalRole) {
      const unsub = subscribeToNotifications(
        { uid: currentUser.uid, collection: userCollection },
        list => {
          const filt = list.filter(n =>
            ['job_accept', 'contact_followup', 'rating_request'].includes(n.type)
          );
          setNotifications(filt);
        }
      );
      return unsub;
    }
    return () => {};
  }, [currentUser, originalRole, userCollection]);


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

  /*────────── Acciones ──────────*/
  async function handleSearch() {
    if (!categorySel || !description.trim() || isSearching) {
      if (!categorySel) toast.error('Debes elegir una categoría.');
      if (!description.trim()) toast.error('La descripción no puede estar vacía.');
      return;
    }

    setIsSearching(true);
    const { categoria, subcategoria } = categorySel;

    try {
      const providers = await getProvidersByFilter(categoria, subcategoria || undefined, province, locality);
      if (providers.length === 0) {
        toast('No se encontraron prestadores para esta categoría en tu localidad.', { icon: 'ℹ️' });
        return;
      }

      const toRecipients = providers.map(p => ({ uid: p.uid, collection: p.collection }));
      const fromSender = { uid: userUid, collection: userCollection };

      const payload: NotificationPayload = {
        category: categoria,
        subcategoria: subcategoria ?? '',
        description,
        senderName: userName,
        avatarUrl: userAvatar || '/logo1.png',
        timestamp: Date.now(),
      };

      await sendJobRequest({ to: toRecipients, from: fromSender, payload });
      toast.success('Solicitud enviada con éxito.');
      setDescription('');
    } catch (e) {
      console.error(e);
      toast.error('Ocurrió un error al enviar la solicitud.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handlePrimaryAction(n: Notification) {
    if (processingNotifId) return;

    const sender = getSender(n);
    if (!sender) {
        toast.error("No se pudo identificar al remitente de la notificación.");
        return;
    }

    setProcessingNotifId(n.id);
    try {
        if (n.type === 'job_accept') {
            const snap = await getDoc(doc(db, sender.collection, sender.uid));
            const data = snap.data() as ProviderDocData | undefined;
            if (!data) {
                toast.error('No se pudieron cargar los datos del prestador.');
                return;
            }
            setSelectedPrestador({
                uid: sender.uid,
                collection: sender.collection,
                nombre: typeof data.nombre === 'string' ? data.nombre : 'Prestador',
                selfieUrl: typeof data.selfieURL === 'string' ? data.selfieURL : (typeof data.selfieUrl === 'string' ? data.selfieUrl : '/avatar-placeholder.png'),
                telefono: typeof data.telefono === 'string' ? data.telefono : '',
            });
            setShowContacto(true);
        } else if (n.type === 'contact_followup') {
            const originalNotifId = n.payload?.originalNotifId as string | undefined;
            if (!originalNotifId) {
                console.error("Error crítico: No se encontró la 'originalNotifId' en el payload de la notificación de seguimiento.");
                toast.error("Error: No se pudo procesar la solicitud por falta de un identificador clave.");
                return;
            }

            await confirmAgreementAndCleanup({
                user: { uid: userUid, collection: userCollection },
                provider: { uid: sender.uid, collection: sender.collection },
                followupNotifId: n.id,
                originalNotifId: originalNotifId,
                userName: userName || 'Usuario',
            });
            
            toast.success('Acuerdo confirmado. ¡Gracias por usar nuestros servicios!');
       } else { // rating_request
        router.push(`/calificar/${sender.uid}?notifId=${n.id}`);
       }
    } catch (error) {
        console.error("Error en la acción principal:", error);
        toast.error("Hubo un error al procesar tu solicitud.");
    } finally {
        setProcessingNotifId(null);
    }
  }

 async function handleSecondaryAction(n: Notification) {
    if (processingNotifId) return;
    setProcessingNotifId(n.id);
    try {
        await removeNotification({ uid: userUid, collection: userCollection }, n.id);
    } catch (error) {
        console.error("Error al eliminar notificación:", error);
        toast.error("No se pudo eliminar la notificación.");
    } finally {
        setProcessingNotifId(null);
    }
  }

  function handleAvatarClick(n: Notification) {
    if (processingNotifId) return;
    const sender = getSender(n); 
    if (sender) {
        setPerfilTarget(sender);
        setShowPerfil(true);
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">
        <header className="relative flex items-center justify-center py-8">
          <div className="absolute left-0">
              <BotonAyuda>
              <AyudaBusqueda />
              </BotonAyuda>
          </div>
          <h1 className="text-lg font-medium">
              Búsqueda de servicios
          </h1>
        </header>

        <hr className="border-borde-tarjeta" />

        <main className="flex flex-col items-center flex-grow pt-6 pb-8">
          <div className="w-full max-w-lg space-y-6 p-6 rounded-2xl shadow-lg bg-tarjeta border border-borde-tarjeta text-texto-principal">
            <SelectorCategoria
              idCategoria="busq-cat"
              idSubcategoria="busq-sub"
              onCategoriaChange={handleCategoriaChange}
            />

            <div>
              <label
                htmlFor="descripcion"
                className="block text-sm font-medium text-texto-principal mb-1"
              >
                Descripción (breve)
              </label>
              <textarea
                id="descripcion"
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Necesito reparar una cañería en el baño..."
                className="w-full px-4 py-2 rounded-lg focus:outline-none bg-white/10 text-texto-principal border border-borde-tarjeta resize-none placeholder:text-texto-secundario placeholder:opacity-70"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={!categorySel || !description.trim() || isSearching}
              className="btn-primary w-full"
            >
              {isSearching ? 'Buscando...' : 'Buscar prestadores'}
            </button>
          </div>

          {notifications.length > 0 && (
            <h3 className="text-xl font-semibold mt-10 mb-4 text-texto-principal">
              Notificaciones recibidas
            </h3>
          )}
          <div className="w-full max-w-lg space-y-4">
            {notifications.length === 0 && (
              <p className="text-center text-sm opacity-70 py-4 text-texto-secundario">
                Aquí aparecerán las respuestas de los prestadores.
              </p>
            )}
            {notifications.map(n => (
              <NotificacionCard
                key={n.id}
                data={n}
                viewerMode="user"
                isProcessing={processingNotifId === n.id}
                onPrimary={() => handlePrimaryAction(n)}
                onSecondary={() => handleSecondaryAction(n)}
                onAvatarClick={() => handleAvatarClick(n)}
              />
            ))}
          </div>
        </main>
      </div>

      {showContacto && selectedPrestador && (
        <ContactoPopup
          userUid={userUid}
          userCollection={userCollection}
          providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection}
          providerName={selectedPrestador.nombre}
          notifId={notifications.find(x => x.type === 'job_accept' && getSender(x)?.uid === selectedPrestador.uid)?.id || ''}
          onClose={() => setShowContacto(false)}
        />
      )}
      {showPerfil && perfilTarget && (
        <PerfilModal target={perfilTarget} viewerMode="user" onClose={() => setShowPerfil(false)} />
      )}

      {/*────────── FAB volver ──────────*/}
        <BotonVolver />
    </div>
  );
}