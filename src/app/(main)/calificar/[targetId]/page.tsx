// src/app/(main)/calificar/[targetId]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc, type DocumentData } from 'firebase/firestore';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import { db } from '@/lib/firebase/config';
import { useUserStore } from '@/store/userStore';

import Avatar from '@/components/common/Avatar';
import FormularioResenaDetallado from '@/components/resenas/FormularioResenaDetallado';

/**
 * Tipos para los datos del usuario a calificar. (sin cambios)
 */
type TargetUserData = {
  uid: string;
  collection: string;
  nombre: string;
  selfieURL?: string;
};

/**
 * Obtiene los datos de un usuario desde cualquier colección de roles. (sin cambios)
 */
async function getAnyUserData(uid: string): Promise<{ data: DocumentData; collection: string } | null> {
  const collectionsToSearch = ['usuarios_generales', 'prestadores', 'comercios'];

  for (const collectionName of collectionsToSearch) {
    const docRef = doc(db, collectionName, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { data: docSnap.data(), collection: collectionName };
    }
  }
  return null;
}


export default function CalificarPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams(); 
  const { currentUser, actingAs } = useUserStore();

  const [targetUser, setTargetUser] = useState<TargetUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetId = typeof params.targetId === 'string' ? params.targetId : '';
  const notifId = searchParams.get('notifId');

  // Lógica de carga de datos (sin cambios)
  useEffect(() => {
    if (!targetId) {
      setError('No se ha especificado un usuario para calificar.');
      setIsLoading(false);
      return;
    }

    if (currentUser?.uid === targetId) {
        setError('No puedes calificarte a ti mismo.');
        setIsLoading(false);
        return;
    }

    async function fetchTargetUser() {
      try {
        const result = await getAnyUserData(targetId);
        if (result) {
          const { data, collection } = result;
          setTargetUser({
            uid: targetId,
            collection: collection,
            nombre: data.nombre || 'Usuario Desconocido',
            selfieURL: data.selfieURL || undefined,
          });
        } else {
          setError('El usuario que intentas calificar no fue encontrado.');
        }
      } catch (err) {
        console.error("Error al buscar el usuario a calificar:", err);
        setError('Ocurrió un error al cargar los datos del usuario.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTargetUser();
  }, [targetId, currentUser?.uid]);

  const handleGoBack = () => {
    router.back();
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center animate-pulse text-texto-secundario">Cargando datos del usuario...</p>;
    }

    if (error) {
      return <p className="text-center text-error">{error}</p>;
    }

    if (targetUser) {
      return (
        <>
          <div className="flex flex-col items-center gap-3 mb-8">
            <Avatar selfieUrl={targetUser.selfieURL} nombre={targetUser.nombre} size={80} />
            <h2 className="text-xl font-semibold text-center text-texto-principal">
              Calificar a {targetUser.nombre}
            </h2>
          </div>

          <FormularioResenaDetallado
            target={targetUser}
            originalNotifId={notifId}
            onSubmitted={() => {
              toast.success('¡Gracias por tu reseña!');
              const homePage = actingAs === 'provider' ? '/trabajos' : '/bienvenida';
              router.push(homePage);
            }}
          />
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-fondo text-texto-principal p-4">
      <header className="relative flex items-center justify-center mb-6">
        <button
          onClick={handleGoBack}
          className="absolute left-0 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-medium">Crear Reseña</h1>
      </header>
      <main className="max-w-2xl mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}