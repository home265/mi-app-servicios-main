// src/lib/firebase/storage.ts
import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
  getStorage // <--- AÑADIDO: getStorage
} from 'firebase/storage';
import { storage } from './config'; // Tu instancia exportada de storage
import { FirebaseError } from 'firebase/app';

/**
 * Sube un archivo (Blob o File) a Firebase Storage y devuelve su URL de descarga.
 * @param file El archivo Blob o File a subir.
 * @param path La ruta completa en Storage donde se guardará el archivo (ej. 'capturas_anuncios/anuncioId/nombreArchivo.jpg').
 * @returns Promise<string> La URL de descarga del archivo.
 * @throws Si falla la subida, la obtención de la URL, o si los parámetros son inválidos.
 */
export const uploadFileAndGetURL = async (file: Blob | File, path: string): Promise<string> => {
  if (!file) {
    // console.error("uploadFileAndGetURL: El archivo para subir es nulo o indefinido."); // Para depuración
    throw new Error("El archivo para subir no puede ser nulo o indefinido.");
  }
  if (!path || path.trim() === "") {
    // console.error("uploadFileAndGetURL: La ruta de destino en Storage está vacía."); // Para depuración
    throw new Error("La ruta de destino en Storage no puede estar vacía.");
  }

  // Usamos la instancia 'storage' que ya tienes configurada e importada
  const fileRef = ref(storage, path);

  try {
    // console.log(`Subiendo archivo a Storage en la ruta: ${path}`); // Para depuración
    const snapshot = await uploadBytes(fileRef, file);
    // console.log('Archivo subido con éxito. Obteniendo URL de descarga...'); // Para depuración
    const downloadURL = await getDownloadURL(snapshot.ref);
    // console.log('URL de descarga obtenida:', downloadURL); // Para depuración
    return downloadURL;
  } catch (error: unknown) {
    // console.error(`Error al subir archivo a ${path} o al obtener URL:`, error); // Para depuración
    if (error instanceof FirebaseError) {
      // Puedes ser más específico con los códigos de error de Storage si es necesario.
      // Por ejemplo, error.code === 'storage/unauthorized' o 'storage/canceled'
      throw new Error(`Error de Firebase Storage (subida/URL en ${path}): ${error.message} (Código: ${error.code})`);
    }
    // Para otros tipos de errores o si quieres ser más genérico:
    throw new Error(`Error desconocido durante la subida del archivo a ${path} o la obtención de la URL.`);
  }
};

/**
 * Borra la foto de perfil (selfie) del usuario de Firebase Storage.
 * @param uid El UID del usuario cuya selfie se borrará.
 * @returns Promise<void>
 * No lanza error si el archivo no existe, según la documentación de deleteObject.
 */
export const deleteUserSelfie = async (uid: string): Promise<void> => {
  if (!uid) {
    console.warn("deleteUserSelfie: No se proporcionó UID.");
    return; // No hacer nada si no hay UID
  }
  const selfieRef = ref(storage, `selfies/${uid}/profile.jpg`);

  try {
    await deleteObject(selfieRef);
    console.log(`Selfie de usuario borrada de Storage (selfies/${uid}/profile.jpg) exitosamente.`);
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
        if (error.code === 'storage/object-not-found') {
             console.log(`Selfie de usuario (selfies/${uid}/profile.jpg) no encontrada en Storage, no se requiere borrado.`);
        } else {
            console.error(`Error de Firebase Storage al borrar selfie (Código: ${error.code}):`, error.message);
            // Considera si quieres relanzar el error aquí para que el llamador lo maneje
            // throw error; // Por ejemplo
        }
    } else {
         console.error(`Error inesperado (no de Firebase) al borrar selfie de Storage:`, error);
         // Considera si quieres relanzar un error genérico
         // throw new Error("Error inesperado al borrar la foto de perfil.");
    }
  }
};

// --- INICIO NUEVA FUNCIÓN ---
/**
 * Borra un archivo de Firebase Storage dada su URL de descarga.
 * Extrae la ruta del archivo desde la URL.
 * IMPORTANTE: Solo funciona con URLs de descarga estándar de Firebase Storage.
 * @param fileUrl La URL de descarga completa del archivo a borrar.
 * @returns Promise<void> Una promesa que se resuelve cuando se completa la operación.
 */
export const deleteFileByUrl = async (fileUrl: string): Promise<void> => {
  // Verificación básica de la URL
  if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com/')) {
    console.warn("deleteFileByUrl: URL inválida o no proporcionada:", fileUrl);
    // Decidimos no lanzar un error, simplemente no hacer nada si la URL no es válida.
    // Podrías lanzar un error si prefieres: throw new Error('URL inválida');
    return;
  }

  try {
    // Obtener la instancia de storage (podríamos usar la importada 'storage' también)
    // Usar getStorage() es útil si esta función se moviera a un lugar donde 'storage' no está importado directamente.
    const storageInstance = getStorage();

    // Firebase SDK v9 puede crear una referencia directamente desde la URL de descarga
    const fileRef = ref(storageInstance, fileUrl);

    console.log(`Intentando borrar archivo de Storage desde URL: ${fileUrl} (Referencia detectada: ${fileRef.fullPath})`);
    await deleteObject(fileRef);
    console.log(`Archivo borrado exitosamente de Storage: ${fileRef.fullPath}`);

  } catch (error: unknown) {
    // Manejo de errores específico para Firebase
    if (error instanceof FirebaseError) {
      // El error más común y esperado si intentamos borrar algo que ya no existe
      if (error.code === 'storage/object-not-found') {
        console.log(`Archivo no encontrado en Storage (URL: ${fileUrl}), probablemente ya fue borrado.`);
      // Podrías querer loguear otros errores de Storage de forma diferente
      } else if (error.code === 'storage/unauthorized') {
         console.error(`Error de Permiso: No autorizado para borrar el archivo en Storage (URL: ${fileUrl}). Revisa las reglas de Storage.`);
      } else {
        // Otros errores de Firebase Storage
        console.error(`Error de Firebase Storage al borrar archivo por URL (Código: ${error.code}):`, error.message);
      }
      // En general, para borrados de limpieza, podríamos no querer que un fallo aquí detenga todo el flujo.
      // No relanzamos el error (no hacemos 'throw error;')
    } else {
      // Errores que no son de Firebase
      console.error(`Error inesperado (no de Firebase) al intentar borrar archivo por URL (${fileUrl}):`, error);
      // Tampoco relanzamos
    }
  }
};
// --- FIN NUEVA FUNCIÓN ---