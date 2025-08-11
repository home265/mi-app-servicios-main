// src/app/empleados/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { toast } from 'react-hot-toast';

import { searchCvs, type CvDocument } from '@/lib/services/cvService';

import SelectorCategoriasEmpleo from '@/components/forms/SelectorCategoriasEmpleo';
import CvCard from '@/components/cv/CvCard';
import Card from '@/components/ui/Card';
import AyudaEmpleados from '@/components/ayuda-contenido/AyudaEmpleados';
import BotonVolver from '@/components/common/BotonVolver'; // Se importa el botón de volver
import useHelpContent from '@/lib/hooks/useHelpContent';

export default function EmpleadosPage() {
  const router = useRouter();
  const { currentUser } = useUserStore();
  useHelpContent(<AyudaEmpleados />);
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
      toast.error("Ocurrió un error al buscar. Revisa la consola para más detalles.");
    } finally {
      setCargando(false);
      console.log('handleBuscar: Búsqueda finalizada.');
    }
  };

  return (
    <div className="flex flex-col items-center p-4 space-y-6 min-h-screen bg-fondo">
      <Card className="max-w-md w-full space-y-4">
        <div className="flex items-center justify-center">
          <h2 className="text-lg font-semibold text-texto-principal">Buscar Empleados</h2>
        </div>

        <div>
          <label className="block font-medium text-texto-secundario mb-1">Rubro (opcional)</label>
          <SelectorCategoriasEmpleo
            value={rubroSel}
            onChange={(arr) => setRubroSel(arr.slice(0, 1))}
          />
        </div>

        <div className="flex justify-center pt-2">
          <button
            onClick={handleBuscar}
            disabled={cargando}
            className="btn-primary"
          >
            {cargando ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
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
          <p className="text-sm text-center text-texto-secundario">
            No se encontraron candidatos que coincidan con tu búsqueda.
          </p>
        )}
      </div>

      <BotonVolver />
    </div>
  );
}