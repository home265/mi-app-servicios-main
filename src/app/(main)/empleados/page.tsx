// src/app/empleados/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { toast } from 'react-hot-toast'; // 1. Importar toast

// ✅ Se mantienen las importaciones del servicio y tipos
import { searchCvs, type CvDocument } from '@/lib/services/cvService';

import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import CvCard from '@/app/components/cv/CvCard';
import Button from '@/app/components/ui/Button';
import Card from '@/app/components/ui/Card';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaEmpleados from '@/app/components/ayuda-contenido/AyudaEmpleados';

export default function EmpleadosPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();

  const [rubroSel, setRubroSel] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<CvDocument[]>([]);

  useEffect(() => {
    if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) {
      router.replace('/bienvenida');
    }
  }, [currentUser, router]);

  if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) {
    return null;
  }

  const handleBuscar = async () => {
    console.log('handleBuscar: Iniciando búsqueda...');
    setCargando(true);
    setResultados([]);

    try {
      const results = await searchCvs({
        provincia: currentUser.localidad.provinciaNombre,
        localidad: currentUser.localidad.nombre,
        rubro: rubroSel.length === 1 ? rubroSel[0] : undefined,
      });

      console.log('handleBuscar: Resultados finales:', results);
      setResultados(results);

    } catch (error) {
      console.error("handleBuscar: Error durante la búsqueda:", error);
      // 2. Reemplazar alert con toast.error
      toast.error("Ocurrió un error al buscar. Revisa la consola para más detalles.");
    } finally {
      setCargando(false);
      console.log('handleBuscar: Búsqueda finalizada.');
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-6 min-h-screen">
      <Card className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Buscar Empleados</h2>
          <BotonAyuda>
            <AyudaEmpleados />
          </BotonAyuda>
        </div>

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

      <div className="w-full max-w-md space-y-4 pb-20">
        {resultados.map((cv) => (
          <CvCard
            key={cv.uid}
            cv={cv} 
            highlightRubro={rubroSel.length === 1 ? rubroSel[0] : undefined}
          />
        ))}

        {!cargando && resultados.length === 0 && (
          <p className="text-sm text-center text-gray-500">
            No se encontraron candidatos que coincidan con tu búsqueda.
          </p>
        )}
      </div>

      <button
        onClick={() => router.push('/bienvenida')}
        aria-label="Volver a inicio"
        className="fixed bottom-6 right-4 z-40 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring"
        style={{ backgroundColor: '#184840' }}
      >
        <ChevronLeftIcon className="h-6 w-6" style={{ color: '#EFC71D' }} />
      </button>
    </div>
  );
}