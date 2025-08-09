'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useUserStore, UserProfile } from '@/store/userStore';
import useNotificationHandler from '@/hooks/useNotificationHandler';

// Importaciones de servicios y componentes específicos
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import { getProvidersByFilter } from '@/lib/services/providersService';
import { sendJobRequest, Payload as NotificationPayload } from '@/lib/services/notificationsService';
import AyudaBusqueda from '@/app/components/ayuda-contenido/AyudaBusqueda';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import BotonVolver from '@/app/components/common/BotonVolver';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import AlertPopup from '@/app/components/common/AlertPopup';

// --- INICIO: IMPORTS PARA EL MODAL DE ANUNCIOS ---
import AnuncioAnimadoCard from '@/app/components/anuncios/AnuncioAnimadoCard';
import { PLANES } from '@/lib/constants/planes';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import useHelpContent from '@/lib/hooks/useHelpContent';
// --- FIN: IMPORTS PARA EL MODAL DE ANUNCIOS ---


// Tipos mejorados que se mantienen en la página
interface UserProfileWithLocalidad extends UserProfile {
  localidad: { nombre: string; provinciaNombre: string };
  selfieURL?: string;
  nombre: string;
}

// --- INICIO: COMPONENTE `AnuncioModal` ACTUALIZADO CON TRANSICIÓN SUAVE ---
const AnuncioModal = ({ ad, onClose }: { ad: SerializablePaginaAmarillaData; onClose: () => void; }) => {
  const planDetails = ad.planId ? PLANES.find(p => p.id === ad.planId) : null;
  
  // Fases: 'mostrandoTexto', 'transicion', 'mostrandoAnuncio'
  const [fase, setFase] = useState<'texto' | 'transicion' | 'anuncio'>('texto');

  useEffect(() => {
    // 1. El texto se muestra por 3 segundos
    const textoTimer = setTimeout(() => {
      setFase('transicion'); // Inicia la transición (el texto se empieza a ir)
    }, 3000); // <-- Aumentado a 3 segundos

    // 2. La tarjeta del anuncio aparece un poco después, creando un fundido
    const anuncioTimer = setTimeout(() => {
        setFase('anuncio'); // Termina la transición (el anuncio es totalmente visible)
    }, 3500); // 500ms después de que el texto empieza a irse

    return () => {
      clearTimeout(textoTimer);
      clearTimeout(anuncioTimer);
    };
  }, []);

  useEffect(() => {
    // El autocierre final no cambia
    if (fase === 'anuncio' && planDetails) {
      const totalDuration = planDetails.durationFrontMs + planDetails.durationBackMs;
      const cierreTimer = setTimeout(() => {
        onClose();
      }, totalDuration + 500);

      return () => clearTimeout(cierreTimer);
    }
  }, [fase, planDetails, onClose]);

  if (!planDetails) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      
      {/* El texto ahora tiene una transición de entrada y salida */}
      <div 
        className={`absolute transition-opacity duration-700 ease-in-out ${
            fase === 'texto' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <p className="text-white text-center text-lg">
          Mientras enviamos tu solicitud, mira los comercios y prestadores que apoyan a CODYS:
        </p>
      </div>

      {/* El anuncio ahora aparece un poco después y se mantiene visible */}
      <div 
        className={`w-full max-w-sm transition-opacity duration-700 ease-in-out ${
            fase === 'anuncio' ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {fase === 'anuncio' && (
          <AnuncioAnimadoCard
            publicacion={ad}
            duracionFrente={planDetails.durationFrontMs}
            duracionDorso={planDetails.durationBackMs}
          />
        )}
      </div>
    </div>
  );
};
// --- FIN: COMPONENTE `AnuncioModal` ACTUALIZADO ---


export default function BusquedaPage() {
  const router = useRouter();
  useHelpContent(<AyudaBusqueda />);
  const {
    notifications,
    processingNotifId,
    showContacto,
    selectedPrestador,
    showPerfilModal,
    perfilModalTarget,
    showAlert,
    alertMessage,
    onPrimaryAction,
    onSecondaryAction,
    onTertiaryAction,
    onAvatarClick,
    closeContactoPopup,
    closePerfilModal,
    closeAlertPopup,
    currentUser,
    userUid,
    userCollection,
  } = useNotificationHandler();

  const [categorySel, setCategorySel] = useState<CategoriaSeleccionada | null>(null);
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // --- INICIO: NUEVO ESTADO PARA EL MODAL ---
  const [showAdModal, setShowAdModal] = useState(false);
  const [adToDisplay, setAdToDisplay] = useState<SerializablePaginaAmarillaData | null>(null);
  // --- FIN: NUEVO ESTADO PARA EL MODAL ---
  
  const handleCategoriaChange = useCallback((sel: CategoriaSeleccionada | null) => {
    setCategorySel(sel);
  }, []);

  if (!currentUser || !(currentUser as UserProfileWithLocalidad).localidad) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }
  
  const {
    nombre: userName,
    selfieURL: userAvatar,
    localidad: { provinciaNombre: province, nombre: locality },
  } = currentUser as UserProfileWithLocalidad;


  // --- LÓGICA DE BÚSQUEDA DE PRESTADORES (AHORA SEPARADA) ---
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const executeJobRequest = useCallback(async () => {
    try {
      if (!categorySel || !description.trim() || !userUid) return;

      const { categoria, subcategoria } = categorySel;
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
    }
  }, [categorySel, description, userUid, province, locality, userCollection, userName, userAvatar]);
  
  // --- FUNCIÓN `handleSearch` ACTUALIZADA ---
  async function handleSearch() {
    if (!categorySel || !description.trim() || isSearching) {
      if (!categorySel) toast.error('Debes elegir una categoría.');
      if (!description.trim()) toast.error('La descripción no puede estar vacía.');
      return;
    }

    setIsSearching(true);

    try {
      // --- CAMBIO CLAVE: Se usa 'searchTrigger' para activar la lógica de jerarquía en la API ---
      const adApiUrl = `/api/anuncios?context=searchTrigger&provincia=${province}&localidad=${locality}`;
      
      const adRes = await fetch(adApiUrl);
      
      if (!adRes.ok) {
        throw new Error('La API de anuncios no respondió correctamente.');
      }

      // La API ahora devolverá UN SOLO anuncio (el de mayor jerarquía) o null
      const adData: SerializablePaginaAmarillaData | null = await adRes.json();

      if (adData) {
        // Si la API encontró un anuncio, lo mostramos en el modal
        setAdToDisplay(adData);
        setShowAdModal(true);
        // La búsqueda de prestadores se ejecutará cuando el modal se cierre (en el onClose)
      } else {
        // Si la API devolvió null (no hay anuncios), ejecutamos la búsqueda de inmediato.
        await executeJobRequest();
        setIsSearching(false);
      }
    } catch (adError) {
      console.error("No se pudo cargar el anuncio, continuando con la búsqueda...", adError);
      // Si hay cualquier error al buscar el anuncio, no detenemos el flujo principal.
      await executeJobRequest();
      setIsSearching(false);
    }
  }
  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">
        <header className="relative flex items-center justify-center py-8">
          <h1 className="text-lg font-medium">Búsqueda de servicios</h1>
        </header>

        <hr className="border-borde-tarjeta" />

        <main className="flex flex-col items-center flex-grow pt-6 pb-8">
          <div className="w-full max-w-lg space-y-6 p-6 rounded-2xl shadow-lg bg-tarjeta border border-borde-tarjeta text-texto-principal">
            <SelectorCategoria idCategoria="busq-cat" idSubcategoria="busq-sub" onCategoriaChange={handleCategoriaChange}/>
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-texto-principal mb-1">
                Descripción (breve)
              </label>
              <textarea id="descripcion" rows={3} value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Ej: Necesito reparar una cañería en el baño..."
                className="w-full px-4 py-2 rounded-lg focus:outline-none bg-white/10 text-texto-principal border border-borde-tarjeta resize-none placeholder:text-texto-secundario placeholder:opacity-70"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!categorySel || !description.trim() || isSearching}
              className="btn-primary w-full"
            >
              {isSearching ? 'Procesando...' : 'Buscar prestadores'}
            </button>
          </div>

          {notifications.length > 0 && ( <h3 className="text-xl font-semibold mt-10 mb-4 text-texto-principal">Notificaciones recibidas</h3> )}
          <div className="w-full max-w-lg space-y-4">
            {notifications.length === 0 && ( <p className="text-center text-sm opacity-70 py-4 text-texto-secundario">Aquí aparecerán las respuestas de los prestadores.</p> )}
            {notifications.map(n => (
              <NotificacionCard key={n.id} data={n} viewerMode="user" isProcessing={processingNotifId === n.id}
                onPrimary={() => onPrimaryAction(n)} onSecondary={() => onSecondaryAction(n)}
                onTertiary={() => onTertiaryAction(n)}
                onAvatarClick={n.type === 'contact_followup' ? undefined : () => onAvatarClick(n)}
              />
            ))}
          </div>
        </main>
      </div>

      {showContacto && selectedPrestador && userUid && (
        <ContactoPopup
          userUid={userUid} userCollection={userCollection} providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection} providerName={selectedPrestador.nombre}
          notifId={notifications.find(x => x.type === 'job_accept' && x.from?.uid === selectedPrestador.uid)?.id || ''}
          onClose={closeContactoPopup}
        />
      )}
      {showPerfilModal && perfilModalTarget && ( <PerfilModal target={perfilModalTarget} viewerMode="user" onClose={closePerfilModal} /> )}
      {showAlert && ( <AlertPopup isOpen={showAlert} title="Proceso Cancelado" message={alertMessage} buttonText="Entendido" onClose={closeAlertPopup}/> )}
      
      {/* --- AÑADIR ESTE BLOQUE FINAL --- */}
      {showAdModal && adToDisplay && (
        <AnuncioModal ad={adToDisplay} onClose={() => {
            setShowAdModal(false);
            // Ejecutamos la búsqueda de prestadores DESPUÉS de que el modal se cierra
            executeJobRequest().finally(() => setIsSearching(false));
        }} />
      )}
      {/* ------------------------------- */}

      <BotonVolver />
    </div>
  );
}