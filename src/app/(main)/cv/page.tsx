'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Timestamp } from 'firebase/firestore';
import { createOrUpdateCv, getCvByUid } from '@/lib/services/cvService';
import { toast } from 'react-hot-toast'; // 1. Importar toast
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import Avatar from '@/app/components/common/Avatar';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarCV from '@/app/components/ayuda-contenido/AyudaCrearEditarCV';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function CvPage() {
  const { currentUser } = useUserStore();
  const router = useRouter();

  const [descripcion, setDescripcion] = useState('');
  const [telefonoAlt, setTelefonoAlt] = useState('');
  const [rubros, setRubros] = useState<string[]>([]);
  const [estudios, setEstudios] = useState({
    primario: '', secundario: '', universitario: '', posgrado: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  /* --- redirige si no hay user --- */
  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  /* --- precarga si existe CV --- */
  useEffect(() => {
    if (!currentUser) return;
    
    (async () => {
      setIsLoading(true);
      try {
        const cvData = await getCvByUid(currentUser.uid);
        if (cvData) {
          setDescripcion(cvData.descripcion ?? '');
          setTelefonoAlt(cvData.telefonoAlt ?? '');
          setRubros(cvData.rubros ?? []);
          setEstudios({
            primario: cvData.estudios?.primario ?? '',
            secundario: cvData.estudios?.secundario ?? '',
            universitario: cvData.estudios?.universitario ?? '',
            posgrado: cvData.estudios?.posgrado ?? '',
          });
        }
      } catch (error) {
        console.error("Error al cargar el CV:", error);
        // 2. Reemplazar alert con toast.error
        toast.error("No se pudo cargar la información de tu CV. Inténtalo de nuevo.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      await createOrUpdateCv(currentUser.uid, {
        nombreCompleto: `${currentUser.nombre} ${currentUser.apellido}`,
        selfieURL: currentUser.selfieURL ?? null,
        descripcion,
        telefonoAlt,
        rubros,
        estudios,
        localidad: currentUser.localidad,
        timestamp: Timestamp.now().toMillis(),
      });
      // 3. Reemplazar alert con toast.success
      toast.success('CV guardado ✔');
      router.replace('/bienvenida');
    } catch (error) {
      console.error("Error al guardar el CV:", error);
      // 4. Reemplazar alert con toast.error
      toast.error("Ocurrió un error al guardar tu CV. Por favor, inténtalo de nuevo.");
    }
  };

  if (isLoading || !currentUser) {
    return (
        <div className="flex justify-center items-center h-screen">
            <p>Cargando tu información...</p>
        </div>
    );
  }

  // Se envuelve el retorno en un Fragmento <> para incluir el botón flotante
  return (
    <>
      <Card className="max-w-md mx-auto space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Mi Curriculum</h2>
          <Avatar
            selfieUrl={currentUser.selfieURL}
            nombre={currentUser.nombre}
            size={64}
          />
        </div>
    
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">Nombre</p>
            <p>
              {currentUser.nombre} {currentUser.apellido}
            </p>
          </div>
          <BotonAyuda>
            <AyudaCrearEditarCV />
          </BotonAyuda>
        </div>
    
        <div>
          <p className="font-medium">Localidad</p>
          <p>
            {currentUser.localidad.nombre}, {currentUser.localidad.provinciaNombre}
          </p>
        </div>
    
        <div>
          <label className="block font-medium">Descripción / habilidades</label>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            spellCheck="true"
          />
        </div>
    
        <div>
          <label className="block font-medium">Teléfono alternativo</label>
          <input
            className="w-full border rounded p-2 text-sm"
            value={telefonoAlt}
            onChange={(e) => setTelefonoAlt(e.target.value)}
          />
        </div>
    
        <div>
          <label className="block font-medium">Rubros (máx. 4)</label>
          <SelectorCategoriasEmpleo value={rubros} onChange={setRubros} />
        </div>
    
        {(['primario', 'secundario', 'universitario', 'posgrado'] as const).map(
          (k) => (
            <div key={k}>
              <label className="block font-medium capitalize">{k}</label>
              <input
                className="w-full border rounded p-2 text-sm"
                value={estudios[k]}
                onChange={(e) =>
                  setEstudios({ ...estudios, [k]: e.target.value })
                }
                placeholder="Ej.: Completo / Incompleto / Lic. en…"
              />
            </div>
          )
        )}
    
        <Button
  onClick={handleSave}
  className="!bg-[var(--color-primario)] !text-[var(--color-fondo)] border-none !focus:shadow-none hover:!brightness-90"
>
  Guardar CV
</Button>
      </Card>
      
      <button
        onClick={() => router.push('/bienvenida')}
        className="fixed bottom-6 right-4 h-12 w-12 rounded-full shadow-lg flex items-center justify-center focus:outline-none"
        style={{ backgroundColor: '#184840' }}
      >
        <ChevronLeftIcon className="h-6 w-6" style={{ color: '#EFC71D' }} />
      </button>
    </>
  );
}