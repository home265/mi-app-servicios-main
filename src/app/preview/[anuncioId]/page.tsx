// src/app/preview/[anuncioId]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
// MODIFICADO: Importar Anuncio y getAnuncioById y AHORA useParams
import type { Captura, Anuncio } from '@/types/anuncio';
import { getAnuncioById } from '@/lib/services/anunciosService'; 
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import { Play, Pause, RotateCcw, Edit3, CheckCircle, AlertTriangle, Loader2, Info } from 'lucide-react';
import { useParams } from 'next/navigation'; // <<---- AÑADIR ESTA IMPORTACIÓN

// YA NO NECESITAS ESTA INTERFAZ AQUÍ SI USAS useParams
// interface PreviewPageProps {
// params: {
// anuncioId: string;
//   };
// }

// Componente Principal (Wrapper)
export default function PreviewPage(/* YA NO RECIBE params COMO PROP */) {
  const paramsHook = useParams(); // Usamos el hook
  // paramsHook.anuncioId puede ser string o string[]. Para rutas como /preview/[id], será string.
  // Si fuera una ruta catch-all como /preview/[...slug], sería string[].
  const anuncioId = Array.isArray(paramsHook.anuncioId) ? paramsHook.anuncioId[0] : paramsHook.anuncioId;

  if (!anuncioId || typeof anuncioId !== 'string') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-700 p-6 text-center">
        <AlertTriangle size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold mb-2">Error de Carga</h2>
        <p>No se pudo obtener el identificador del anuncio desde la URL.</p>
      </div>
    );
  }

  return <PreviewClient anuncioId={anuncioId} />;
}

// --- Componente Cliente Interno para la Lógica de Previsualización ---
interface PreviewClientProps {
  anuncioId: string;
}

