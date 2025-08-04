'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useUserStore, UserProfile } from '@/store/userStore';
import useNotificationHandler from '@/hooks/useNotificationHandler'; // <-- PASO 1: IMPORTAR EL HOOK

// Importaciones de servicios y componentes específicos de esta página
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import { getProvidersByFilter } from '@/lib/services/providersService';
import { sendJobRequest, Payload as NotificationPayload } from '@/lib/services/notificationsService';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaBusqueda from '@/app/components/ayuda-contenido/AyudaBusqueda';
import NotificacionCard from '@/app/components/notificaciones/NotificacionCard';
import ContactoPopup from '@/app/components/notificaciones/ContactoPopup';
import BotonVolver from '@/app/components/common/BotonVolver';
import PerfilModal from '@/app/components/notificaciones/PerfilModal';
import AlertPopup from '@/app/components/common/AlertPopup'; // <-- Importar AlertPopup

// Tipos mejorados que se mantienen en la página
interface UserProfileWithLocalidad extends UserProfile {
  localidad: { nombre: string; provinciaNombre: string };
  selfieURL?: string;
  nombre: string;
}

export default function BusquedaPage() {
  const router = useRouter();

  // --- PASO 2: LLAMAR AL HOOK PARA OBTENER LA LÓGICA DE NOTIFICACIONES ---
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
    currentUser, // Obtenido del hook para usar en la búsqueda
    userUid,
    userCollection,
  } = useNotificationHandler();

  // --- ESTADO LOCAL (solo lo específico de esta página) ---
  const [categorySel, setCategorySel] = useState<CategoriaSeleccionada | null>(null);
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Se mantiene el `useUserStore` solo si se necesita para algo que el hook no provea
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const originalRole = useUserStore(s => s.originalRole);

  const handleCategoriaChange = useCallback((sel: CategoriaSeleccionada | null) => {
    setCategorySel(sel);
  }, []);

  // La guarda de seguridad se simplifica usando el `currentUser` del hook
  if (!currentUser || !(currentUser as UserProfileWithLocalidad).localidad) {
    if (typeof window !== 'undefined') router.replace('/login');
    return null;
  }
  
  const {
    nombre: userName,
    selfieURL: userAvatar,
    localidad: { provinciaNombre: province, nombre: locality },
  } = currentUser as UserProfileWithLocalidad;

  // --- ACCIONES (solo las específicas de esta página) ---
  async function handleSearch() {
    if (!categorySel || !description.trim() || isSearching) {
      if (!categorySel) toast.error('Debes elegir una categoría.');
      if (!description.trim()) toast.error('La descripción no puede estar vacía.');
      return;
    }

    if (!userUid) {
      toast.error('Error de autenticación, por favor recarga la página.');
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

  // --- PASO 3: EL JSX AHORA ES MUCHO MÁS LIMPIO ---
  return (
    <div className="min-h-screen flex flex-col bg-fondo text-texto-principal">
      <div className="w-full max-w-4xl mx-auto px-5 flex flex-col flex-grow">
        <header className="relative flex items-center justify-center py-8">
          <h1 className="text-lg font-medium">
              Búsqueda de servicios
          </h1>
          <div className="absolute right-4">
              <BotonAyuda>
                <AyudaBusqueda />
              </BotonAyuda>
          </div>
        </header>

        <hr className="border-borde-tarjeta" />

        <main className="flex flex-col items-center flex-grow pt-6 pb-8">
          {/* El formulario de búsqueda no cambia */}
          <div className="w-full max-w-lg space-y-6 p-6 rounded-2xl shadow-lg bg-tarjeta border border-borde-tarjeta text-texto-principal">
            <SelectorCategoria
              idCategoria="busq-cat"
              idSubcategoria="busq-sub"
              onCategoriaChange={handleCategoriaChange}
            />
            <div>
              <label htmlFor="descripcion" className="block text-sm font-medium text-texto-principal mb-1">
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

          {/* La sección de notificaciones ahora usa la lógica del hook */}
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
                onPrimary={() => onPrimaryAction(n)}
                onSecondary={() => onSecondaryAction(n)}
                onTertiary={() => onTertiaryAction(n)}
                onAvatarClick={n.type === 'contact_followup' ? undefined : () => onAvatarClick(n)}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Los popups ahora usan los estados y funciones del hook */}
      {showContacto && selectedPrestador && userUid && (
        <ContactoPopup
          userUid={userUid}
          userCollection={userCollection}
          providerUid={selectedPrestador.uid}
          providerCollection={selectedPrestador.collection}
          providerName={selectedPrestador.nombre}
          notifId={notifications.find(x => x.type === 'job_accept' && x.from?.uid === selectedPrestador.uid)?.id || ''}
          onClose={closeContactoPopup}
        />
      )}
      {showPerfilModal && perfilModalTarget && (
        <PerfilModal 
          target={perfilModalTarget} 
          viewerMode="user" 
          onClose={closePerfilModal} 
        />
      )}
      {showAlert && (
        <AlertPopup
          isOpen={showAlert}
          title="Proceso Cancelado"
          message={alertMessage}
          buttonText="Entendido"
          onClose={closeAlertPopup}
        />
      )}

      <BotonVolver />
    </div>
  );
}