// src/app/(main)/ajustes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, type Role } from '@/store/userStore';
import { signOutUser, performAccountDeletion } from '@/lib/firebase/auth';
import { toast } from 'react-hot-toast';

import {
  BellOff,
  AlertTriangle,
  ChevronLeftIcon,
  LogOut,
  Trash2,
  BellRing,
  Loader2,
  type LucideProps,
} from 'lucide-react';

import Avatar from '@/app/components/common/Avatar';
import Modal from '@/app/components/common/Modal';

// --- Nuevo Componente de Botón para Ajustes ---
// Este componente encapsula el estilo visual de "relieve" solicitado.
interface BotonDeAjusteProps {
  label: string;
  Icon: React.ComponentType<LucideProps>;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}

const BotonDeAjuste: React.FC<BotonDeAjusteProps> = ({
  label,
  Icon,
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'default',
}) => {
  const labelColor = variant === 'danger' ? 'text-error' : 'text-texto-principal';
  const iconColor = variant === 'danger' ? 'text-error' : 'text-primario';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        relative flex flex-col items-center justify-center
        aspect-square w-full max-w-[160px] min-h-[120px] p-4
        rounded-xl
        bg-tarjeta
        transition-all duration-150 ease-in-out
        disabled:opacity-60 disabled:pointer-events-none

        /* --- Efecto de Relieve (Outset) --- */
        shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]

        /* --- Efecto Hover y Focus --- */
        hover:brightness-110 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-fondo focus:ring-primario

        /* --- Efecto al Presionar (Active) --- */
        active:scale-95 active:brightness-90
        active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]
      `}
    >
      {isLoading ? (
        <Loader2 className="w-8 h-8 mb-2 animate-spin text-texto-secundario" />
      ) : (
        <Icon className={`w-8 h-8 mb-2 ${iconColor}`} />
      )}
      <span className={`text-sm text-center font-medium ${labelColor}`}>{label}</span>
    </button>
  );
};


export default function AjustesPage() {
  const router = useRouter();

  const {
    currentUser,
    fcmToken,
    requestNotificationPermission,
    disableNotifications,
    userError,
    clearUserSession,
    setUserError,
  } = useUserStore();

  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationLoading, setIsNotificationLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisableNotificationsModalOpen, setIsDisableNotificationsModalOpen] = useState(false);

  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');


  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (userError) {
      setError(userError);
      setUserError(null);
    }
  }, [userError, setUserError]);


  const handleLogout = async () => {
    setIsLoadingLogout(true);
    setError(null);
    try {
      await signOutUser();
      clearUserSession();
      router.replace('/login');
      toast.success("Has cerrado sesión exitosamente.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "No se pudo cerrar sesión.";
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoadingLogout(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.uid || !currentUser.rol || !currentUser.email) {
      setError("No hay un usuario activo o falta información del perfil (UID, Rol, Email) para eliminar.");
      return;
    }
    if (deleteEmailConfirm !== currentUser.email) {
      setError("La dirección de correo electrónico no coincide. Operación cancelada.");
      toast.error("La dirección de correo electrónico no coincide.");
      return;
    }
    if (!deletePassword) {
      setError("Se requiere contraseña para eliminar la cuenta. Operación cancelada.");
      toast.error("Se requiere contraseña para eliminar la cuenta.");
      return;
    }
    
    setIsLoadingDelete(true);
    setError(null);
    
    try {
      await performAccountDeletion(deletePassword, currentUser.uid, currentUser.rol as Role);
      clearUserSession();
      toast.success("Tu cuenta ha sido eliminada exitosamente.");
      router.replace('/login');
    } catch (err: unknown) {
      let errorMessage = "Ocurrió un error desconocido al intentar dar de baja la cuenta.";
      if (err instanceof Error) {
        if (err.message.includes('auth/wrong-password') || err.message.includes('auth/invalid-credential')) {
          errorMessage = "La contraseña ingresada es incorrecta. No se pudo verificar tu identidad.";
        } else if (err.message.includes('auth/requires-recent-login')) {
          errorMessage = "Esta operación requiere que hayas iniciado sesión recientemente. Por favor, cierra sesión y vuelve a ingresar antes de intentar borrar tu cuenta.";
        } else {
          errorMessage = `Error al dar de baja: ${err.message}`;
        }
      }
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoadingDelete(false);
    } finally {
        setIsDeleteModalOpen(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsNotificationLoading(true);
    setError(null);
    try {
      await disableNotifications();
      toast.success("Las notificaciones se han desactivado en este dispositivo.");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error al desactivar las notificaciones.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsNotificationLoading(false);
      setIsDisableNotificationsModalOpen(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    setIsNotificationLoading(true);
    setError(null);
    try {
      await requestNotificationPermission();
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationStatus(Notification.permission);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      // El error ya se setea en el store, no es necesario un toast aquí
    } finally {
      setIsNotificationLoading(false);
    }
  };

  const openDeleteModal = () => {
    setError(null);
    setDeleteEmailConfirm('');
    setDeletePassword('');
    setIsDeleteModalOpen(true);
  };


  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando datos del usuario o no estás autenticado...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 pb-28">
      <header className="flex items-center justify-between px-1 pt-2 pb-4 mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            selfieUrl={currentUser?.selfieURL ?? undefined}
            nombre={currentUser?.nombre}
            size={64}
          />
          <div>
            <h1 className="text-2xl font-bold text-texto-principal">Ajustes</h1>
            <p className="text-sm text-texto-secundario">
              {currentUser?.nombre ? `${currentUser.nombre} ${currentUser.apellido || ''}` : (currentUser?.email || 'Usuario')}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-8">
        
        <div className="p-4 bg-tarjeta rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-3 mb-4">
            Notificaciones Push
          </h2>
          {typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
              {notificationStatus === 'granted' && fcmToken && (
                <BotonDeAjuste
                  onClick={() => setIsDisableNotificationsModalOpen(true)}
                  isLoading={isNotificationLoading}
                  Icon={BellOff}
                  label="Desactivar"
                  variant="danger"
                />
              )}

              {(notificationStatus === 'default' || (notificationStatus === 'granted' && !fcmToken)) && (
                <BotonDeAjuste
                  onClick={handleRequestNotificationPermission}
                  isLoading={isNotificationLoading}
                  Icon={BellRing}
                  label="Activar"
                />
              )}
              
              {notificationStatus === 'denied' && (
                <div className="col-span-full flex items-center space-x-3 p-3 bg-orange-900/30 rounded-md text-sm text-orange-300">
                  <BellOff className="h-6 w-6 text-orange-400 flex-shrink-0" />
                  <p>Has bloqueado las notificaciones. Debes activarlas en los ajustes de tu navegador para usar esta función.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3 p-3 bg-yellow-900/30 rounded-md text-sm text-yellow-300">
              <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0" />
              <p>Tu navegador no es compatible con las notificaciones push.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-tarjeta rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-3 mb-4">
            Acciones de la Cuenta
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 justify-items-center">
            <BotonDeAjuste
              onClick={() => setIsLogoutModalOpen(true)}
              isLoading={isLoadingLogout}
              disabled={isLoadingDelete}
              Icon={LogOut}
              label="Cerrar Sesión"
            />
            <BotonDeAjuste
              onClick={openDeleteModal}
              isLoading={isLoadingDelete}
              disabled={isLoadingLogout}
              Icon={Trash2}
              label="Eliminar Cuenta"
              variant="danger"
            />
          </div>
        </div>
        
        {error && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-red-900/30 rounded-md text-sm text-red-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
            </div>
        )}
      </div>

      <button
        onClick={() => router.back()}
        aria-label="Volver a la página anterior"
        className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primario
                   bg-tarjeta shadow-[4px_4px_8px_rgba(0,0,0,0.3),-2px_-2px_6px_rgba(255,255,255,0.05)]
                   hover:brightness-110 active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]"
      >
        <ChevronLeftIcon className="h-7 w-7 text-primario" />
      </button>

      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => !isLoadingLogout && setIsLogoutModalOpen(false)}
        title="Cerrar Sesión"
      >
        <p className="text-sm text-texto-secundario">¿Estás seguro de que deseas cerrar sesión?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setIsLogoutModalOpen(false)} className="px-4 py-2 rounded-md text-texto-principal bg-white/10 hover:bg-white/20">Cancelar</button>
          <button type="button" onClick={handleLogout} disabled={isLoadingLogout} className="px-4 py-2 rounded-md text-white bg-primario hover:bg-primario-hover disabled:bg-primario-disabled flex items-center gap-2">
            {isLoadingLogout && <Loader2 className="h-5 w-5 animate-spin" />}
            Confirmar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isDisableNotificationsModalOpen}
        onClose={() => !isNotificationLoading && setIsDisableNotificationsModalOpen(false)}
        title="Desactivar Notificaciones"
      >
        <p className="text-sm text-texto-secundario">¿Estás seguro de que deseas desactivar las notificaciones push en este dispositivo?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setIsDisableNotificationsModalOpen(false)} className="px-4 py-2 rounded-md text-texto-principal bg-white/10 hover:bg-white/20">Cancelar</button>
          <button type="button" onClick={handleDisableNotifications} disabled={isNotificationLoading} className="px-4 py-2 rounded-md text-white bg-error hover:bg-red-700 flex items-center gap-2">
            {isNotificationLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            Sí, desactivar
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isLoadingDelete && setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación de Cuenta"
      >
        <form onSubmit={(e) => {
          e.preventDefault(); 
          handleDeleteAccount(); 
        }}>
          <div className="space-y-4">
            <p className="text-sm text-texto-secundario">
              Esta acción es <strong>permanente e irreversible</strong>. Todos tus datos serán eliminados.
              Para confirmar, escribe tu correo electrónico y tu contraseña.
            </p>
            <div className="space-y-3">
              <input
                type="email"
                value={deleteEmailConfirm}
                onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                placeholder={`Escribe tu email: ${currentUser.email}`}
                className="w-full p-2 rounded-md bg-fondo-input border border-borde-input focus:ring-2 focus:ring-primario placeholder:text-texto-secundario/50"
                disabled={isLoadingDelete}
                required
                autoComplete="email"
              />
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full p-2 rounded-md bg-fondo-input border border-borde-input focus:ring-2 focus:ring-primario"
                disabled={isLoadingDelete}
                required
                autoComplete="current-password"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={isLoadingDelete} 
                className="px-4 py-2 rounded-md text-texto-principal bg-white/10 hover:bg-white/20"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isLoadingDelete} 
                className="px-4 py-2 rounded-md text-white bg-error hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingDelete ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 size={18} />}
                Eliminar mi cuenta
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}