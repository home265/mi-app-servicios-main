// /lib/services/perfilFiscalService.ts
import type { PerfilFiscal } from '@/types/perfilFiscal';
import {
  upsertUserPerfilFiscal,
  getUserPerfilFiscal as getPerfilFiscalFromFirestore,
} from '@/lib/firebase/firestore';

/**
 * Guarda o actualiza el perfil fiscal en:
 *   users/{uid}/informacionFiscal/current  (campo: 'perfil')
 */
export async function savePerfilFiscal(uid: string, rol: string, perfil: PerfilFiscal): Promise<void> {
  await upsertUserPerfilFiscal(uid, rol, perfil);
}

/**
 * Lee el perfil fiscal desde:
 *   users/{uid}/informacionFiscal/current  (campo: 'perfil')
 * Devuelve null si no existe.
 */
export async function getPerfilFiscal(uid: string, rol?: string): Promise<PerfilFiscal | null> {
  return await getPerfilFiscalFromFirestore(uid, rol);
}
