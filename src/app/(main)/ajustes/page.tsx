// src/app/(main)/ajustes/page.tsx
'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, type Role } from '@/store/userStore';
import { signOutUser, performAccountDeletion } from '@/lib/firebase/auth';
import { toast } from 'react-hot-toast';

// Íconos unificados de lucide-react para consistencia y profesionalismo
import {
  BellOff,
  AlertTriangle,
  Palette,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOut,
  Trash2,
  BellRing,
  Loader2,
} from 'lucide-react';

import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';
import Avatar from '@/app/components/common/Avatar';
import Modal from '@/app/components/common/Modal'; // <-- IMPORTADO TU MODAL

// --- COMPONENTE INTERNO PARA LAS FILAS DE ACCIONES (sin cambios) ---
const ActionRow: React.FC<{
  onClick: () => void;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
}> = ({ onClick, title, description, icon, isLoading = false, disabled = false, variant = 'default' }) => {
  const textColor = variant === 'danger' ? 'text-error' : 'text-texto-principal';
  const iconColor = variant === 'danger' ? 'text-error' : 'text-primario';

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full text-left p-3 flex items-center gap-4 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none group"
    >
      <div className={`flex-shrink-0 ${iconColor}`}>{icon}</div>
      <div className="flex-grow">
        <p className={`font-medium ${textColor}`}>{title}</p>
        <p className="text-xs text-texto-secundario">{description}</p>
      </div>
      <div className="flex-shrink-0">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-texto-secundario" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-texto-secundario transition-transform duration-200 group-hover:translate-x-1" />
        )}
      </div>
    </button>
  );
};


