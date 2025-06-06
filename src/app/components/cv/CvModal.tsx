// src/app/components/cv/CvModal.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react'; // 1. Se añade 'useMemo'
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface CvModalProps {
  uid: string;
  collection: string;
  onClose: () => void;
  highlightRubro?: string;
}

interface CvDoc {
  descripcion?: string;
  telefonoAlt?: string;
  rubros?: string[];
  estudios?: Record<string, string>;
}

interface ProfileDoc {
  nombre: string;
  apellido: string;
  selfieURL: string;
  localidad?: {
    nombre: string;
    provinciaNombre: string;
  };
}

export default function CvModal({ uid, collection, onClose, highlightRubro }: CvModalProps) {
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [cv, setCv] = useState<CvDoc | null>(null);

  useEffect(() => {
    (async () => {
      const profileSnap = await getDoc(doc(db, collection, uid));
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as ProfileDoc);
      }
      const cvSnap = await getDoc(doc(db, 'usuarios_generales', uid, 'cv', 'main'));
      if (cvSnap.exists()) {
        setCv(cvSnap.data() as CvDoc);
      }
    })();
  }, [uid, collection]);

  // 2. Creamos una nueva lista de rubros ordenada
  const rubrosOrdenados = useMemo(() => {
    // Si no hay CV o no hay rubros, devolvemos una lista vacía
    if (!cv?.rubros) return [];
    
    // Si no se está destacando ningún rubro, devolvemos la lista tal como viene
    if (!highlightRubro) return cv.rubros;

    // Si hay que destacar uno, lo buscamos y lo ponemos al principio
    const lista = [...cv.rubros];
    const indice = lista.indexOf(highlightRubro);

    if (indice > -1) {
      const itemDestacado = lista.splice(indice, 1)[0];
      lista.unshift(itemDestacado);
    }
    
    return lista;
  }, [cv?.rubros, highlightRubro]);


  if (!profile || !cv) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-end -mb-4">
            <button className="text-gray-500 dark:text-gray-400 text-2xl" onClick={onClose}>
                &times;
            </button>
        </div>

        {/* Cabecera */}
        <div className="flex items-center space-x-3">
          <Avatar selfieUrl={profile.selfieURL} nombre={profile.nombre} size={80} />
          <div>
            <h2 className="text-xl font-semibold">
              {profile.nombre} {profile.apellido}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {profile.localidad?.nombre}, {profile.localidad?.provinciaNombre}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {cv.descripcion && <p className="whitespace-pre-wrap text-sm">{cv.descripcion}</p>}

        {/* Rubros */}
        <div>
          <h3 className="font-medium mb-1">Rubros</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
            {/* 3. Usamos la nueva lista ordenada para mostrar los rubros */}
            {rubrosOrdenados.map((r) => (
              <li
                key={r}
                className={r === highlightRubro ? 'font-bold text-[var(--color-primario)]' : ''}
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Estudios */}
        {cv.estudios && Object.values(cv.estudios).some(v => v) && (
          <div>
            <h3 className="font-medium">Estudios</h3>
            {Object.entries(cv.estudios).filter(([, v]) => v).map(([k, v]) => (
              <p key={k} className="text-sm">
                <span className="capitalize font-semibold">{k}:</span> {v}
              </p>
            ))}
          </div>
        )}

        {/* Contacto alternativo */}
        {cv.telefonoAlt && (
          <div>
            <h3 className="font-medium">Teléfono alternativo</h3>
            <p className="text-sm">{cv.telefonoAlt}</p>
          </div>
        )}
      </Card>
    </div>
  );
}