function PreviewClient({ anuncioId }: PreviewClientProps) {
  const [capturas, setCapturas] = useState<Captura[]>([]);
  // NUEVO: Estado para almacenar el status del anuncio
  const [anuncioStatus, setAnuncioStatus] = useState<Anuncio['status'] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Carga general (capturas y anuncio)
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reelCompleted, setReelCompleted] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasFetched = useRef(false); // Para evitar doble fetch

  // Cargar capturas y datos del anuncio
  useEffect(() => {
    if (hasFetched.current || !anuncioId) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setCapturas([]);
      setAnuncioStatus(null); // Resetear status

      try {
        // Fetch del anuncio para obtener el status
        const anuncioData = await getAnuncioById(anuncioId);
        if (!anuncioData) {
          throw new Error("Anuncio no encontrado.");
        }
        setAnuncioStatus(anuncioData.status);

        // Fetch de las capturas
        const response = await fetch(`/api/anuncios/${anuncioId}/capturas`);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error del servidor al cargar capturas: ${response.status} ${response.statusText}. ${text ? `Detalle: ${text}` : ''}`);
        }
        const capturasData: Captura[] | { error: string } = await response.json();

        if (Array.isArray(capturasData)) {
          if (capturasData.length === 0) {
            setError("No se encontraron imágenes para mostrar en este anuncio.");
          } else {
            const sortedCapturas = capturasData.sort((a, b) => a.screenIndex - b.screenIndex);
            setCapturas(sortedCapturas);
            if (sortedCapturas.length > 0) {
              setCurrentIndex(0);
              setIsPlaying(true);
              setReelCompleted(false);
            }
          }
        } else if (capturasData && typeof capturasData.error === 'string') {
          setError(capturasData.error);
        } else {
          setError("No se pudieron cargar los datos de las capturas (formato inesperado).");
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar.";
        setError(`Error al cargar los datos: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [anuncioId]);

  // Efecto para manejar el carrusel y la animación (sin cambios en su lógica interna)
  useEffect(() => {
    const cleanupTimers = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      timerRef.current = null;
      intervalRef.current = null;
    };

    if (!isPlaying || isLoading || error || capturas.length === 0 || reelCompleted) {
      cleanupTimers();
      if (reelCompleted && !isPlaying) {
        setProgress(100);
      } else if (!isPlaying && capturas.length > 0 && !reelCompleted) {
        // No hacer nada con el progreso si está pausado
      } else {
        setProgress(0);
      }
      setAnimationClass('');
      return;
    }

    cleanupTimers();
    const currentCaptura = capturas[currentIndex];
    if (!currentCaptura) {
        setIsPlaying(false);
        return;
    }

    const durationSeconds = (typeof currentCaptura.durationSeconds === 'number' && currentCaptura.durationSeconds > 0)
      ? currentCaptura.durationSeconds
      : 5;

    const effect = currentCaptura.animationEffect;
    if (effect && effect !== 'none') {
      setAnimationClass(`anim-${effect}`);
    } else {
      setAnimationClass('');
    }

    setProgress(0);
    const totalMs = durationSeconds * 1000;
    const progressInterval = 100;
    const step = totalMs > 0 ? (100 / (totalMs / progressInterval)) : 0;

    if (step > 0) {
      intervalRef.current = window.setInterval(() => {
        setProgress(p => Math.min(p + step, 100));
      }, progressInterval);
    } else {
      setProgress(100);
    }

    timerRef.current = window.setTimeout(() => {
      if (currentIndex < capturas.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
        setReelCompleted(true);
        setProgress(100);
        setAnimationClass('');
      }
    }, totalMs);

    return () => {
      cleanupTimers();
    };
  }, [capturas, currentIndex, isLoading, error, isPlaying, reelCompleted]);

  const handlePlayPause = useCallback(() => {
    if (reelCompleted) {
      setCapturas(prevCapturas => [...prevCapturas]);
      setCurrentIndex(0);
      setReelCompleted(false);
      setIsPlaying(true);
      setProgress(0);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [reelCompleted]);


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-300 p-4">
        <Loader2 className="animate-spin h-10 w-10 text-blue-400 mb-4" />
        <p className="text-lg font-semibold">Cargando previsualización...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-900/20 text-red-300 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">¡Ups! Algo salió mal</h2>
        <p className="mb-4 text-sm">{error}</p>
        <Link href="/(ads)/planes" passHref legacyBehavior>
            <a className="mt-4">
                <Button variant="primary" className="bg-red-500 hover:bg-red-600">Volver a Planes</Button>
            </a>
        </Link>
      </div>
    );
  }

  if (capturas.length === 0 && !isLoading) { // Asegurar que no esté cargando
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-300 p-6 text-center">
        <Info className="h-12 w-12 text-gray-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Previsualización no disponible</h2>
        <p className="mb-4 text-sm">No se encontraron imágenes para este anuncio o aún se están procesando.</p>
        <p className="mb-4 text-xs">Status del Anuncio: {anuncioStatus || 'No disponible'}</p>
        <Link href="/(ads)/planes" passHref legacyBehavior>
            <a className="mt-4">
                <Button variant="secondary">Crear otro anuncio</Button>
            </a>
        </Link>
      </div>
    );
  }

  const currentCaptura = capturas[currentIndex];
  if (!currentCaptura) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-300">
            <p>Cargando imagen...</p>
        </div>
    );
  }

  // Lógica para mostrar el botón de pago
  const mostrarBotonPagar = anuncioStatus === 'draft' || anuncioStatus === 'pendingPayment';

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700/50 z-20">
        <div
          className="h-full bg-white transition-width duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-grow relative flex items-center justify-center">
        <Image
          key={`${currentCaptura.imageUrl}-${currentIndex}-${animationClass}`}
          src={currentCaptura.imageUrl}
          alt={`Captura ${currentIndex + 1} del anuncio`}
          fill
          className={`object-contain ${animationClass}`}
          priority={currentIndex === 0}
          sizes="100vw"
          onError={(e) => {
            console.error(`PreviewClient: Error al cargar imagen ${currentCaptura.imageUrl}`, e);
            // Podrías intentar cargar una imagen de fallback o mostrar un mensaje más específico
            setError(`No se pudo cargar la imagen para la pantalla ${currentIndex + 1}. Verifica la URL o la conexión.`);
            setIsPlaying(false);
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
        <div></div> {/* Controles Superiores (Vacío) */}

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={reelCompleted ? "Volver a Ver" : isPlaying ? "Pausar" : "Reproducir"}
          >
            {reelCompleted ? <RotateCcw size={28} /> : isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>

          <div className="w-full flex justify-around items-center p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
            {/* MODIFICADO: El enlace al editor debe ser a la ruta correcta sin "editar" */}
            <Link href={`/editor/${anuncioId}`} className="w-full"> {/* O la clase que necesites */}
  <Button variant="secondary" className="w-full text-sm py-2.5 px-3"> {/* Mantén las clases en Button si son para el botón mismo */}
    <Edit3 size={16} className="mr-1.5" />
    Volver a Editar
  </Button>
</Link>

            {/* MODIFICADO: Renderizado condicional del botón de pago */}
            {mostrarBotonPagar ? (
              <Link href={`/pago/${anuncioId}`} className="w-full"> {/* O la clase que necesites */}
  <Button variant="primary" className="w-full text-sm py-2 px-3"> {/* Mantén las clases en Button */}
    <CheckCircle size={16} className="mr-1.5" />
    Continuar y Pagar
  </Button>
</Link>
            ) : (
              anuncioStatus && ( // Mostrar información si no se muestra el botón de pagar y ya tenemos el status
                <div className="text-center">
                    <p className="text-sm font-semibold">
                        {anuncioStatus === 'active' && 'Anuncio Activo'}
                        {anuncioStatus === 'expired' && 'Anuncio Expirado'}
                        {anuncioStatus === 'cancelled' && 'Anuncio Cancelado'}
                    </p>
                    {/* Podrías añadir un Link a "Mis Anuncios" aquí si el anuncio no es 'draft' o 'pendingPayment' */}
                    { (anuncioStatus === 'active' || anuncioStatus === 'expired' || anuncioStatus === 'cancelled') && (
                        <Link href="/mis-anuncios" className="text-xs text-blue-400 hover:text-blue-300 mt-1">
  Ver mis anuncios
</Link>
                    )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}