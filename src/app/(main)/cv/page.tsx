'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Timestamp } from 'firebase/firestore';
import { createOrUpdateCv, getCvByUid } from '@/lib/services/cvService';
import { toast } from 'react-hot-toast';

// --- IMPORTS ACTUALIZADOS ---
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input'; // Se importa el componente Input estandarizado
import Textarea from '@/app/components/ui/Textarea'; // Se importa el componente Textarea estandarizado
import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import Avatar from '@/app/components/common/Avatar';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaCrearEditarCV from '@/app/components/ayuda-contenido/AyudaCrearEditarCV';
import BotonVolver from '@/app/components/common/BotonVolver'; // Se importa el botón de volver

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

  // Lógica de carga y guardado (sin cambios)
  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

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
      toast.success('CV guardado ✔');
      router.replace('/bienvenida');
    } catch (error) {
      console.error("Error al guardar el CV:", error);
      toast.error("Ocurrió un error al guardar tu CV. Por favor, inténtalo de nuevo.");
    }
  };

  if (isLoading || !currentUser) {
    return (
        <div className="flex justify-center items-center h-screen bg-fondo text-texto-principal">
            <p className="animate-pulse">Cargando tu información...</p>
        </div>
    );
  }

  return (
    // Se añade padding inferior para que el botón flotante no tape el contenido
    <div className="pb-24">
      <Card className="max-w-md mx-auto space-y-4 my-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-texto-principal">Mi Curriculum</h2>
          <Avatar
            selfieUrl={currentUser.selfieURL}
            nombre={currentUser.nombre}
            size={64}
          />
        </div>
    
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-texto-principal">Nombre</p>
            <p className="text-texto-secundario">
              {currentUser.nombre} {currentUser.apellido}
            </p>
          </div>
          <BotonAyuda>
            <AyudaCrearEditarCV />
          </BotonAyuda>
        </div>
    
        <div>
          <p className="font-medium text-texto-principal">Localidad</p>
          <p className="text-texto-secundario">
            {currentUser.localidad.nombre}, {currentUser.localidad.provinciaNombre}
          </p>
        </div>
    
        {/* --- FORMULARIOS REFACTORIZADOS --- */}
        <Textarea
          id="descripcion"
          label="Descripción / Habilidades"
          rows={4}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          spellCheck="true"
        />
    
        <Input
          id="telefonoAlt"
          label="Teléfono alternativo"
          value={telefonoAlt}
          onChange={(e) => setTelefonoAlt(e.target.value)}
        />
    
        <div>
          <label className="block text-sm font-medium text-texto-secundario mb-1">Rubros (máx. 4)</label>
          <SelectorCategoriasEmpleo value={rubros} onChange={setRubros} />
        </div>
    
        {(['primario', 'secundario', 'universitario', 'posgrado'] as const).map(
          (k) => (
            <Input
              key={k}
              id={`estudios-${k}`}
              label={`Estudios ${k}`}
              className="capitalize"
              value={estudios[k]}
              onChange={(e) =>
                setEstudios({ ...estudios, [k]: e.target.value })
              }
              placeholder="Ej.: Completo / Incompleto / Lic. en…"
            />
          )
        )}
    
        <Button
          onClick={handleSave}
          fullWidth
          className="!mt-6 !bg-primario !text-fondo border-none !focus:shadow-none hover:!brightness-90"
        >
          Guardar CV
        </Button>
      </Card>
      
      {/* Se reemplaza el botón fijo por el componente reutilizable */}
      <BotonVolver />
    </div>
  );
}