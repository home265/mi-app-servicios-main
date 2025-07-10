// src/app/components/cv/CvModal.tsx
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import Avatar from '@/app/components/common/Avatar';
import Card from '@/app/components/ui/Card';
import { type CvDocument, getCvByUid } from '@/lib/services/cvService'; // ✅ 1. IMPORTAMOS EL SERVICIO Y EL TIPO

interface CvModalProps {
  uid: string; // ✅ 2. EL 'collection' YA NO ES NECESARIO
  onClose: () => void;
  highlightRubro?: string;
}

export default function CvModal({ uid, onClose, highlightRubro }: CvModalProps) {
  // ✅ 3. UN SOLO ESTADO PARA TODOS LOS DATOS, USANDO NUESTRO TIPO 'CvDocument'
  const [cvData, setCvData] = useState<CvDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ 4. 'useEffect' TOTALMENTE SIMPLIFICADO A UNA SOLA LLAMADA AL SERVICIO
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
    // Se actualiza para usar el nuevo estado 'cvData'
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
            <p className="text-white">Cargando CV...</p>
        </div>
     );
  }

  if (!cvData) {
    // Opcional: Mostrar un mensaje si el CV no se pudo cargar por alguna razón
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <Card>
            <p>No se pudo cargar la información del CV.</p>
        </Card>
      </div>
    );
  }

  // ✅ 5. EL JSX AHORA TOMA TODOS LOS DATOS DEL ESTADO UNIFICADO 'cvData'
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto space-y-4">
        <div className="flex justify-end -mb-4">
            <button className="text-gray-500 dark:text-gray-400 text-2xl" onClick={onClose}>
                &times;
            </button>
        </div>

        <div className="flex items-center space-x-3">
          <Avatar selfieUrl={cvData.selfieURL} nombre={cvData.nombreCompleto} size={80} />
          <div>
            <h2 className="text-xl font-semibold">
              {cvData.nombreCompleto}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {cvData.localidad?.nombre}, {cvData.localidad?.provinciaNombre}
            </p>
          </div>
        </div>

        {cvData.descripcion && <p className="whitespace-pre-wrap text-sm">{cvData.descripcion}</p>}

        <div>
          <h3 className="font-medium mb-1">Rubros</h3>
          <ul className="list-disc list-inside text-sm space-y-1">
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

        {cvData.estudios && Object.values(cvData.estudios).some(v => v) && (
          <div>
            <h3 className="font-medium">Estudios</h3>
            {Object.entries(cvData.estudios).filter(([, v]) => v).map(([k, v]) => (
              <p key={k} className="text-sm">
                <span className="capitalize font-semibold">{k}:</span> {v}
              </p>
            ))}
          </div>
        )}

        {cvData.telefonoAlt && (
          <div>
            <h3 className="font-medium">Teléfono alternativo</h3>
            <p className="text-sm">{cvData.telefonoAlt}</p>
          </div>
        )}
      </Card>
    </div>
  );
}