export default function AjustesPage() {
  const router = useRouter();

  // --- LÓGICA DE ESTADO Y HOOKS (sin cambios en lo existente) ---
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
  
  // --- NUEVOS ESTADOS PARA CONTROLAR LOS MODALES ---
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDisableNotificationsModalOpen, setIsDisableNotificationsModalOpen] = useState(false);

  // --- NUEVOS ESTADOS PARA LOS INPUTS DEL MODAL DE BORRADO ---
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


  // --- HANDLERS REFACTORIZADOS PARA USAR MODALES Y TOASTS ---

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
    // El estado de carga se resetea por si mismo al desmontar el componente al redirigir
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
        // Cierra el modal independientemente del resultado
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

  // El handler para activar notificaciones no usaba confirm/alert, se mantiene igual
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

  // Pre-flight para abrir el modal de borrado, reseteando los campos
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
      {/* --- ENCABEZADO (sin cambios) --- */}
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

      <div className="space-y-6">
        
        {/* --- SECCIÓN NOTIFICACIONES PUSH (lógica del botón modificada) --- */}
        <div className="p-4 bg-tarjeta rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-2">
            Notificaciones Push
          </h2>
          {typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator ? (
            <>
              {notificationStatus === 'granted' && fcmToken && (
                <ActionRow
                  onClick={() => setIsDisableNotificationsModalOpen(true)} // <-- MODIFICADO
                  isLoading={isNotificationLoading}
                  icon={<BellOff size={22} />}
                  title="Desactivar Notificaciones Push"
                  description="Dejarás de recibir alertas en este dispositivo."
                  variant="danger"
                />
              )}

              {(notificationStatus === 'default' || (notificationStatus === 'granted' && !fcmToken)) && (
                <ActionRow
                  onClick={handleRequestNotificationPermission}
                  isLoading={isNotificationLoading}
                  icon={<BellRing size={22} />}
                  title="Activar Notificaciones Push"
                  description="Recibe alertas importantes incluso cuando la app está cerrada."
                />
              )}
              
              {notificationStatus === 'denied' && (
                <div className="flex items-center space-x-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-md text-sm text-orange-700 dark:text-orange-300">
                  <BellOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p>Has bloqueado las notificaciones. Debes activarlas en los ajustes de tu navegador.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p>Tu navegador no es compatible con las notificaciones push.</p>
            </div>
          )}
        </div>

        {/* --- SECCIÓN APARIENCIA (sin cambios) --- */}
        <div className="p-4 bg-tarjeta rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-2">
            Apariencia
          </h2>
          <div className="flex items-center justify-between py-2 px-3">
            <div className="flex items-center gap-4">
              <Palette className="text-primario" size={22} />
              <p className="font-medium text-texto-principal">Tema de la aplicación</p>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {/* --- SECCIÓN ACCIONES DE LA CUENTA (lógica de botones modificada) --- */}
        <div className="bg-tarjeta rounded-lg shadow">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-2 p-4">
            Acciones de la Cuenta
          </h2>
          <div className="px-1 pb-1">
            <ActionRow
              onClick={() => setIsLogoutModalOpen(true)} // <-- MODIFICADO
              isLoading={isLoadingLogout}
              disabled={isLoadingDelete}
              icon={<LogOut size={22} />}
              title="Cerrar Sesión"
              description="Saldrás de tu cuenta en este dispositivo."
            />
            <ActionRow
              onClick={openDeleteModal} // <-- MODIFICADO
              isLoading={isLoadingDelete}
              disabled={isLoadingLogout}
              icon={<Trash2 size={22} />}
              title="Dar de baja mi cuenta"
              description="¡Advertencia! Esta acción es permanente."
              variant="danger"
            />
          </div>
        </div>
        
        {/* --- ZONA DE ERRORES (sin cambios) --- */}
        {error && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-red-100/80 dark:bg-red-900/30 rounded-md text-sm text-red-700 dark:text-red-200">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
            </div>
        )}
      </div>

      {/* --- BOTÓN FLOTANTE (sin cambios) --- */}
      <button
        onClick={() => router.back()}
        aria-label="Volver a la página anterior"
        className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primario"
        style={{ backgroundColor: 'var(--color-tarjeta)', border: '1px solid var(--color-borde-tarjeta)' }}
      >
        <ChevronLeftIcon className="h-7 w-7" style={{ color: 'var(--color-primario)' }} />
      </button>

      {/* --- NUEVOS MODALES DE CONFIRMACIÓN --- */}

      {/* Modal para Cerrar Sesión */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => !isLoadingLogout && setIsLogoutModalOpen(false)}
        title="Cerrar Sesión"
      >
        <p className="text-sm text-texto-secundario">¿Estás seguro de que deseas cerrar sesión?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setIsLogoutModalOpen(false)} className="px-4 py-2 rounded-md text-texto-principal bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20">Cancelar</button>
          <button type="button" onClick={handleLogout} disabled={isLoadingLogout} className="px-4 py-2 rounded-md text-white bg-primario hover:bg-primario-hover disabled:bg-primario-disabled flex items-center gap-2">
            {isLoadingLogout && <Loader2 className="h-5 w-5 animate-spin" />}
            Confirmar
          </button>
        </div>
      </Modal>

      {/* Modal para Desactivar Notificaciones */}
      <Modal
        isOpen={isDisableNotificationsModalOpen}
        onClose={() => !isNotificationLoading && setIsDisableNotificationsModalOpen(false)}
        title="Desactivar Notificaciones"
      >
        <p className="text-sm text-texto-secundario">¿Estás seguro de que deseas desactivar las notificaciones push en este dispositivo?</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setIsDisableNotificationsModalOpen(false)} className="px-4 py-2 rounded-md text-texto-principal bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20">Cancelar</button>
          <button type="button" onClick={handleDisableNotifications} disabled={isNotificationLoading} className="px-4 py-2 rounded-md text-white bg-error hover:bg-red-700 flex items-center gap-2">
            {isNotificationLoading && <Loader2 className="h-5 w-5 animate-spin" />}
            Sí, desactivar
          </button>
        </div>
      </Modal>

       {/* Modal para Dar de Baja la Cuenta */}
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
                autoComplete="email" // <-- AÑADIDO
              />
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full p-2 rounded-md bg-fondo-input border border-borde-input focus:ring-2 focus:ring-primario"
                disabled={isLoadingDelete}
                required
                autoComplete="current-password" // <-- AÑADIDO
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsDeleteModalOpen(false)} 
                disabled={isLoadingDelete} 
                className="px-4 py-2 rounded-md text-texto-principal bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20"
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