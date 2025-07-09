// src/app/(main)/ajustes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, type Role } from '@/store/userStore';
import { signOutUser, performAccountDeletion } from '@/lib/firebase/auth';

// Íconos unificados de lucide-react para consistencia y profesionalismo
import {
  Bell,
  BellOff,
  AlertTriangle,
  Palette,
  ChevronLeftIcon,
  ChevronRightIcon,
  LogOut,
  Trash2,
  BellRing,
  Loader2, // Ícono para el estado de carga
} from 'lucide-react';

import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';
import Avatar from '@/app/components/common/Avatar'; // Importamos el componente Avatar

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

  // Lógica de estado y hooks (SIN CAMBIOS)
  const currentUser = useUserStore((state) => state.currentUser);
  const fcmToken = useUserStore((state) => state.fcmToken);
  const requestNotificationPermission = useUserStore((state) => state.requestNotificationPermission);
  const notificationUserError = useUserStore((state) => state.userError);
  const clearUserSession = useUserStore((state) => state.clearUserSession);
  const setUserError = useUserStore((state) => state.setUserError);

  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationPermissionLoading, setIsNotificationPermissionLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (notificationUserError) {
      setError(notificationUserError);
      setUserError(null);
    }
  }, [notificationUserError, setUserError]);

  // Lógica de handlers (SIN CAMBIOS)
  const handleLogout = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      return;
    }
    setIsLoadingLogout(true);
    setError(null);
    try {
      await signOutUser();
      clearUserSession();
      router.replace('/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar sesión.");
      setIsLoadingLogout(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.uid || !currentUser.rol || !currentUser.email) {
      setError("No hay un usuario activo o falta información del perfil (UID, Rol, Email) para eliminar.");
      return;
    }
    const confirmDelete = window.prompt(`Esta acción es irreversible y borrará todos tus datos.\nPor favor, escribe tu dirección de correo electrónico para confirmar:\n(${currentUser.email})`);
    if (confirmDelete !== currentUser.email) {
      setError("La dirección de correo electrónico no coincide. Operación cancelada.");
      return;
    }
    const password = window.prompt("Para confirmar la eliminación de tu cuenta, por favor ingresa tu contraseña:");
    if (!password) {
      setError("Se requiere contraseña para eliminar la cuenta. Operación cancelada.");
      return;
    }
    setIsLoadingDelete(true);
    setError(null);
    try {
      await performAccountDeletion(password, currentUser.uid, currentUser.rol as Role);
      clearUserSession();
      alert("Tu cuenta ha sido eliminada exitosamente.");
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
      setIsLoadingDelete(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    setIsNotificationPermissionLoading(true);
    setError(null);
    await requestNotificationPermission();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
    setIsNotificationPermissionLoading(false);
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando datos del usuario o no estás autenticado...</p>
      </div>
    );
  }

  // --- RENDERIZADO CON EL ENCABEZADO ACTUALIZADO ---
  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 pb-28">

      {/* ====================================================== */}
      {/* INICIO ENCABEZADO ESTILO "BIENVENIDA"                  */}
      {/* ====================================================== */}
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
      {/* ====================================================== */}
      {/* FIN ENCABEZADO                                       */}
      {/* ====================================================== */}


      <div className="space-y-6">
        
        {/* === SECCIÓN NOTIFICACIONES PUSH (sin cambios) === */}
        <div className="p-4 bg-tarjeta rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-2">
            Notificaciones Push
          </h2>
          {typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator ? (
            <>
              {notificationStatus === 'granted' && fcmToken && (
                <div className="flex items-center space-x-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-md text-sm text-green-700 dark:text-green-300">
                  <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p>Las notificaciones push están activadas.</p>
                </div>
              )}
               {notificationStatus === 'granted' && !fcmToken && !isNotificationPermissionLoading && (
                 <div className="flex items-center space-x-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <p>Permiso concedido, pero hubo un problema al registrar tu dispositivo.</p>
                 </div>
               )}
              {notificationStatus === 'default' && (
                <ActionRow
                  onClick={handleRequestNotificationPermission}
                  isLoading={isNotificationPermissionLoading}
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

        {/* === SECCIÓN APARIENCIA (sin cambios) === */}
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

        {/* === SECCIÓN ACCIONES DE LA CUENTA (sin cambios) === */}
        <div className="bg-tarjeta rounded-lg shadow">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-2 p-4">
            Acciones de la Cuenta
          </h2>
          <div className="px-1 pb-1">
            <ActionRow
              onClick={handleLogout}
              isLoading={isLoadingLogout}
              disabled={isLoadingDelete}
              icon={<LogOut size={22} />}
              title="Cerrar Sesión"
              description="Saldrás de tu cuenta en este dispositivo."
            />
            <ActionRow
              onClick={handleDeleteAccount}
              isLoading={isLoadingDelete}
              disabled={isLoadingLogout}
              icon={<Trash2 size={22} />}
              title="Dar de baja mi cuenta"
              description="¡Advertencia! Esta acción es permanente."
              variant="danger"
            />
          </div>
        </div>
        
        {/* === ZONA DE ERRORES (sin cambios) === */}
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
    </div>
  );
}