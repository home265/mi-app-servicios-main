// src/app/(main)/mis-anuncios/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useUserStore } from '@/store/userStore';
import { listAnunciosByFilter, listCapturas } from '@/lib/services/anunciosService';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Anuncio, Captura, Timestamp } from '@/types/anuncio'; // Asegúrate que Timestamp esté importado de tus tipos si es un tipo específico de Firestore
import { planes, campanias } from '@/lib/constants/anuncios';
import AnuncioCard from './components/AnuncioCard';
import Navbar from '@/app/components/common/Navbar';
import { Loader2 } from 'lucide-react'; // Para un ícono de carga más estilizado

interface AnuncioConPreview extends Anuncio {
  previewImageUrl?: string;
  tiempoRestante?: string;
  nombrePlan?: string;
  nombreCampania?: string;
}

// Función auxiliar para convertir Timestamp de Firestore a Date
function convertTimestampToDate(timestamp: Timestamp | Date | string | undefined): Date | undefined {
  if (!timestamp) return undefined;
  if (timestamp instanceof Date) return timestamp;
  // Comprobamos si es un objeto Timestamp de Firestore (suele tener el método toDate)
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return (timestamp as Timestamp).toDate();
  }
  // Si es un string, intentamos crear una fecha
  if (typeof timestamp === 'string') {
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) { // Verifica si la fecha es válida
        return date;
    }
  }
  console.warn("No se pudo convertir el valor de fecha:", timestamp);
  return undefined; // Retorna undefined si no se puede convertir
}


