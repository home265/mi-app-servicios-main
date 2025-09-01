// src/lib/firebase/firestore.ts
import { doc, deleteDoc, getDoc, DocumentSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db } from './config'; // Tu instancia exportada de firestore (db)
import { deleteField } from 'firebase/firestore'; 

// Lista de posibles colecciones de usuarios (mantener consistente con Providers.tsx)
const USER_COLLECTIONS = ['usuarios_generales', 'prestadores', 'comercios'];

/**
 * Determina la colección correcta para un usuario basado en su rol o intentando encontrar el documento.
 * @param uid El UID del usuario.
 * @param rol (Opcional) El rol conocido del usuario.
 * @returns El nombre de la colección donde se encontró el usuario, o null.
 */
async function findUserCollection(uid: string, rol?: string): Promise<string | null> {
    if (rol) {
        switch (rol) {
            case 'prestador': return 'prestadores';
            case 'comercio': return 'comercios';
            case 'usuario': // Asumiendo que 'usuario' mapea a 'usuarios_generales'
            default: return 'usuarios_generales';
        }
    } else {
        // Si no se conoce el rol, intentar buscar en las colecciones
        console.warn("findUserCollection: No se proporcionó rol, buscando en todas las colecciones...");
        for (const collectionName of USER_COLLECTIONS) {
            const docRef = doc(db, collectionName, uid);
            const docSnap: DocumentSnapshot = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log(`findUserCollection: Usuario encontrado en ${collectionName}`);
                return collectionName;
            }
        }
        return null; // No encontrado
    }
}


/**
 * Borra el documento de perfil de usuario de la colección correcta en Firestore.
 * @param uid El UID del usuario a borrar.
 * @param rol (Opcional pero recomendado) El rol del usuario para encontrar la colección rápidamente.
 * @returns Promise<void>
 * @throws Si no se encuentra la colección o falla el borrado.
 */
export const deleteUserProfile = async (uid: string, rol?: string): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);
  
  if (!collectionName) {
      console.error(`No se pudo determinar la colección para el usuario con UID: ${uid}`);
      // Podríamos no lanzar un error si el documento ya no existe, pero deleteDoc no falla si no existe.
      // Depende de cómo quieras manejarlo. Por ahora, lanzaremos un error si no se sabe la colección.
      throw new Error("No se pudo encontrar la colección del perfil de usuario.");
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    // Verificar si existe antes de borrar podría ser útil, pero deleteDoc no falla si no existe.
    await deleteDoc(userDocRef);
    console.log(`Documento de usuario borrado de Firestore (${collectionName}/${uid}) exitosamente.`);
  } catch (error) {
    console.error(`Error al borrar documento de usuario de Firestore (${collectionName}/${uid}):`, error);
    throw new Error("Error al borrar el perfil de la base de datos."); // Error genérico
  }
};


// --- INICIO: NUEVA FUNCIÓN AÑADIDA ---

/**
 * Actualiza el PIN hasheado de un usuario en su documento de Firestore.
 * @param uid El UID del usuario cuyo PIN se actualizará.
 * @param rol El rol del usuario, necesario para encontrar la colección correcta.
 * @param newHashedPin El nuevo PIN ya procesado con hash que se guardará.
 * @returns Promise<void>
 * @throws Si no se encuentra la colección del usuario o si falla la actualización.
 */
export const updateUserPin = async (uid: string, rol: string, newHashedPin: string): Promise<void> => {
  // Reutilizamos la función existente para encontrar la colección del usuario.
  const collectionName = await findUserCollection(uid, rol);
  
  if (!collectionName) {
      throw new Error(`No se pudo encontrar la colección para el usuario con UID: ${uid} para actualizar el PIN.`);
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    // Usamos updateDoc para modificar el campo específico del PIN.
    await updateDoc(userDocRef, {
      hashedPin: newHashedPin // Asegúrate que este nombre de campo ('hashedPin') coincida con el de tu base de datos.
    });
    console.log(`PIN actualizado exitosamente en Firestore para el usuario ${uid} en la colección ${collectionName}.`);
  } catch (error) {
    console.error(`Error al actualizar el PIN en Firestore (${collectionName}/${uid}):`, error);
    throw new Error("No se pudo actualizar el PIN en la base de datos.");
  }
};
// --- FIN: NUEVA FUNCIÓN AÑADIDA ---
/**
 * Elimina el token de notificación (FCM Token) y su timestamp del perfil de un usuario en Firestore.
 */
