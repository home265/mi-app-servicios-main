// src/app/busqueda/page.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
/*───────────────────────────────────────────────
  BÚSQUEDA — “Búsqueda de servicios”
───────────────────────────────────────────────*/
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

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
  Payload as NotificationPayload,
} from '@/lib/services/notificationsService';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import ResenaForm from '@/app/components/resenas/ResenaForm';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import { doc, getDoc, deleteDoc, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// paleta
const palette = {
  dark: {
    fondo: '#0F2623',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#F9F3D9',
    subTxt: '#E4DEC4',
    resalte: '#EFC71D',
    marca: '/MARCA_CODYS_14.png',
  },
  light: {
    fondo: '#F9F3D9',
    tarjeta: '#184840',
    borde: '#2F5854',
    texto: '#0F2623',
    subTxt: '#2C463F',
    resalte: '#EFC71D',
    marca: '/MARCA_CODYS_13.png',
  },
};

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
  const currentUser = useUserStore(s => s.currentUser) as UserProfileWithLocalidad | null;
  const originalRole = useUserStore(s => s.originalRole);
  const setUnread = useUserStore(s => s.setUnread);
  const router = useRouter();

  const { resolvedTheme } = useTheme();
  const P = resolvedTheme === 'dark' ? palette.dark : palette.light;

  const [categorySel, setCategorySel] = useState<CategoriaSeleccionada | null>(null);
  const [description, setDescription] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showContacto, setShowContacto] = useState(false);
  const [selectedPrestador, setSelectedPrestador] = useState<PrestadorData | null>(null);
  const [showResena, setShowResena] = useState(false);
  const [resenaTarget, setResenaTarget] = useState<ResenaTarget | null>(null);
  const [resenaNotifId, setResenaNotifId] = useState<string | null>(null);
  const [showPerfil, setShowPerfil] = useState(false);
  const [perfilTarget, setPerfilTarget] = useState<PerfilTarget | null>(null);

  const userCollection =
    originalRole === 'prestador' ? 'prestadores' :
    originalRole === 'comercio'   ? 'comercios' :
    'usuarios_generales';

  const handleCategoriaChange = useCallback((sel: CategoriaSeleccionada | null) => {
    setCategorySel(sel);
  }, []);

  function getSender(n: Notification): NotificationSender | null {
    if (n.from?.uid && n.from?.collection) return n.from;
    const fromId = (n as DocumentData).fromId || (n.payload as DocumentData)?.fromId;
    const fromCollection = (n as DocumentData).fromCollection || (n.payload as DocumentData)?.fromCollection;
    return typeof fromId === 'string' && typeof fromCollection === 'string'
      ? { uid: fromId, collection: fromCollection }
      : null;
  }

  useEffect(() => {
    if (currentUser && originalRole) {
      const unsub = subscribeToNotifications(
        { uid: currentUser.uid, collection: userCollection },
        list => {
          const filt = list.filter(n =>
            ['job_accept', 'contact_followup', 'rating_request'].includes(n.type)
          );
          setNotifications(filt);
          setUnread('jobResponses', filt.filter(x => !x.read).length);
        }
      );
      return unsub;
    }
    return () => { };
  }, [currentUser, originalRole, userCollection, setUnread]);

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

  async function handleSearch() {
    if (!categorySel) {
      alert('Debes elegir una categoría.');
      return;
    }
    if (!description.trim()) {
      alert('La descripción no puede estar vacía.');
      return;
    }
    const { categoria, subcategoria } = categorySel;
    try {
      const providers = await getProvidersByFilter(categoria, subcategoria || undefined, province, locality);
      if (!providers.length) {
        alert('No se encontraron prestadores.');
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
      alert('Solicitud enviada.');
      setDescription('');
    } catch (e) {
      console.error(e);
      alert('Error al enviar solicitud.');
    }
  }

  async function handlePrimary(n: Notification) {
    const s = getSender(n); if (!s) return;
    if (n.type === 'job_accept') {
      const snap = await getDoc(doc(db, s.collection, s.uid));
      const data = snap.data();
      if (!data) { alert('No pude cargar datos.'); return; }
      setSelectedPrestador({
        uid: s.uid,
        collection: s.collection,
        nombre: data.nombre || 'Prestador',
        selfieUrl: (data as any).selfieURL || (data as any).selfieUrl || '/avatar-placeholder.png',
        telefono: (data as any).telefono || '',
      });
      setShowContacto(true);
    } else if (n.type === 'contact_followup') {
      await sendAgreementConfirmed({
        to: [s], from: { uid: userUid, collection: userCollection },
        payload: {
          description: `${userName} confirmó el acuerdo.`,
          senderName: userName,
          avatarUrl: userAvatar || '/avatar-placeholder.png',
        }
      });
      await deleteDoc(doc(db, 'usuarios_generales', userUid, 'contactPendings', s.uid));
      await removeNotification({ uid: userUid, collection: userCollection }, n.id);
      alert('Notificado al prestador.');
    } else {
      setResenaTarget(s); setResenaNotifId(n.id); setShowResena(true);
    }
  }

  async function handleSecondary(n: Notification) {
    await removeNotification({ uid: userUid, collection: userCollection }, n.id);
  }
  function handleAvatarClick(n: Notification) {
    const s = getSender(n); if (s) { setPerfilTarget(s); setShowPerfil(true); }
  }
  async function handleResenaSubmitted() {
    if (resenaNotifId) {
      await removeNotification({ uid: userUid, collection: userCollection }, resenaNotifId);
    }
    setShowResena(false);
    setResenaTarget(null);
    setResenaNotifId(null);
    alert('Reseña enviada.');
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: P.fondo, color: P.texto }}
    >
      <header className="relative flex items-center justify-center px-5 py-8">
    <h1 className="text-lg font-medium">
        Búsqueda de servicios
    </h1>