export default function MisAnunciosPage() {
  const currentUserUid = useUserStore(state => state.currentUser?.uid);
  const isLoadingAuth = useUserStore(state => state.isLoadingAuth);

  const [anunciosConPreview, setAnunciosConPreview] = useState<AnuncioConPreview[]>([]);
  const [isLoadingAnuncios, setIsLoadingAnuncios] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularTiempoRestante = useCallback((endDate?: Date): string => { // endDate ahora es Date
    if (!endDate) return 'No disponible';

    const ahora = new Date();
    if (endDate <= ahora) return "Finalizada"; // O "Expirada" si prefieres

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
      // Tu filtro actual es { creatorId: userId }, si listAnunciosByFilter lo espera así, está bien.
      // Si debe ser ('creatorId', '==', userId) o similar, ajusta la llamada.
      // Por ahora, asumo que tu servicio `listAnunciosByFilter` maneja bien el objeto.
      // Si `listAnunciosByFilter` espera un campo y un valor, sería:
      // const misAnuncios = await listAnunciosByFilter('creatorId', userId);
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
            // Intenta obtener la captura de la pantalla 0 como preview, sino la última o la primera.
            const capturaScreen0 = capturasAnuncio.find(c => c.screenIndex === 0);
            if (capturaScreen0) {
                previewImageUrl = capturaScreen0.imageUrl;
            } else if (capturasAnuncio.length > 0) {
                // Fallback a la primera captura disponible si la pantalla 0 no existe
                // o la última si así lo preferías: capturasAnuncio[capturasAnuncio.length - 1]?.imageUrl;
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
        const nombreDeCampania = campanias.find(c => c.id === anuncio.campaniaId)?.name; // Si no hay, será undefined, lo que está bien.

        return {
          ...anuncio,
          previewImageUrl,
          tiempoRestante: tiempoRestanteStr,
          nombrePlan: nombreDelPlan,
          nombreCampania: nombreDeCampania, // Puede ser undefined si no existe
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
  }, [calcularTiempoRestante]); // Dependencia de useCallback

  useEffect(() => {
    if (isLoadingAuth) {
      return; // Espera a que la autenticación termine
    }

    if (!currentUserUid) {
      setError('Debes iniciar sesión para ver tus anuncios.');
      setIsLoadingAnuncios(false);
      setAnunciosConPreview([]);
      return;
    }
    
    // Solo llama si currentUserUid está definido
    fetchAnunciosYPreviews(currentUserUid);

  }, [currentUserUid, isLoadingAuth, fetchAnunciosYPreviews]);


  // Estados de Carga y Error Mejorados
  if (isLoadingAuth) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primario" />
          <p className="mt-4 text-lg text-[var(--color-texto-secundario)]">Verificando sesión...</p>
        </div>
      </>
    );
  }

  // Nota: El error de "Debes iniciar sesión" ya se maneja arriba y previene la carga.
  // Este 'error' sería para errores de fetchAnunciosYPreviews.
  if (error && error !== 'Debes iniciar sesión para ver tus anuncios.') { 
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="p-6 bg-[var(--color-fondo-error)] text-[var(--color-texto-error)] rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-3">¡Error!</h2>
            <p className="mb-4">{error}</p>
            <button 
                onClick={() => {
                    if(currentUserUid) fetchAnunciosYPreviews(currentUserUid);
                }}
                className="bg-primario text-white px-5 py-2 rounded-md hover:bg-primario-dark transition-colors font-medium"
                disabled={!currentUserUid} // Deshabilitar si no hay usuario para reintentar
            >
                Reintentar
            </button>
          </div>
        </div>
      </>
    );
  }
  
  if (isLoadingAnuncios) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-var(--navbar-height,80px))] p-4">
          <Loader2 className="h-12 w-12 animate-spin text-primario" />
          <p className="mt-4 text-lg text-[var(--color-texto-secundario)]">Cargando tus anuncios...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-texto-principal)]">Mis Anuncios</h1>
          <Link href="/(ads)/planes" className="w-full sm:w-auto bg-primario text-white px-6 py-3 rounded-lg shadow hover:bg-primario-dark transition-colors font-semibold text-center">
              Crear Nuevo Anuncio
          </Link>
        </div>

        {/* Mensaje si no hay usuario y no está cargando auth (ya manejado por useEffect) */}
        {!currentUserUid && !isLoadingAuth && (
             <div className="text-center py-10 px-6 bg-[var(--color-tarjeta)] rounded-lg shadow-md max-w-lg mx-auto">
                <svg className="w-16 h-16 text-primario mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                <h2 className="text-xl font-semibold text-[var(--color-texto-principal)] mb-2">Acceso Restringido</h2>
                <p className="text-md text-[var(--color-texto-secundario)] mb-6">
                Debes iniciar sesión para ver tus anuncios.
                </p>
                <Link href="/(auth)/login" className="mt-4 inline-block bg-primario text-white px-8 py-3 rounded-lg hover:bg-primario-dark transition-colors font-medium text-sm">
                    Ir a Iniciar Sesión
                </Link>
            </div>
        )}

        {/* Solo muestra el estado vacío o la lista si hay usuario */}
        {currentUserUid && anunciosConPreview.length === 0 && !isLoadingAnuncios && !error && (
          <div className="text-center py-10">
             <div className="relative mx-auto mb-6 h-40 w-40 sm:h-48 sm:w-48 opacity-70">
                <Image
                    src="/images/empty-state/no-ads.svg" // Asegúrate que esta imagen exista
                    alt="Sin anuncios"
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 160px, 192px"
                />
            </div>
            <p className="text-xl text-[var(--color-texto-secundario)] mb-4">
              Aún no tienes anuncios creados.
            </p>
            <Link href="/(ads)/planes" className="bg-primario text-white px-6 py-3 rounded-lg shadow hover:bg-primario-dark transition-colors font-semibold">
              ¡Crea tu Primer Anuncio!
            </Link>
          </div>
        )}

        {currentUserUid && anunciosConPreview.length > 0 && !isLoadingAnuncios && !error && (
          // LISTADO DE ANUNCIOS VERTICAL Y CENTRADO
          <div className="flex flex-col items-center space-y-6 md:space-y-8">
            {anunciosConPreview.map((anuncio) => (
              // Aplicamos un ancho máximo a cada card para el diseño de una sola columna
              // Usamos un fallback para la key si anuncio.id fuera undefined (aunque AnuncioCard lo maneja)
              <div key={anuncio.id || `anuncio-fallback-${Math.random().toString(36).substring(7)}`} className="w-full max-w-md"> {/* Ajusta max-w-md (medium) como prefieras: sm, lg, xl */}
                <AnuncioCard anuncio={anuncio} />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}