export const deleteUserFCMToken = async (uid: string, rol: string): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);

  if (!collectionName) {
    throw new Error(`No se pudo encontrar la colección para el usuario con UID: ${uid} para eliminar el token FCM.`);
  }

  const userDocRef = doc(db, collectionName, uid);

  try {
    await updateDoc(userDocRef, {
      fcmToken: deleteField(),
      fcmTokenTimestamp: deleteField()
    });
    console.log(`Token FCM eliminado exitosamente de Firestore para el usuario ${uid}.`);
  } catch (error) {
    console.error(`Error al eliminar el token FCM en Firestore (${collectionName}/${uid}):`, error);
    throw new Error("No se pudo desactivar las notificaciones.");
  }
};

/* ========================================================================== */
/* ====================== NUEVO: PERFIL FISCAL (helpers) ==================== */
/* ========================================================================== */

import type { InformacionFiscal } from '@/types/informacionFiscal';

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

function isInformacionFiscal(x: unknown): x is InformacionFiscal {
  return (
    isObject(x) &&
    typeof (x as { razonSocial?: unknown }).razonSocial === 'string' &&
    ((x as { estado?: unknown }).estado === 'ACTIVO' || (x as { estado?: unknown }).estado === 'INACTIVO')
  );
}

/**
 * Crea o actualiza el perfil fiscal en la subcolección:
 *   <colección>/<uid>/informacionFiscal/current
 */
export const upsertUserInformacionFiscal = async (
  uid: string,
  rol: string,
  info: InformacionFiscal
): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);
  if (!collectionName) {
    throw new Error(`No se encontró la colección del usuario ${uid} para guardar informacionFiscal.`);
  }

  const fiscalRef = doc(db, collectionName, uid, 'informacionFiscal', 'current');

  try {
    await setDoc(fiscalRef, info, { merge: true });
    console.log(`informacionFiscal/current actualizada para ${collectionName}/${uid}.`);
  } catch (error) {
    console.error(`Error al guardar informacionFiscal (${collectionName}/${uid}):`, error);
    throw new Error('No se pudo guardar la información fiscal.');
  }
};

/**
 * Lee el perfil fiscal desde la subcolección:
 *   <colección>/<uid>/informacionFiscal/current
 * Devuelve null si no existe.
 */
export const getUserInformacionFiscal = async (
  uid: string,
  rol?: string
): Promise<InformacionFiscal | null> => {
  const collectionName = await findUserCollection(uid, rol);
  if (!collectionName) {
    console.warn(`No se encontró la colección del usuario ${uid} para leer informacionFiscal.`);
    return null;
  }

  const fiscalRef = doc(db, collectionName, uid, 'informacionFiscal', 'current');
  try {
    const snap = await getDoc(fiscalRef);
    if (!snap.exists()) return null;
    const data = snap.data();
    return isInformacionFiscal(data) ? (data as InformacionFiscal) : null;
  } catch (error) {
    console.error(`Error al leer informacionFiscal (${collectionName}/${uid}):`, error);
    return null;
  }
};

/**
 * Actualiza las preferencias de envío del comprobante fiscal sin tocar otros campos.
 */
export const updateUserPreferenciasEnvio = async (
  uid: string,
  rol: string,
  prefs: { email?: boolean; whatsapp?: boolean }
): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);
  if (!collectionName) {
    throw new Error(`No se encontró la colección del usuario ${uid} para actualizar preferenciasEnvio.`);
  }

  const fiscalRef = doc(db, collectionName, uid, 'informacionFiscal', 'current');

  const payload: Record<string, boolean> = {};
  if (typeof prefs.email === 'boolean') payload['preferenciasEnvio.email'] = prefs.email;
  if (typeof prefs.whatsapp === 'boolean') payload['preferenciasEnvio.whatsapp'] = prefs.whatsapp;

  try {
    await updateDoc(fiscalRef, payload);
    console.log(`preferenciasEnvio actualizadas para ${collectionName}/${uid}.`);
  } catch (error) {
    console.error(`Error al actualizar preferenciasEnvio (${collectionName}/${uid}):`, error);
    throw new Error('No se pudieron actualizar las preferencias de envío.');
  }
};

/* ========================================================================== */
/* ============ NUEVO: PERFIL FISCAL (documento 'perfil' anidado) =========== */
/* ========================================================================== */

