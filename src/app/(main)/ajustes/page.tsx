// src/app/(main)/ajustes/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Necesario para redireccionar
import { useUserStore, type Role } from '@/store/userStore'; // Quitamos UserProfile si no se usa como tipo explícito aquí
import { signOutUser, performAccountDeletion } from '@/lib/firebase/auth';

import Button from '@/app/components/ui/Button';
import { Bell, BellOff, AlertTriangle, UserCog } from 'lucide-react'; // UserCog para el título

export default function AjustesPage() {
  const router = useRouter();

  // --- Selectores Individuales de Zustand ---
  const currentUser = useUserStore((state) => state.currentUser);
  const fcmToken = useUserStore((state) => state.fcmToken);
  const requestNotificationPermission = useUserStore((state) => state.requestNotificationPermission);
  const notificationUserError = useUserStore((state) => state.userError); // Error global del store
  const clearUserSession = useUserStore((state) => state.clearUserSession); // Para logout/delete
  const setUserError = useUserStore((state) => state.setUserError); // Para limpiar el error global si es necesario

  const [isLoadingLogout, setIsLoadingLogout] = useState(false);
  const [isLoadingDelete, setIsLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null); // Error local de la página

  const [isNotificationPermissionLoading, setIsNotificationPermissionLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission);
    }
    // Si quieres limpiar el error global del store al cargar esta página:
    // if (notificationUserError) {
    //   setUserError(null);
    // }
  }, []); // Solo se ejecuta al montar

  // Opcional: Si quieres que el error global se refleje en el error local
  // y luego se limpie del global para no persistir en otros lados.
  // Si prefieres mostrar notificationUserError directamente, puedes quitar este useEffect.
  useEffect(() => {
    if (notificationUserError) {
      setError(notificationUserError); // Copia el error global al local
      setUserError(null); // Limpia el error del store global
    }
  }, [notificationUserError, setUserError]);


  const handleLogout = async () => {
    if (!window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      return;
    }
    setIsLoadingLogout(true);
    setError(null);
    try {
      await signOutUser();
      clearUserSession(); // Limpia el estado del store
      router.replace('/login'); // Redirige
      console.log("AjustesPage: Cierre de sesión completado.");
    } catch (err: unknown) {
      console.error("AjustesPage: Error al cerrar sesión:", err);
      setError(err instanceof Error ? err.message : "No se pudo cerrar sesión.");
      setIsLoadingLogout(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser || !currentUser.uid || !currentUser.rol || !currentUser.email) {
      setError("No hay un usuario activo o falta información del perfil (UID, Rol, Email) para eliminar.");
      return;
    }

    const confirmDelete = window.prompt(
      "Esta acción es irreversible y borrará todos tus datos.\n" +
      "Por favor, escribe tu dirección de correo electrónico para confirmar:\n" +
      `(${currentUser.email})`
    );

    if (confirmDelete !== currentUser.email) {
      setError("La dirección de correo electrónico no coincide. Operación cancelada.");
      return;
    }

    const password = window.prompt(
      "Para confirmar la eliminación de tu cuenta, por favor ingresa tu contraseña:"
    );

    if (!password) {
      setError("Se requiere contraseña para eliminar la cuenta. Operación cancelada.");
      return;
    }

    setIsLoadingDelete(true);
    setError(null);

    try {
      await performAccountDeletion(password, currentUser.uid, currentUser.rol as Role);
      clearUserSession(); // Limpia el estado del store
      alert("Tu cuenta ha sido eliminada exitosamente.");
      router.replace('/login');
      console.log("AjustesPage: Solicitud de baja de cuenta procesada y sesión limpiada.");
    } catch (err: unknown) {
      console.error("AjustesPage: Error al dar de baja la cuenta:", err);
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
    setError(null); // Limpiar error local antes de la acción
    // La acción en el store debe manejar sus propios errores internos y setear `userError` en el store
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

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="flex items-center space-x-3 mb-6 p-4 bg-tarjeta rounded-lg shadow">
        <UserCog size={32} className="text-primario flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-texto-principal">
            Ajustes de Cuenta
          </h1>
          {currentUser.nombre && ( // Mostrar nombre y apellido si existen
             <p className="text-sm text-texto-secundario">
                {currentUser.nombre} {currentUser.apellido || ''}
             </p>
          )}
          <p className="text-sm text-texto-secundario break-all">{currentUser.email}</p>
          <p className="text-xs text-texto-secundario capitalize">Rol: {currentUser.rol}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* SECCIÓN NOTIFICACIONES PUSH */}
        <div className="p-4 bg-tarjeta rounded-lg shadow space-y-3">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-4">
            Notificaciones Push
          </h2>
          {typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator ? (
            <>
              {notificationStatus === 'granted' && fcmToken && (
                <div className="flex items-center space-x-2 p-3 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Las notificaciones push están activadas para este dispositivo.
                  </p>
                </div>
              )}

              {notificationStatus === 'granted' && !fcmToken && !isNotificationPermissionLoading && (
                 <div className="flex items-center space-x-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        Permiso concedido, pero podría haber un problema al registrar el token.
                        {/* El botón "Reintentar" que usaba variant="link" se quita para evitar el error. 
                            Si necesitas esta funcionalidad, puedes añadir un botón con una variante válida 
                            o un simple texto clickeable. */}
                    </p>
                 </div>
               )}

              {notificationStatus === 'default' && (
                <div>
                  <Button
                    onClick={handleRequestNotificationPermission}
                    isLoading={isNotificationPermissionLoading}
                    disabled={isNotificationPermissionLoading}
                    variant="primary" // Variante válida
                    fullWidth
                  >
                    {/* No se usa la prop 'icon' ya que no está definida en tu Button.tsx */}
                    Activar Notificaciones Push
                  </Button>
                  <p className="text-xs text-texto-secundario mt-1">
                    Recibe alertas importantes incluso cuando la app está cerrada.
                  </p>
                </div>
              )}

              {notificationStatus === 'denied' && (
                <div className="flex items-center space-x-2 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-md">
                  <BellOff className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Has bloqueado las notificaciones. Para activarlas, debes cambiar los permisos en la configuración de tu navegador para este sitio.
                  </p>
                </div>
              )}
              
              {/* Mostrar el error global del store (notificationUserError) si existe Y no hay un error local más específico */}
              {notificationUserError && !error && ( // Condición para evitar duplicar si el useEffect lo copió a 'error'
                   <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md mt-2">{notificationUserError}</p>
              )}
              {/* Mostrar el error local (que podría ser una copia del global si el useEffect está activo, o uno propio de esta página) */}
              {error && ( // Este mostrará el error si el useEffect lo copió, o si fue un error de logout/delete
                 <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md mt-2">{error}</p>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-2 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-md">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Tu navegador no es compatible con las notificaciones push o algo impidió su inicialización.
              </p>
            </div>
          )}
        </div>
        {/* FIN SECCIÓN NOTIFICACIONES PUSH */}

        <div className="p-4 bg-tarjeta rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold text-texto-principal border-b border-borde-tarjeta pb-2 mb-4">Acciones de la Cuenta</h2>
          
          <div>
            <Button 
              onClick={handleLogout} 
              isLoading={isLoadingLogout}
              disabled={isLoadingLogout || isLoadingDelete}
              variant="secondary" 
              fullWidth
            >
              {/* No se usa la prop 'icon' */}
              Cerrar Sesión
            </Button>
            <p className="text-xs text-texto-secundario mt-1">
              Saldrás de tu cuenta en este dispositivo.
            </p>
          </div>

          <div>
            <Button 
              onClick={handleDeleteAccount} 
              isLoading={isLoadingDelete}
              disabled={isLoadingLogout || isLoadingDelete}
              variant="danger"
              fullWidth
            >
              {/* No se usa la prop 'icon' */}
              Dar de baja mi cuenta
            </Button>
            <p className="text-xs text-error mt-1">
              ¡Advertencia! Esta acción es permanente y borrará todos tus datos.
            </p>
          </div>

          {/* El error local ya se muestra en la sección de notificaciones si el useEffect está activo,
              o aquí si es un error específico de logout/delete y el useEffect no lo sobrescribe.
              Para simplificar, el 'error' ya incluye el notificationUserError si el useEffect lo copió.
              Si quitaste el useEffect que copia el error, entonces necesitarías mostrar notificationUserError
              y localPageError (renombrando 'error' a 'localPageError') por separado aquí.
              Con el useEffect que copia Y LUEGO LIMPIA el error global, el 'error' local
              es suficiente para los errores que deben persistir en esta página.
           */}
          {/* {error && (
            <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/30 p-3 rounded-md">{error}</p>
          )} */}
          {/* El 'error' se muestra arriba, en la sección de notificaciones. Si deseas un área separada
              para errores de logout/delete, puedes usar una variable de estado diferente
              o refinar la lógica de visualización de 'error'. */}
        </div>
      </div>
    </div>
  );
}