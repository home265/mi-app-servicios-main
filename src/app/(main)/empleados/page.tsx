'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import CvCard, { CvCardData } from '@/app/components/cv/CvCard';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import Logo from '@/app/components/ui/Logo';

/* ---------- tipo mínimo del documento CV ---------- */
interface CvDoc {
  rubros?: string[];
  descripcion?: string;
}

export default function EmpleadosPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  /* --- acceso solo para prestador o comercio --- */
  useEffect(() => {
    if (
      !currentUser ||
      (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')
    ) {
      router.replace('/bienvenida');
    }
  }, [currentUser, router]);

  /* --- formulario de filtro --- */
  const [rubroSel, setRubroSel] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<CvCardData[]>([]);

  if (
    !currentUser ||
    (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')
  ) {
    return null;
  }

  const provincia = currentUser.localidad.provinciaNombre;
  const localidad = currentUser.localidad.nombre;

  const handleBuscar = async () => {
    setCargando(true);
    setResultados([]);

    /* 1. consulta usuarios_generales filtrando por localidad */
    let q = query(
      collection(db, 'usuarios_generales'),
      where('localidad.provinciaNombre', '==', provincia),
      where('localidad.nombre', '==', localidad)
    );

    /* si hay rubro seleccionado, filtra también por él (requiere índice) */
    if (rubroSel.length === 1) {
      q = query(q, where('cv.main.rubros', 'array-contains', rubroSel[0]));
    }

    const snap = await getDocs(q);
    const results: CvCardData[] = [];

    /* 2. para cada usuario, trae su CV main */
    await Promise.all(
      snap.docs.map(async (userDoc) => {
        const cvSnap = await getDoc(
          doc(db, 'usuarios_generales', userDoc.id, 'cv', 'main')
        );
        if (!cvSnap.exists()) return;

        const profile = userDoc.data();
        const cv = cvSnap.data() as CvDoc; // ✅ tipado explícito

        results.push({
          uid: userDoc.id,
          collection: 'usuarios_generales',
          nombre: `${profile.nombre} ${profile.apellido}`,
          selfieURL: profile.selfieURL,
          rubros: cv.rubros ?? [],
          descripcion: cv.descripcion ?? '',
          telefono: ''
        });
      })
    );

    setResultados(results);
    setCargando(false);
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
            onChange={(arr) => setRubroSel(arr.slice(0, 1))} /* solo uno */
          />
        </div>

        <Button onClick={handleBuscar} disabled={cargando}>
          {cargando ? 'Buscando…' : 'Buscar'}
        </Button>
      </Card>

      {/* Resultados */}
      <div className="w-full max-w-md space-y-4">
        {resultados.map((u) => (
          <CvCard key={u.uid} user={u} />
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