import type { PerfilFiscal } from '@/types/perfilFiscal';

function isViaVerificacion(x: unknown): x is 'cuit_padron' | 'cuil_nombre' {
  return x === 'cuit_padron' || x === 'cuil_nombre';
}

function isReceptorParaFactura(x: unknown): x is 'CUIT' | 'CONSUMIDOR_FINAL' {
  return x === 'CUIT' || x === 'CONSUMIDOR_FINAL';
}

function isCondicionImpositivaMin(x: unknown): x is
  | 'RESPONSABLE_INSCRIPTO'
  | 'MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL'
  | 'NO_CATEGORIZADO' {
  return (
    x === 'RESPONSABLE_INSCRIPTO' ||
    x === 'MONOTRIBUTO' ||
    x === 'EXENTO' ||
    x === 'CONSUMIDOR_FINAL' ||
    x === 'NO_CATEGORIZADO'
  );
}

function isOptionalStringOrNull(x: unknown): x is string | null | undefined {
  return typeof x === 'string' || x === null || typeof x === 'undefined';
}

function isProveedorPerfil(x: unknown): x is NonNullable<PerfilFiscal['proveedor']> {
  if (!isObject(x)) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.tusFacturasClienteId === 'undefined') return true;
  return typeof o.tusFacturasClienteId === 'string';
}

function isPerfilFiscal(x: unknown): x is PerfilFiscal {
  if (!isObject(x)) return false;
  const o = x as Record<string, unknown>;

  if (!isViaVerificacion(o.viaVerificacion)) return false;
  if (!isReceptorParaFactura(o.receptorParaFactura)) return false;

  if (typeof o.emailReceptor !== 'string') return false;
  if (typeof o.verifiedAt !== 'string') return false;
  if (o.cuitGuardado !== 'none') return false;

  if (!isOptionalStringOrNull(o.razonSocial)) return false;
  if (!(typeof o.condicionImpositiva === 'undefined' || o.condicionImpositiva === null || isCondicionImpositivaMin(o.condicionImpositiva))) {
    return false;
  }
  if (!isOptionalStringOrNull(o.domicilio)) return false;
  if (!isOptionalStringOrNull(o.localidad)) return false;
  if (!isOptionalStringOrNull(o.provincia)) return false;
  if (!isOptionalStringOrNull(o.codigopostal)) return false;

  if (!(typeof o.proveedor === 'undefined' || isProveedorPerfil(o.proveedor))) return false;

  return true;
}

/**
 * Escribe el documento PERFIL (no sensible) en:
 *   <colección>/<uid>/informacionFiscal/current  bajo el campo 'perfil'
 * No afecta los campos raíz usados por InformacionFiscal.
 */
export const upsertUserPerfilFiscal = async (
  uid: string,
  rol: string,
  perfil: PerfilFiscal
): Promise<void> => {
  const collectionName = await findUserCollection(uid, rol);
  if (!collectionName) {
    throw new Error(`No se encontró la colección del usuario ${uid} para guardar el perfil fiscal.`);
  }

  const ref = doc(db, collectionName, uid, 'informacionFiscal', 'current');

  try {
    // Guardamos bajo el campo 'perfil' para no interferir con la estructura previa.
    await setDoc(ref, { perfil }, { merge: true });
    console.log(`Perfil fiscal (perfil) actualizado para ${collectionName}/${uid}.`);
  } catch (error) {
    console.error(`Error al guardar perfil fiscal (${collectionName}/${uid}):`, error);
    throw new Error('No se pudo guardar el perfil fiscal.');
  }
};

/**
 * Lee el PERFIL (campo 'perfil') desde:
 *   <colección>/<uid>/informacionFiscal/current
 * Devuelve null si no existe o si el formato no es válido.
 */
export const getUserPerfilFiscal = async (
  uid: string,
  rol?: string
): Promise<PerfilFiscal | null> => {
  const collectionName = await findUserCollection(uid, rol);
  if (!collectionName) {
    console.warn(`No se encontró la colección del usuario ${uid} para leer el perfil fiscal.`);
    return null;
  }

  const ref = doc(db, collectionName, uid, 'informacionFiscal', 'current');
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    const perfil = data.perfil;
    return isPerfilFiscal(perfil) ? (perfil as PerfilFiscal) : null;
  } catch (error) {
    console.error(`Error al leer perfil fiscal (${collectionName}/${uid}):`, error);
    return null;
  }
};
