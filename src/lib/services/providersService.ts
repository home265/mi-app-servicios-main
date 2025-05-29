import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export interface Provider extends DocumentData {
  uid: string;
  collection: 'prestadores';
}

/**
 * Obtiene la lista de prestadores filtrados por categoría, subcategoría, provincia y localidad.
 */
export async function getProvidersByFilter(
  category: string,
  subcategory: string | undefined,
  province: string,
  locality: string
): Promise<Provider[]> {
  const ref = collection(db, 'prestadores');
  // Filtros básicos
  let q = query(
    ref,
    where('localidad.provinciaNombre', '==', province),
    where('localidad.nombre', '==', locality),
    where('categoria.categoria', '==', category)
  );

  // Agrega subcategoría si existe
  if (subcategory) {
    q = query(q, where('categoria.subcategoria', '==', subcategory));
  }

  // Ejecuta consulta
  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    uid: doc.id,
    collection: 'prestadores',
    ...(doc.data() as DocumentData),
  }));
}
