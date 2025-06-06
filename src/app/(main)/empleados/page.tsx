// src/app/empleados/page.tsx

'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  collection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  doc,
  getDoc,
  getDocs,
  query,
  where,
  collectionGroup // ¡Asegúrate de importar collectionGroup!
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import CvCard, { CvCardData } from '@/app/components/cv/CvCard';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Logo from '@/app/components/ui/Logo';

/* ---------- tipo mínimo del documento CV ---------- */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface CvDoc {
  rubros?: string[];
  descripcion?: string;
}

export default function EmpleadosPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  const [rubroSel, setRubroSel] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<CvCardData[]>([]);

  useEffect(() => {
    if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) {
      router.replace('/bienvenida');
    }
  }, [currentUser, router]);

  if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) {
    return null;
  }

  const provincia = currentUser.localidad.provinciaNombre;
  const localidad = currentUser.localidad.nombre;

  const handleBuscar = async () => {
    console.log('handleBuscar: Iniciando búsqueda...');
    setCargando(true);
    setResultados([]);

    try {
      /* 1. Usamos una Collection Group Query para buscar en todos los 'cv' */
      let q = query(
        collectionGroup(db, 'cv'), // La magia sucede aquí
        where('localidad.provinciaNombre', '==', provincia),
        where('localidad.nombre', '==', localidad)
      );
      
      console.log(`handleBuscar: Query base para ${localidad}, ${provincia}`);

      /* 2. Si se seleccionó un rubro, lo añadimos al filtro */
      if (rubroSel.length === 1) {
        const selectedRubro = rubroSel[0];
        q = query(q, where('rubros', 'array-contains', selectedRubro));
        console.log(`handleBuscar: Filtrando por rubro: ${selectedRubro}`);
      }

      const cvsSnap = await getDocs(q);
      console.log(`handleBuscar: Se encontraron ${cvsSnap.docs.length} CVs.`);

      if (cvsSnap.empty) {
        setResultados([]);
        setCargando(false);
        return;
      }
      
      /* 3. Para cada CV, obtenemos el perfil de su usuario "padre" */
      const promises = cvsSnap.docs.map(async (cvDoc) => {
        const parentUserRef = cvDoc.ref.parent.parent;
        if (!parentUserRef) return null;

        const profileSnap = await getDoc(parentUserRef);
        if (!profileSnap.exists()) return null;

        const cv = cvDoc.data();
        const profile = profileSnap.data();

        return {
          uid: profileSnap.id,
          collection: 'usuarios_generales',
          nombre: `${profile.nombre} ${profile.apellido}`,
          selfieURL: profile.selfieURL,
          rubros: cv.rubros ?? [],
          descripcion: cv.descripcion ?? '',
          telefono: ''
        };
      });

      const results = (await Promise.all(promises)).filter(Boolean) as CvCardData[];

      console.log('handleBuscar: Resultados finales:', results);
      setResultados(results);

    } catch (error) {
      console.error("handleBuscar: Error durante la búsqueda:", error);
      alert("Ocurrió un error al buscar. Revisa la consola para más detalles.");
    } finally {
      setCargando(false);
      console.log('handleBuscar: Búsqueda finalizada.');
    }
  };

  /* ====================================================== */
  return (
    <div className="flex flex-col items-center p-4 space-y-6">
      <Logo />

      <Card className="max-w-md w-full space-y-4">
        <h2 className="text-lg font-semibold">Buscar Empleados</h2>

        <div>
          <label className="block font-medium mb-1">Rubro (opcional)</label>
          <SelectorCategoriasEmpleo
            value={rubroSel}
            onChange={(arr) => setRubroSel(arr.slice(0, 1))}
          />
        </div>

        <Button onClick={handleBuscar} disabled={cargando}>
          {cargando ? 'Buscando…' : 'Buscar'}
        </Button>
      </Card>

      {/* Resultados */}
      <div className="w-full max-w-md space-y-4">
        {resultados.map((u) => (
          <CvCard
            key={u.uid}
            user={u}
            // Aquí pasamos el rubro buscado para que se pueda destacar
            highlightRubro={rubroSel.length === 1 ? rubroSel[0] : undefined}
          />
        ))}

        {!cargando && resultados.length === 0 && (
          <p className="text-sm text-center text-gray-500">
            {rubroSel.length
              ? 'No se encontraron candidatos para ese rubro en tu localidad.'
              : 'No hay CVs disponibles en tu localidad.'}
          </p>
        )}
      </div>
    </div>
  );
}