'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import SelectorCategoriasEmpleo from '@/app/components/forms/SelectorCategoriasEmpleo';
import Avatar from '@/app/components/common/Avatar';
/* ---------- tipo mínimo del documento CV en Firestore ---------- */
interface CvDoc {
  descripcion? : string;
  telefonoAlt? : string;
  rubros?      : string[];
  estudios?    : {
    primario?      : string;
    secundario?    : string;
    universitario? : string;
    posgrado?      : string;
  };
}

export default function CvPage() {
  const { currentUser } = useUserStore();
  const router = useRouter();

  /* --- formularios --- */
  const [descripcion, setDescripcion] = useState('');
  const [telefonoAlt, setTelefonoAlt] = useState('');
  const [rubros, setRubros]           = useState<string[]>([]);
  const [estudios, setEstudios]       = useState({
    primario: '', secundario: '', universitario: '', posgrado: '',
  });

  /* --- redirige si no hay user --- */
  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  /* --- precarga si existe CV --- */
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      const ref  = doc(db, 'usuarios_generales', currentUser.uid, 'cv', 'main');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as CvDoc;            // ✅ tipado explícito
        setDescripcion(d.descripcion  ?? '');
        setTelefonoAlt(d.telefonoAlt  ?? '');
        setRubros      (d.rubros       ?? []);
        setEstudios({
            primario      : d.estudios?.primario      ?? '',
            secundario    : d.estudios?.secundario    ?? '',
            universitario : d.estudios?.universitario ?? '',
            posgrado      : d.estudios?.posgrado      ?? '',
          });
      }
    })();
  }, [currentUser]);

  const handleSave = async () => {
    if (!currentUser) return;
    const ref = doc(db, 'usuarios_generales', currentUser.uid, 'cv', 'main');
    await setDoc(ref, {
      uid         : currentUser.uid,
      descripcion ,
      telefonoAlt ,
      rubros      ,
      estudios    ,
      localidad   : currentUser.localidad,
      timestamp   : Timestamp.now().toMillis(),
    });
    alert('CV guardado ✔');
    router.replace('/bienvenida');
  };

  if (!currentUser) return null;

  return (
    <Card className="max-w-md mx-auto space-y-4">
      {/* encabezado con título y avatar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mi Curriculum</h2>
        <Avatar
          selfieUrl={currentUser.selfieURL}
          nombre={currentUser.nombre}
          size={64}          /* ajusta a tu gusto: 48‑80 */
        />
      </div>
  
      <div>
        <p className="font-medium">Nombre</p>
        <p>
          {currentUser.nombre} {currentUser.apellido}
        </p>
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
        <label className="block font-medium">Rubros (máx. 4)</label>
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
  
      <Button onClick={handleSave}>Guardar CV</Button>
    </Card>
  );
  
}
