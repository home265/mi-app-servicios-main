// src/app/components/cv/CvModal.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
import { type CvDocument, getCvByUid } from '@/lib/services/cvService';

interface CvModalProps {
  uid: string;
  onClose: () => void;
  highlightRubro?: string;
}

export default function CvModal({ uid, onClose, highlightRubro }: CvModalProps) {
  const [cvData, setCvData] = useState<CvDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Lógica de carga de datos (sin cambios)
  useEffect(() => {
    if (!uid) return;
    
    const fetchCv = async () => {
      setIsLoading(true);
      try {
        const data = await getCvByUid(uid);
        if (data) {
          setCvData(data);
        } else {
          console.error("No se encontró el CV para el UID:", uid);
        }
      } catch (error) {
        console.error("Error al cargar datos del CV:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCv();
  }, [uid]);

  const rubrosOrdenados = useMemo(() => {
    if (!cvData?.rubros) return [];
    if (!highlightRubro) return cvData.rubros;

    const lista = [...cvData.rubros];
    const indice = lista.indexOf(highlightRubro);

    if (indice > -1) {
      const itemDestacado = lista.splice(indice, 1)[0];
      lista.unshift(itemDestacado);
    }
    
    return lista;
  }, [cvData?.rubros, highlightRubro]);

  if (isLoading) {
     return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <p className="text-texto-principal">Cargando CV...</p>
        </div>
     );
  }

  if (!cvData) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <Card>
            <p className="text-texto-principal">No se pudo cargar la información del CV.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-end -mb-4">
            <button className="text-texto-secundario text-2xl" onClick={onClose}>
                &times;
            </button>
        </div>

        <div className="flex items-center space-x-3">
          <Avatar selfieUrl={cvData.selfieURL} nombre={cvData.nombreCompleto} size={80} />
          <div>
            <h2 className="text-xl font-semibold text-texto-principal">
              {cvData.nombreCompleto}
            </h2>
            <p className="text-sm text-texto-secundario">
              {cvData.localidad?.nombre}, {cvData.localidad?.provinciaNombre}
            </p>
          </div>
        </div>

        {cvData.descripcion && <p className="whitespace-pre-wrap text-sm text-texto-principal">{cvData.descripcion}</p>}

        <div>
          <h3 className="font-medium mb-1 text-texto-principal">Rubros</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-texto-principal">
            {rubrosOrdenados.map((r) => (
              <li
                key={r}
                className={r === highlightRubro ? 'font-bold text-primario' : ''}
              >
                {r}
              </li>
            ))}
          </ul>
        </div>

        {cvData.estudios && Object.values(cvData.estudios).some(v => v) && (
          <div>
            <h3 className="font-medium text-texto-principal">Estudios</h3>
            {Object.entries(cvData.estudios).filter(([, v]) => v).map(([k, v]) => (
              <p key={k} className="text-sm text-texto-principal">
                <span className="capitalize font-semibold">{k}:</span> {v}
              </p>
            ))}
          </div>
        )}

        {cvData.telefonoAlt && (
          <div>
            <h3 className="font-medium text-texto-principal">Teléfono alternativo</h3>
            <p className="text-sm text-texto-principal">{cvData.telefonoAlt}</p>
          </div>
        )}
      </Card>
    </div>
  );
}