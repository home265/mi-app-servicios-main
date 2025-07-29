// src/app/preview/[anuncioId]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import type { Captura, Anuncio } from '@/types/anuncio';
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/app/components/ui/Button';
import { Play, Pause, RotateCcw, Edit3, CheckCircle, AlertTriangle, Loader2, Info, LogOut } from 'lucide-react';
import { useParams } from 'next/navigation';

// Componente Principal (Wrapper)
export default function PreviewPage() {
  const paramsHook = useParams();
  const anuncioId = Array.isArray(paramsHook.anuncioId) ? paramsHook.anuncioId[0] : paramsHook.anuncioId;

  if (!anuncioId || typeof anuncioId !== 'string') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fondo text-error p-6 text-center">
        <AlertTriangle size={48} className="mb-4" />
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
  const [anuncioStatus, setAnuncioStatus] = useState<Anuncio['status'] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [reelCompleted, setReelCompleted] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  const timerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const hasFetched = useRef(false);

  // Lógica de carga de datos y carrusel (sin cambios)
  useEffect(() => {
    if (hasFetched.current || !anuncioId) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setCapturas([]);
      setAnuncioStatus(null);

      try {
        const anuncioData = await getAnuncioById(anuncioId);
        if (!anuncioData) {
          throw new Error("Anuncio no encontrado.");
        }
        setAnuncioStatus(anuncioData.status);

        const capturasData = await listCapturas(anuncioId);
        
        if (capturasData.length === 0) {
          if (anuncioData.status === 'draft' || anuncioData.status === 'pendingPayment') {
            setError("Este anuncio aún no tiene imágenes de previsualización. Por favor, completa el editor.");
          } else {
            setError("No se encontraron imágenes para mostrar en este anuncio.");
          }
        } else {
          const sortedCapturas = capturasData.sort((a, b) => a.screenIndex - b.screenIndex);
          setCapturas(sortedCapturas);
          if (sortedCapturas.length > 0) {
            setCurrentIndex(0);
            setIsPlaying(true);
            setReelCompleted(false);
          }
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar.";
        setError(`Error al cargar los datos: ${errorMessage}`);
        console.error("[CLIENT PREVIEW] Error en fetchData:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [anuncioId]);

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
        // No hacer nada
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
      setCurrentIndex(0);
      setReelCompleted(false);
      setIsPlaying(true);
      setProgress(0);
    } else {
      setIsPlaying(prev => !prev);
    }
  }, [reelCompleted]);

  // Estados visuales refactorizados
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fondo text-texto-secundario p-4">
        <Loader2 className="animate-spin h-10 w-10 text-primario mb-4" />
        <p className="text-lg font-semibold">Cargando previsualización...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fondo text-error p-6 text-center">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">¡Ups! Algo salió mal</h2>
        <p className="mb-4 text-sm whitespace-pre-line">{error}</p>
        <Link href="/planes">
          <Button variant="danger">Volver a Planes</Button>
        </Link>
      </div>
    );
  }

  if (capturas.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-fondo text-texto-principal p-6 text-center">
        <Info className="h-12 w-12 text-texto-secundario mb-4" />
        <h2 className="text-xl font-bold mb-2">Previsualización no disponible</h2>
        <p className="mb-4 text-sm text-texto-secundario">No se encontraron imágenes para este anuncio o aún se están procesando.</p>
        <p className="mb-4 text-xs">Status del Anuncio: {anuncioStatus || 'No disponible'}</p>
        <Link href="/planes">
          <Button variant="secondary">Crear otro anuncio</Button>
        </Link>
      </div>
    );
  }

  const currentCaptura = capturas[currentIndex];
  if (!currentCaptura) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-fondo text-texto-secundario">
            <p>Cargando imagen...</p>
        </div>
    );
  }

  const mostrarBotonPagar = anuncioStatus === 'draft' || anuncioStatus === 'pendingPayment';

  return (
    <div className="flex flex-col h-screen bg-fondo text-texto-principal overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1.5 bg-borde-tarjeta/50 z-20">
        <div
          className="h-full bg-texto-principal transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-grow relative flex items-center justify-center">
        <Image
          key={`${currentCaptura.imageUrl}-${currentIndex}-${animationClass || 'no-anim'}`}
          src={currentCaptura.imageUrl}
          alt={`Captura ${currentIndex + 1} del anuncio`}
          fill
          className={`object-contain ${animationClass}`}
          priority={currentIndex === 0}
          sizes="100vw"
          onError={(e) => {
            console.error(`PreviewClient: Error al cargar imagen ${currentCaptura.imageUrl}`, e);
            setError(`No se pudo cargar la imagen para la pantalla ${currentIndex + 1}.`);
            setIsPlaying(false);
          }}
        />
      </div>

      <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          <button
            onClick={handlePlayPause}
            className="bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={reelCompleted ? "Volver a Ver" : isPlaying ? "Pausar" : "Reproducir"}
          >
            {reelCompleted ? <RotateCcw size={28} /> : isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          <div className="w-full max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-3 p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
            {(() => {
              const buttonStyle = "w-full h-full flex items-center justify-center text-sm text-center py-2.5 px-3 bg-tarjeta/90 border border-borde-tarjeta hover:bg-tarjeta/100 transition-colors rounded-lg";
              const linkStyle = "w-full sm:flex-1"; 

              return (
                <>
                  <Link href={`/editor/${anuncioId}`} className={linkStyle}>
                    <Button className={buttonStyle}>
                      <Edit3 size={16} className="mr-2 shrink-0" />
                      <span>Volver a Editar</span>
                    </Button>
                  </Link>

                  {mostrarBotonPagar ? (
                    <Link href={`/pago/${anuncioId}`} className={linkStyle}>
                      <Button className={buttonStyle}>
                        <CheckCircle size={16} className="mr-2 shrink-0" />
                        <span>Continuar y Pagar</span>
                      </Button>
                    </Link>
                  ) : (
                    anuncioStatus && (
                      <Link href="/mis-anuncios" className={linkStyle}>
                        <div className={buttonStyle}>
                          <div className="flex flex-col text-center">
                            <span className="text-sm font-semibold">
                              {anuncioStatus === 'active' && 'Anuncio Activo'}
                              {anuncioStatus === 'expired' && 'Anuncio Expirado'}
                              {anuncioStatus === 'cancelled' && 'Anuncio Cancelado'}
                            </span>
                            <span className="text-xs underline">
                              Ver mis anuncios
                            </span>
                          </div>
                        </div>
                      </Link>
                    )
                  )}

                  <Link href="/bienvenida" className={linkStyle}>
                    <Button className={buttonStyle}>
                      <LogOut size={16} className="mr-2 shrink-0" />
                      <span>Tocar para Salir</span>
                    </Button>
                  </Link>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}