</header>

      <hr className="mx-5" style={{ borderColor: P.borde }} />

      <main className="flex flex-col items-center flex-grow pt-6 pb-8 px-4">
        <div
          className="w-full max-w-lg space-y-6 p-6 rounded-2xl shadow-lg"
          style={{
            backgroundColor: P.tarjeta,
            border: `1px solid ${P.borde}`,
            color: palette.dark.texto   /* fuerza texto claro en ambos modos */
          }}
        >
          <SelectorCategoria
            idCategoria="busq-cat"
            idSubcategoria="busq-sub"
            onCategoriaChange={handleCategoriaChange}
            labelColor={palette.dark.texto}  /* etiquetas siempre claras */
          />

          <div>
            <label
              htmlFor="descripcion"
              className="block text-sm font-medium mb-1"
              style={{ color: palette.dark.texto }}
            >
              Descripción (breve)
            </label>
            <textarea
              id="descripcion"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descripción breve…"
              className="w-full px-4 py-2 rounded-lg focus:outline-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: palette.dark.texto,
                border: `1px solid ${P.borde}`,
                resize: 'none'
              }}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={!categorySel || !description.trim()}
            fullWidth
            style={{
              backgroundColor: P.resalte,
              color: P.fondo,
              border: `1px solid ${P.borde}`,
            }}
          >
            Buscar prestadores
          </Button>
        </div>

        {notifications.length > 0 && (
          <h3 className="text-xl font-semibold mt-10 mb-4" style={{ color: P.texto }}>
            Notificaciones recibidas
          </h3>
        )}
        <div className="w-full max-w-lg space-y-4">
          {notifications.length === 0 && (
            <p className="text-center text-sm opacity-70 py-4" style={{ color: P.subTxt }}>
              No tienes notificaciones nuevas.
            </p>
          )}
          {notifications.map(n => (
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
      </main>

      {/* pop-ups */}
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
      {showResena && resenaTarget && <ResenaForm target={resenaTarget} onSubmitted={handleResenaSubmitted} />}
      {showPerfil && perfilTarget && (
        <PerfilModal target={perfilTarget} viewerMode="user" onClose={() => setShowPerfil(false)} />
      )}

      <button
        onClick={() => router.push('/bienvenida')}
        className="fixed bottom-6 right-4 h-12 w-12 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
        style={{ backgroundColor: P.tarjeta }}
      >
        <ChevronLeftIcon className="h-6 w-6" style={{ color: P.resalte }} />
      </button>

      {/* placeholder description siempre en subTxt oscuro */}
      <style jsx global>{`
        #descripcion::placeholder {
          color: ${palette.dark.subTxt} !important;
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
