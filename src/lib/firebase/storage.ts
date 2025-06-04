// src/lib/firebase/storage.ts
import {
  ref,
  deleteObject,
  uploadBytes,
  getDownloadURL,
  getStorage,
  type UploadMetadata // Asegúrate de que UploadMetadata esté importado
} from 'firebase/storage';
import { storage } from './config'; // Tu instancia exportada de storage
import { FirebaseError } from 'firebase/app';

/**
 * Sube un archivo (Blob o File) a Firebase Storage y devuelve su URL de descarga.
 * @param file El archivo Blob o File a subir.
 * @param path La ruta completa en Storage donde se guardará el archivo (ej. 'capturas_anuncios/anuncioId/nombreArchivo.jpg').
 * @param metadata (Opcional) Metadatos para adjuntar al archivo subido.
 * @returns Promise<string> La URL de descarga del archivo.
 * @throws Si falla la subida, la obtención de la URL, o si los parámetros son inválidos.
 */
export const uploadFileAndGetURL = async (
  file: Blob | File,
  path: string,
  metadata?: UploadMetadata // <--- PARÁMETRO AÑADIDO
): Promise<string> => {
  if (!file) {
    console.error("uploadFileAndGetURL: El archivo para subir es nulo o indefinido.");
    throw new Error("El archivo para subir no puede ser nulo o indefinido.");
  }
  if (!path || path.trim() === "") {
    console.error("uploadFileAndGetURL: La ruta de destino en Storage está vacía.");
    throw new Error("La ruta de destino en Storage no puede estar vacía.");
  }

  const fileRef = ref(storage, path);

  try {
    console.log(`[uploadFileAndGetURL] Subiendo archivo a Storage en la ruta: ${path}. Metadatos adjuntos:`, metadata);
    // Pasa los metadatos a uploadBytes. Si metadata es undefined, no se añadirán.
    const snapshot = await uploadBytes(fileRef, file, metadata); // <--- METADATA USADO AQUÍ
    console.log('[uploadFileAndGetURL] Archivo subido con éxito. Obteniendo URL de descarga...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('[uploadFileAndGetURL] URL de descarga obtenida:', downloadURL);
    return downloadURL;
  } catch (error: unknown) {
    console.error(`[uploadFileAndGetURL] Error al subir archivo a ${path} o al obtener URL. Metadatos intentados:`, metadata, "Error Original:", error);
    if (error instanceof FirebaseError) {
      throw new Error(`Error de Firebase Storage (subida/URL en ${path}): ${error.message} (Código: ${error.code})`);
    }
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
    return;
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
        }
    } else {
         console.error(`Error inesperado (no de Firebase) al borrar selfie de Storage:`, error);
    }
  }
};

/**
 * Borra un archivo de Firebase Storage dada su URL de descarga.
 * Extrae la ruta del archivo desde la URL.
 * IMPORTANTE: Solo funciona con URLs de descarga estándar de Firebase Storage.
 * @param fileUrl La URL de descarga completa del archivo a borrar.
 * @returns Promise<void> Una promesa que se resuelve cuando se completa la operación.
 */
export const deleteFileByUrl = async (fileUrl: string): Promise<void> => {
  if (!fileUrl || !fileUrl.startsWith('https://firebasestorage.googleapis.com/')) {
    console.warn("deleteFileByUrl: URL inválida o no proporcionada:", fileUrl);
    return;
  }

  try {
    const storageInstance = getStorage();
    const fileRef = ref(storageInstance, fileUrl);

    console.log(`Intentando borrar archivo de Storage desde URL: ${fileUrl} (Referencia detectada: ${fileRef.fullPath})`);
    await deleteObject(fileRef);
    console.log(`Archivo borrado exitosamente de Storage: ${fileRef.fullPath}`);

  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      if (error.code === 'storage/object-not-found') {
        console.log(`Archivo no encontrado en Storage (URL: ${fileUrl}), probablemente ya fue borrado.`);
      } else if (error.code === 'storage/unauthorized') {
         console.error(`Error de Permiso: No autorizado para borrar el archivo en Storage (URL: ${fileUrl}). Revisa las reglas de Storage.`);
      } else {
        console.error(`Error de Firebase Storage al borrar archivo por URL (Código: ${error.code}):`, error.message);
      }
    } else {
      console.error(`Error inesperado (no de Firebase) al intentar borrar archivo por URL (${fileUrl}):`, error);
    }
  }
};