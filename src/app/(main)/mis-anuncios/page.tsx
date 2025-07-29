// src/app/(main)/mis-anuncios/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { listAnunciosByFilter, listCapturas } from '@/lib/services/anunciosService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio, Captura, Timestamp } from '@/types/anuncio'; 
import { planes, campanias } from '@/lib/constants/anuncios';
import AnuncioCard from './components/AnuncioCard';
import Navbar from '@/app/components/common/Navbar';
import { Loader2 } from 'lucide-react';
import BotonAyuda from '@/app/components/common/BotonAyuda';
import AyudaMisAnuncios from '@/app/components/ayuda-contenido/AyudaMisAnuncios';
import BotonVolver from '@/app/components/common/BotonVolver'; // Se importa el botón de volver

interface AnuncioConPreview extends Anuncio {
  previewImageUrl?: string;
  tiempoRestante?: string;
  nombrePlan?: string;
  nombreCampania?: string;
}

function convertTimestampToDate(timestamp: Timestamp | Date | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }
  }
  console.warn("No se pudo convertir el valor de fecha:", timestamp);
  return undefined;
}


export default function MisAnunciosPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router = useRouter();
  const currentUserUid = useUserStore(state => state.currentUser?.uid);
  const isLoadingAuth = useUserStore(state => state.isLoadingAuth);

  const [anunciosConPreview, setAnunciosConPreview] = useState<AnuncioConPreview[]>([]);
  const [isLoadingAnuncios, setIsLoadingAnuncios] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularTiempoRestante = useCallback((endDate?: Date): string => {
    if (!endDate) return 'No disponible';

    const ahora = new Date();
    if (endDate <= ahora) return "Finalizada"; 

    const diferencia = endDate.getTime() - ahora.getTime();
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);

    if (dias > 0) return `Finaliza en ${dias} día${dias !== 1 ? 's' : ''} y ${horas}h`;
    if (horas > 0) return `Finaliza en ${horas} hora${horas !== 1 ? 's' : ''}`;
    
    const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
    if (minutos > 0) return `Finaliza en ${minutos} minuto${minutos !== 1 ? 's' : ''}`;

    return "Finaliza pronto";
  }, []);

  const fetchAnunciosYPreviews = useCallback(async (userId: string) => {
    setIsLoadingAnuncios(true);
    setError(null);

    try {
      const misAnuncios = await listAnunciosByFilter({ creatorId: userId });

      if (misAnuncios.length === 0) {
        setAnunciosConPreview([]);
        setIsLoadingAnuncios(false);
        return;
      }

      const anunciosProcesadosPromise = misAnuncios.map(async (anuncio) => {
        let previewImageUrl: string | undefined;
        if (anuncio.id) {
          try {
            const capturasAnuncio = await listCapturas(anuncio.id);
            const capturaScreen0 = capturasAnuncio.find(c => c.screenIndex === 0);
            if (capturaScreen0) {
                previewImageUrl = capturaScreen0.imageUrl;
            } else if (capturasAnuncio.length > 0) {
                previewImageUrl = capturasAnuncio[0]?.imageUrl; 
            }
          } catch (e) {
            console.warn(`MisAnunciosPage: Error cargando capturas para anuncio ${anuncio.id}:`, e);
          }
        }

        let tiempoRestanteStr: string;
        const fechaFinAnuncio = convertTimestampToDate(anuncio.endDate);

        switch (anuncio.status) {
          case 'active':
            tiempoRestanteStr = calcularTiempoRestante(fechaFinAnuncio);
            break;
          case 'pendingPayment':
            tiempoRestanteStr = 'Pendiente de pago';
            break;
          case 'draft':
            tiempoRestanteStr = 'Borrador';
            break;
          case 'expired':
            tiempoRestanteStr = 'Expirada';
            break;
          case 'cancelled':
            tiempoRestanteStr = 'Cancelada';
            break;
          default:
            tiempoRestanteStr = 'Estado desconocido';
        }
        
        const nombreDelPlan = planes.find(p => p.id === anuncio.plan)?.name || String(anuncio.plan);
        const nombreDeCampania = campanias.find(c => c.id === anuncio.campaniaId)?.name;

        return {
          ...anuncio,
          previewImageUrl,
          tiempoRestante: tiempoRestanteStr,
          nombrePlan: nombreDelPlan,
          nombreCampania: nombreDeCampania,
        };
      });
      
      const anunciosProcesados = await Promise.all(anunciosProcesadosPromise);
      setAnunciosConPreview(anunciosProcesados);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('MisAnunciosPage: Error cargando anuncios:', errorMessage);
      setError('No se pudieron cargar tus anuncios. Inténtalo de nuevo más tarde.');
    } finally {
      setIsLoadingAnuncios(false);
    }
  }, [calcularTiempoRestante]);

  useEffect(() => {
    if (isLoadingAuth) {
      return; 
    }

    if (!currentUserUid) {
      setError('Debes iniciar sesión para ver tus anuncios.');
      setIsLoadingAnuncios(false);
      setAnunciosConPreview([]);
      return;
    }
    
    fetchAnunciosYPreviews(currentUserUid);

  }, [currentUserUid, isLoadingAuth, fetchAnunciosYPreviews]);


  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-fondo">
        <Navbar hideSettings={true} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primario" />
          <p className="mt-4 text-lg text-texto-secundario">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (error && error !== 'Debes iniciar sesión para ver tus anuncios.') { 
    return (
      <div className="min-h-screen bg-fondo">
        <Navbar hideSettings={true} />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="p-6 bg-error/10 text-error rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-3">¡Error!</h2>
            <p className="mb-4">{error}</p>
            <button 
                onClick={() => {
                    if(currentUserUid) fetchAnunciosYPreviews(currentUserUid);
                }}
                className="bg-primario text-fondo px-5 py-2 rounded-md hover:brightness-90 transition-colors font-medium"
                disabled={!currentUserUid}
            >
                Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoadingAnuncios) {
    return (
      <div className="min-h-screen bg-fondo">
        <Navbar hideSettings={true} />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primario" />
          <p className="mt-4 text-lg text-texto-secundario">Cargando tus anuncios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fondo">
      <Navbar hideSettings={true} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative mb-6 text-center">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <BotonAyuda>
              <AyudaMisAnuncios />
            </BotonAyuda>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-texto-principal inline-block">
            Mis Anuncios
          </h1>
        </div>

        <div className="text-center">
          <Link href="/planes" className="inline-block bg-primario text-fondo px-6 py-3 rounded-lg shadow hover:brightness-90 transition-colors font-semibold">
              Crear Nuevo Anuncio
          </Link>
        </div>

        {!currentUserUid && !isLoadingAuth && (
             <div className="text-center py-10 px-6 bg-tarjeta rounded-lg shadow-md max-w-lg mx-auto">
                <svg className="w-16 h-16 text-primario mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <h2 className="text-xl font-semibold text-texto-principal mb-2">Acceso Restringido</h2>
                <p className="text-md text-texto-secundario mb-6">
                Debes iniciar sesión para ver tus anuncios.
                </p>
                <Link href="/login" className="mt-4 inline-block bg-primario text-fondo px-8 py-3 rounded-lg hover:brightness-90 transition-colors font-medium text-sm">
                    Ir a Iniciar Sesión
                </Link>
            </div>
        )}

        {currentUserUid && anunciosConPreview.length === 0 && !isLoadingAnuncios && !error && (
            <div className="text-center py-10 px-6 bg-tarjeta rounded-lg shadow-md max-w-lg mx-auto">
                <h2 className="text-xl font-semibold text-texto-principal mb-2">
                No has creado anuncios
                </h2>
                <p className="text-md text-texto-secundario mb-6">
                ¡Anímate a crear el primero para empezar a promocionarte!
                </p>
                <Link href="/planes" className="mt-4 inline-block bg-primario text-fondo px-8 py-3 rounded-lg hover:brightness-90 transition-colors font-medium text-sm">
                Crear Nuevo Anuncio
                </Link>
            </div>
        )}

        {currentUserUid && anunciosConPreview.length > 0 && !isLoadingAnuncios && !error && (
          <div className="flex flex-col items-center space-y-6 md:space-y-8">
            {anunciosConPreview.map((anuncio) => (
              <div key={anuncio.id || `anuncio-fallback-${Math.random().toString(36).substring(7)}`} className="w-full max-w-md">
                <AnuncioCard anuncio={anuncio} />
              </div>
            ))}
          </div>
        )}
      </div>
      <BotonVolver />
    </div>
  );
}