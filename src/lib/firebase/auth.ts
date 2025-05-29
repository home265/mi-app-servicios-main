// src/lib/firebase/auth.ts
import { 
    signOut, 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    deleteUser,
    AuthError
  } from 'firebase/auth';
  import { auth } from './config'; // Tu instancia exportada de auth
  import { deleteUserProfile } from './firestore'; 
  import { deleteUserSelfie } from './storage';   
  import { useUserStore } from '@/store/userStore';
  /**
   * Cierra la sesión del usuario actual en Firebase.
   * Limpia también el estado local del usuario.
   */
  export const signOutUser = async (): Promise<void> => {
    const { clearUserSession } = useUserStore.getState(); // Acceder al estado/acciones fuera de un componente
    try {
      await signOut(auth);
      console.log("Usuario cerró sesión en Firebase exitosamente.");
      clearUserSession(); // Limpiar el estado global
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Opcional: mostrar un error al usuario
      throw error; // Re-lanzar el error para que el componente UI lo maneje
    }
  };
  
  /**
   * Reautentica al usuario actual usando su contraseña.
   * Necesario para operaciones sensibles como cambiar email/contraseña o borrar cuenta.
   * @param password La contraseña actual del usuario.
   * @returns Promise<void>
   * @throws Si la reautenticación falla.
   */
  export const reauthenticateUser = async (password: string): Promise<void> => {
    const user = auth.currentUser;
    if (!user || !user.email) {
      throw new Error("No hay usuario autenticado o falta el email para reautenticar.");
    }
  
    const credential = EmailAuthProvider.credential(user.email, password);
  
    try {
      await reauthenticateWithCredential(user, credential);
      console.log("Usuario reautenticado exitosamente.");
    } catch (error) {
      console.error("Error en la reautenticación:", error);
      const authError = error as AuthError;
      if (authError.code === 'auth/wrong-password') {
          throw new Error("La contraseña ingresada es incorrecta.");
      } else if (authError.code === 'auth/user-mismatch') {
           throw new Error("Las credenciales no corresponden al usuario actual.");
      } else if (authError.code === 'auth/too-many-requests'){
           throw new Error("Demasiados intentos fallidos. Intenta más tarde.");
      }
      throw new Error("Error al reautenticar."); // Error genérico
    }
  };
  
  
  /**
   * Borra la cuenta del usuario actual de Firebase Authentication.
   * IMPORTANTE: Requiere que el usuario haya sido reautenticado recientemente.
   * Esta función debe llamarse DESPUÉS de reauthenticateUser().
   * @returns Promise<void>
   * @throws Si el borrado falla.
   */
  export const deleteCurrentUserAccount = async (): Promise<void> => {
     const user = auth.currentUser;
     if (!user) {
      throw new Error("No hay usuario autenticado para borrar.");
     }
     
     try {
         await deleteUser(user);
         console.log("Usuario borrado de Firebase Authentication exitosamente.");
     } catch (error) {
         console.error("Error al borrar usuario de Firebase Auth:", error);
         const authError = error as AuthError;
         if (authError.code === 'auth/requires-recent-login') {
             throw new Error("Esta operación requiere inicio de sesión reciente. Por favor, vuelve a ingresar tu contraseña.");
         }
         throw new Error("No se pudo borrar la cuenta de autenticación."); // Error genérico
     }
  }
  
  /**
 * Orquesta el proceso completo de borrado de cuenta:
 * 1. Reautentica al usuario con su contraseña.
 * 2. Borra el perfil de Firestore.
 * 3. Borra la selfie de Storage.
 * 4. Borra la cuenta de Firebase Auth.
 * 5. Limpia el estado local.
 * @param password La contraseña del usuario para reautenticar.
 * @param uid El UID del usuario.
 * @param rol El rol del usuario.
 * @returns Promise<void>
 * @throws Si algún paso falla.
 */
export const performAccountDeletion = async (password: string, uid: string, rol: string): Promise<void> => {
    const { clearUserSession } = useUserStore.getState();
    
    if (!uid || !rol) {
        throw new Error("UID o Rol faltante para el borrado de cuenta.");
    }

    console.log("Iniciando proceso de borrado de cuenta para UID:", uid);

    try {
        // 1. Reautenticar (Lanza error si falla)
        console.log("Paso 1: Reautenticando usuario...");
        await reauthenticateUser(password);
        console.log("Paso 1: Reautenticación exitosa.");

        // Si la reautenticación fue exitosa, proceder con los borrados.
        // Usar Promise.allSettled para intentar borrar Firestore y Storage, incluso si uno falla.
        console.log("Paso 2 y 3: Intentando borrar perfil de Firestore y selfie de Storage...");
        const results = await Promise.allSettled([
            deleteUserProfile(uid, rol),
            deleteUserSelfie(uid)
        ]);

        // Registrar resultados de borrado de datos (opcional)
        results.forEach((result, index) => {
            const action = index === 0 ? 'Firestore deleteUserProfile' : 'Storage deleteUserSelfie';
            if (result.status === 'fulfilled') {
                console.log(`${action} completado.`);
            } else {
                console.error(`${action} falló:`, result.reason);
                // DECISIÓN: ¿Continuar con el borrado de Auth si fallan estos? 
                // Por lo general, sí, para que el usuario no pueda volver a entrar.
            }
        });
        
        // 4. Borrar de Firebase Auth (Lanza error si falla)
        console.log("Paso 4: Borrando usuario de Firebase Authentication...");
        await deleteCurrentUserAccount();
        console.log("Paso 4: Borrado de Firebase Authentication exitoso.");

        // 5. Limpiar estado local (esto debería hacerse incluso si algún paso anterior falló, para desloguear al usuario)
        console.log("Paso 5: Limpiando sesión local...");
        clearUserSession();
        console.log("Paso 5: Sesión local limpiada.");

        console.log("Proceso de borrado de cuenta completado.");

    } catch (error) {
        console.error("Fallo en el proceso de borrado de cuenta:", error);
        // Asegurarse de que la sesión local se limpie si el borrado de Auth falló pero la reautenticación no
        // aunque `deleteCurrentUserAccount` ya debería haber lanzado un error específico.
        // Limpiar la sesión podría ser contraproducente si el usuario necesita reintentar.
        // Mejor solo re-lanzar el error para que la UI lo maneje.
        throw error; // Re-lanzar para que la UI sepa que falló
    }
};