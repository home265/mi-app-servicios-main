'use client';
import React, { useEffect, useState } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface CvModalProps {
  uid: string;
  collection: string;   // 'usuarios_generales'
  onClose: () => void;
}

interface CvDoc {
  descripcion? : string;
  telefonoAlt? : string;
  rubros?      : string[];
  estudios?    : Record<string, string>;
}

/* campos del usuario que mostramos en el modal */
interface ProfileDoc {
  nombre       : string;
  apellido     : string;
  selfieURL    : string;
  localidad?: {
    nombre: string;
    provinciaNombre: string;
  };
}

export default function CvModal({ uid, collection, onClose }: CvModalProps) {
  const [profile, setProfile] = useState<ProfileDoc | null>(null);
  const [cv, setCv] = useState<CvDoc | null>(null);

  useEffect(() => {
    (async () => {
      /* perfil */
      const profileSnap = await getDoc(doc(db, collection, uid));
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as ProfileDoc);
      }

      /* cv */
      const cvSnap = await getDoc(doc(db, 'usuarios_generales', uid, 'cv', 'main'));
      if (cvSnap.exists()) {
        setCv(cvSnap.data() as CvDoc);
      }
    })();
  }, [uid, collection]);

  if (!profile || !cv) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <Card className="w-96 max-h-[90vh] overflow-y-auto space-y-4">
        <button className="self-end text-gray-500" onClick={onClose}>
          &times;
        </button>

        {/* Cabecera */}
        <div className="flex items-center space-x-3">
          <Avatar selfieUrl={profile.selfieURL} nombre={profile.nombre} size={80} />
          <div>
            <h2 className="text-xl font-semibold">
              {profile.nombre} {profile.apellido}
            </h2>
            <p className="text-sm text-gray-600">
              {profile.localidad?.nombre}, {profile.localidad?.provinciaNombre}
            </p>
          </div>
        </div>

        {/* Descripción */}
        {cv.descripcion && <p className="whitespace-pre-wrap">{cv.descripcion}</p>}

        {/* Rubros */}
        <div>
          <h3 className="font-medium">Rubros</h3>
          <ul className="list-disc list-inside text-sm">
            {cv.rubros?.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>

        {/* Estudios */}
        {cv.estudios && (
          <div>
            <h3 className="font-medium">Estudios</h3>
            {Object.entries(cv.estudios).map(([k, v]) => (
              <p key={k} className="text-sm capitalize">
                {k}: {v || '—'}
              </p>
            ))}
          </div>
        )}

        {/* Contacto alternativo */}
        {cv.telefonoAlt && (
          <p className="text-sm">
            <span className="font-medium">Teléfono: </span>
            {cv.telefonoAlt}
          </p>
        )}
      </Card>
    </div>
  );
}
