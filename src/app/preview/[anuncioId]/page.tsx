// src/app/preview/[anuncioId]/page.tsx
'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
// MODIFICADO: Importar Anuncio y getAnuncioById y AHORA useParams Y listCapturas
import type { Captura, Anuncio } from '@/types/anuncio';
import { getAnuncioById, listCapturas } from '@/lib/services/anunciosService'; // Asegúrate que listCapturas esté aquí
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

  useEffect(() => {
    if (hasFetched.current || !anuncioId) return;
    hasFetched.current = true;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setCapturas([]);
      setAnuncioStatus(null);

      try {
        console.log(`[CLIENT PREVIEW] Fetching anuncio data for ID: ${anuncioId}`);
        const anuncioData = await getAnuncioById(anuncioId);
        if (!anuncioData) {
          throw new Error("Anuncio no encontrado.");
        }
        setAnuncioStatus(anuncioData.status);
        console.log(`[CLIENT PREVIEW] Anuncio status: ${anuncioData.status}`);

        // ----- INICIO DEL CAMBIO: Cargar capturas directamente -----
        console.log(`[CLIENT PREVIEW] Fetching capturas directamente para anuncio ID: ${anuncioId}`);
        const capturasData = await listCapturas(anuncioId); // Llamada directa al servicio
        console.log(`[CLIENT PREVIEW] Capturas cargadas directamente: ${capturasData.length}`);

        // La función listCapturas debería devolver Captura[] o lanzar un error.
        // No necesitamos verificar `Array.isArray` si el tipo de retorno de listCapturas es Captura[]
        // y el manejo de errores está dentro de listCapturas o se propaga aquí.
        if (capturasData.length === 0) {
          // Considerar si el anuncio es 'draft' o 'pendingPayment' y aún no tiene capturas.
          if (anuncioData.status === 'draft' || anuncioData.status === 'pendingPayment') {
            setError("Este anuncio aún no tiene imágenes de previsualización. Por favor, completa el editor.");
          } else {
            setError("No se encontraron imágenes para mostrar en este anuncio.");
          }
        } else {
          // El sort ya no es necesario si listCapturas las devuelve ordenadas.
          // Si listCapturas no las ordena, mantenemos el sort:
          const sortedCapturas = capturasData.sort((a, b) => a.screenIndex - b.screenIndex);
          setCapturas(sortedCapturas);
          if (sortedCapturas.length > 0) {
            setCurrentIndex(0);
            setIsPlaying(true);
            setReelCompleted(false);
          }
        }
        // ----- FIN DEL CAMBIO -----

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar.";
        // El error "Missing or insufficient permissions" debería aparecer aquí si las reglas fallan
        // incluso con la llamada directa del cliente (lo cual no debería pasar si el usuario es el creador).
        setError(`Error al cargar los datos: ${errorMessage}`);
        console.error("[CLIENT PREVIEW] Error en fetchData:", err);
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
      : 5; // Default a 5 segundos si no está definido o es inválido

    const effect = currentCaptura.animationEffect;
    if (effect && effect !== 'none') {
      setAnimationClass(`anim-${effect}`);
    } else {
      setAnimationClass('');
    }

    setProgress(0);
    const totalMs = durationSeconds * 1000;
    const progressInterval = 100; // ms
    const step = totalMs > 0 ? (100 / (totalMs / progressInterval)) : 0;

    if (step > 0) {
      intervalRef.current = window.setInterval(() => {
        setProgress(p => Math.min(p + step, 100));
      }, progressInterval);
    } else {
      // Si la duración es 0 o inválida, completar inmediatamente.
      setProgress(100);
    }

    timerRef.current = window.setTimeout(() => {
      if (currentIndex < capturas.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
        setReelCompleted(true);
        setProgress(100); // Asegurar que la barra se llene al completar
        setAnimationClass(''); // Limpiar animación al final
      }
    }, totalMs);

    return () => {
      cleanupTimers();
    };
  }, [capturas, currentIndex, isLoading, error, isPlaying, reelCompleted]);

  const handlePlayPause = useCallback(() => {
    if (reelCompleted) {
      // Reiniciar el reel
      // No es necesario setCapturas(prevCapturas => [...prevCapturas]); si las capturas no cambian
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

  // El mensaje de error se mostrará formateado desde el estado `error`
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-900/20 text-red-300 p-6 text-center">
        <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">¡Ups! Algo salió mal</h2>
        {/* Usar whitespace-pre-line para respetar saltos de línea si el error los tuviera */}
        <p className="mb-4 text-sm whitespace-pre-line">{error}</p>
        <Link href="/planes" passHref legacyBehavior>
            <a className="mt-4">
                <Button variant="primary" className="bg-red-500 hover:bg-red-600">Volver a Planes</Button>
            </a>
        </Link>
      </div>
    );
  }

  if (capturas.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-300 p-6 text-center">
        <Info className="h-12 w-12 text-gray-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">Previsualización no disponible</h2>
        <p className="mb-4 text-sm">No se encontraron imágenes para este anuncio o aún se están procesando.</p>
        <p className="mb-4 text-xs">Status del Anuncio: {anuncioStatus || 'No disponible'}</p>
        <Link href="/planes" passHref legacyBehavior>
            <a className="mt-4">
                <Button variant="secondary">Crear otro anuncio</Button>
            </a>
        </Link>
      </div>
    );
  }

  const currentCaptura = capturas[currentIndex];
  // Esta verificación es buena, aunque si capturas.length > 0, currentCaptura (con currentIndex = 0) debería existir.
  if (!currentCaptura) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-300">
            <p>Cargando imagen...</p> {/* O un mensaje de error más específico */}
        </div>
    );
  }

  const mostrarBotonPagar = anuncioStatus === 'draft' || anuncioStatus === 'pendingPayment';

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden relative">
      {/* Barra de Progreso */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-700/50 z-20">
        <div
          className="h-full bg-white transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Visor de Imagen */}
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
            setError(`No se pudo cargar la imagen para la pantalla ${currentIndex + 1}. Verifica la URL o la conexión.`);
            setIsPlaying(false);
          }}
        />
      </div>

      {/* Controles Inferiores */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 z-10 pointer-events-none">
        <div className="flex flex-col items-center gap-4 pointer-events-auto">
          <button
            onClick={handlePlayPause}
            className="bg-black/40 text-white p-3 rounded-full hover:bg-black/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label={reelCompleted ? "Volver a Ver" : isPlaying ? "Pausar" : "Reproducir"}
          >
            {reelCompleted ? <RotateCcw size={28} /> : isPlaying ? <Pause size={28} /> : <Play size={28} />}
          </button>
          
          {/* --- CÓDIGO FINAL --- */}
          {/* Usamos flexbox para forzar que los 3 elementos ocupen el mismo espacio */}
          <div className="w-full max-w-lg mx-auto flex flex-col sm:flex-row items-center gap-3 p-3 bg-gradient-to-t from-black/70 via-black/50 to-transparent">
            
            {(() => {
              const buttonStyle = "w-full h-full flex items-center justify-center text-sm text-center py-2.5 px-3 bg-neutral-800/90 border border-white/75 hover:bg-neutral-700/90 transition-colors rounded-lg";
              
              // Esta es la clase clave: w-full para móvil, sm:flex-1 para escritorio
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
        // --- INICIO DE LA SECCIÓN MODIFICADA ---
        // Ahora todo este bloque es un enlace con el estilo de los otros botones.
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
        // --- FIN DE LA SECCIÓN MODIFICADA ---
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