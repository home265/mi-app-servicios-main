'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';

import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { PLANES } from '@/lib/constants/planes';
import AnuncioAnimadoCard from '@/app/components/anuncios/AnuncioAnimadoCard';

export default function AnunciosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUser = useUserStore((s) => s.currentUser);

  // Estados para manejar la carga y el resultado
  const [adToShow, setAdToShow] = useState<SerializablePaginaAmarillaData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Esta función se ejecutará solo una vez cuando el componente esté listo
    const fetchAd = async () => {
      // 1. Obtenemos el contexto y la ubicación
      const context = searchParams.get('context');
      const provincia = currentUser?.localidad?.provinciaNombre;
      const localidad = currentUser?.localidad?.nombre;

      // Si falta información esencial, no podemos continuar
      if (!context || !provincia || !localidad) {
        setError('No se pudo determinar el contexto o la ubicación para mostrar el anuncio.');
        setIsLoading(false);
        // Opcional: redirigir después de un momento
        setTimeout(() => router.replace('/bienvenida'), 3000);
        return;
      }

      try {
        // 2. Construimos la URL para llamar a nuestra API inteligente
        const apiUrl = `/api/anuncios?context=${context}&provincia=${provincia}&localidad=${localidad}`;
        
        const res = await fetch(apiUrl);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Error del servidor: ${res.status}`);
        }

        const adData = await res.json();
        
        // 3. Guardamos el anuncio que nos devolvió el "cerebro"
        setAdToShow(adData);

      } catch (err) {
        const fetchError = err as Error;
        console.error("Error al obtener el anuncio:", fetchError);
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Solo ejecutamos la búsqueda si tenemos la información del usuario
    if (currentUser) {
      fetchAd();
    }
  }, [currentUser, searchParams, router]);

  // --- Renderizado del componente ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo">
        <p className="animate-pulse text-lg text-texto-secundario">Buscando anuncio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo text-center p-4">
        <div>
            <p className="text-xl font-semibold text-error">No se pudo cargar el anuncio</p>
            <p className="text-texto-secundario mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!adToShow) {
    // Esto ocurre si la API devuelve null (no encontró anuncios aplicables)
    // Opcional: podrías redirigir al usuario a la bienvenida inmediatamente
    // router.replace('/bienvenida');
    return (
      <div className="min-h-screen flex items-center justify-center bg-fondo text-center p-4">
         <p className="text-lg text-texto-secundario">No hay anuncios disponibles para tu zona en este momento.</p>
      </div>
    );
  }

  // Si tenemos un anuncio para mostrar, buscamos los detalles de su plan
  const planDetails = adToShow.planId ? PLANES.find(p => p.id === adToShow.planId) : null;
  if (!planDetails) {
    // Esto es un fallback por si el anuncio no tiene un planId válido
    return (
        <div className="min-h-screen flex items-center justify-center bg-fondo text-center p-4">
           <p className="text-lg text-error">Error: El anuncio tiene un plan no reconocido.</p>
        </div>
      );
  }


  return (
    <div className="min-h-screen flex items-center justify-center bg-fondo p-4">
      <AnuncioAnimadoCard
        publicacion={adToShow}
        duracionFrente={planDetails.durationFrontMs}
        duracionDorso={planDetails.durationBackMs}
      />
    </div>
  );
}