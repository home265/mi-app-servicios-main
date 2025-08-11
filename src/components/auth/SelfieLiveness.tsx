// src/components/auth/SelfieLiveness.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import {
  FaceDetector,
  FilesetResolver,
  FaceDetectorResult,
} from '@mediapipe/tasks-vision';

// Tipos para el estado de la prueba de vida
type LivenessState =
  | 'INITIAL' | 'LOADING_MODEL' | 'MODEL_LOADED' | 'INITIALIZING_CAMERA'
  | 'DETECTING_CENTER' | 'CENTER_DETECTED' | 'DETECTING_TURN' | 'TURN_DETECTED'
  | 'DETECTING_RETURN' | 'SUCCESS' | 'FAILED_ATTEMPT' | 'FAILED_NO_ATTEMPTS'
  | 'ERROR_SETUP';

const ACTIVE_LIVENESS_STATES: LivenessState[] = [
  'DETECTING_CENTER', 'CENTER_DETECTED', 'DETECTING_TURN', 'TURN_DETECTED', 'DETECTING_RETURN'
];

// Definimos las props que el componente recibirá desde la página principal
interface SelfieLivenessProps {
  onSelfieCaptured: (imageDataUrl: string) => void;
  onLivenessFailed: () => void;
  isProcessing: boolean;
}

const SelfieLiveness: React.FC<SelfieLivenessProps> = ({ onSelfieCaptured, onLivenessFailed, isProcessing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const [livenessStatus, setLivenessStatus] = useState<LivenessState>('LOADING_MODEL');
  const [attempts, setAttempts] = useState<number>(3);
  const [uiMessage, setUiMessage] = useState<string>('Iniciando componentes de verificación...');
  const [error, setError] = useState<string | null>(null);

  const initialFaceMetricsRef = useRef<{ noseX: number; faceWidth: number } | null>(null);

  // 2. Cargar el modelo FaceDetector de MediaPipe
  useEffect(() => {
    if (livenessStatus !== 'LOADING_MODEL') return;
    const loadFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`, delegate: "GPU" },
          runningMode: "VIDEO", minDetectionConfidence: 0.5,
        });
        setFaceDetector(detector);
        setLivenessStatus('MODEL_LOADED');
        setUiMessage('Componentes listos.');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setError('No se pudo iniciar la verificación facial. Revisa los permisos o intenta recargar.');
        setLivenessStatus('ERROR_SETUP');
      }
    };
    loadFaceDetector();
  }, [livenessStatus]);

  // 3. Inicializar la cámara
  useEffect(() => {
    const currentVideoElement = videoRef.current;
    if (livenessStatus !== 'MODEL_LOADED' || !faceDetector || isCameraReady) return;

    setLivenessStatus('INITIALIZING_CAMERA');
    setUiMessage('Iniciando cámara...');
    let localStreamTracks: MediaStreamTrack[] | null = null;

    if (currentVideoElement) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
        .then(stream => {
          localStreamTracks = stream.getTracks();
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              if (videoRef.current) {
                videoRef.current.play().then(() => {
                  setIsCameraReady(true);
                  setLivenessStatus('DETECTING_CENTER');
                  setUiMessage('Por favor, mira al frente y centra tu rostro.');
                }).catch(() => {
                  setError('Problema al iniciar el video de la cámara.');
                  setLivenessStatus('ERROR_SETUP');
                });
              }
            };
          } else {
            if (localStreamTracks) localStreamTracks.forEach(track => track.stop());
          }
        })
        .catch(() => {
          setError('No se pudo acceder a la cámara. Verifica los permisos e intenta de nuevo.');
          setLivenessStatus('ERROR_SETUP');
        });
    }

    return () => {
      if (localStreamTracks) localStreamTracks.forEach(track => track.stop());
      if (currentVideoElement && currentVideoElement.srcObject) {
        (currentVideoElement.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
        currentVideoElement.srcObject = null;
      }
    };
  }, [livenessStatus, faceDetector, isCameraReady]);

  // 4. Lógica de MediaPipe
  const detectFaceAndLiveness = useCallback(() => {
    if (!isCameraReady || !faceDetector || !videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
    if (!ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      return;
    }

    const video = videoRef.current;
    const result: FaceDetectorResult = faceDetector.detectForVideo(video, performance.now());
    if (result.detections.length > 0) {
      const face = result.detections[0];
      const { boundingBox, keypoints } = face;
      const noseTip = keypoints.find(k => k.label === 'NoseTip') || keypoints[2];
      if (boundingBox && noseTip) {
        const faceCenterX = boundingBox.originX + boundingBox.width / 2;
        const videoCenterX = video.videoWidth / 2;
        switch (livenessStatus) {
          case 'DETECTING_CENTER':
            if (Math.abs(faceCenterX - videoCenterX) < video.videoWidth * 0.2 && boundingBox.width > video.videoWidth * 0.3) {
              setUiMessage('¡Bien! Mantén la posición...');
              initialFaceMetricsRef.current = { noseX: noseTip.x, faceWidth: boundingBox.width };
              setTimeout(() => { if (getComputedStyle(video).display !== 'none') { setLivenessStatus('CENTER_DETECTED'); setUiMessage('Ahora, gira tu cabeza lentamente hacia un lado.'); }}, 1000);
            } else { setUiMessage('Intenta centrar tu rostro y acercarte un poco.'); }
            break;
          case 'CENTER_DETECTED': setLivenessStatus('DETECTING_TURN'); break;
          case 'DETECTING_TURN':
            if (initialFaceMetricsRef.current) {
              if (Math.abs((noseTip.x * video.videoWidth) - (initialFaceMetricsRef.current.noseX * video.videoWidth)) > initialFaceMetricsRef.current.faceWidth * 0.4) {
                setUiMessage('¡Giro detectado!');
                setTimeout(() => { if (getComputedStyle(video).display !== 'none') { setLivenessStatus('TURN_DETECTED'); setUiMessage('Perfecto. Vuelve a mirar al frente.'); }}, 500);
              }
            }
            break;
          case 'TURN_DETECTED': setLivenessStatus('DETECTING_RETURN'); break;
          case 'DETECTING_RETURN':
            if (initialFaceMetricsRef.current) {
              if (Math.abs((noseTip.x * video.videoWidth) - (initialFaceMetricsRef.current.noseX * video.videoWidth)) < initialFaceMetricsRef.current.faceWidth * 0.15) {
                setUiMessage('¡Excelente! Prueba de vida completada.');
                setLivenessStatus('SUCCESS');
              }
            }
            break;
        }
      }
    } else { setUiMessage('Asegúrate de que tu rostro esté visible.'); }
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
  }, [faceDetector, livenessStatus, isCameraReady]);

  // 5. Manejadores de ciclo y reintentos
  useEffect(() => {
    if (isCameraReady && faceDetector && ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
    }
    return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [isCameraReady, faceDetector, livenessStatus, detectFaceAndLiveness]);

  useEffect(() => {
    let attemptTimerId: NodeJS.Timeout | null = null;
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      attemptTimerId = setTimeout(() => {
        if (livenessStatus !== 'SUCCESS') {
          const newAttempts = attempts - 1;
          setAttempts(newAttempts);
          if (newAttempts > 0) {
            setUiMessage(`Intento fallido. Quedan ${newAttempts} intentos. Prepárate...`);
            setLivenessStatus('FAILED_ATTEMPT');
          } else {
            setUiMessage('Has agotado tus intentos.');
            setError('Verificación fallida. Serás redirigido.');
            setLivenessStatus('FAILED_NO_ATTEMPTS');
            onLivenessFailed();
          }
        }
      }, 25000);
    }
    return () => { if (attemptTimerId) clearTimeout(attemptTimerId); };
  }, [livenessStatus, attempts, onLivenessFailed]);

  useEffect(() => {
    if (livenessStatus === 'FAILED_ATTEMPT') {
      if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop()); }
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      setTimeout(() => {
        setLivenessStatus('INITIAL'); initialFaceMetricsRef.current = null; setIsCameraReady(false); setError(null);
        setUiMessage('Reiniciando para el siguiente intento...');
      }, 2000);
    } else if (livenessStatus === 'INITIAL') {
        setTimeout(() => setLivenessStatus('LOADING_MODEL'), 50);
    }
  }, [livenessStatus]);
  
  // 6. Captura final y comunicación con el padre
  const handleCapturarSelfie = () => {
    if (!videoRef.current || !canvasRef.current || livenessStatus !== 'SUCCESS') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSelfieCaptured(imageDataUrl); // Notifica a la página que la selfie está lista
    } else {
      setError('No se pudo procesar la imagen de la selfie.');
    }
  };

  // 7. Lógica de Renderizado
  if (livenessStatus === 'FAILED_ATTEMPT' && !error) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <Logo />
        <p className="text-xl text-yellow-400 mb-4">Intento Fallido</p>
        <p className="mb-6 text-center text-lg">{uiMessage}</p>
        <p className="animate-pulse text-md">Reiniciando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-4 text-error">
        <Logo />
        <p className="text-2xl font-bold mb-4">Error en la Verificación</p>
        <p className="mb-6 text-center text-lg">{error}</p>
        <Button onClick={onLivenessFailed}>Volver a Iniciar Registro</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <p className="text-center text-xs text-texto-secundario md:text-sm">Intentos restantes: {attempts}</p>
      <p className="h-9 flex items-center justify-center text-center text-xs md:text-sm text-texto-secundario">{uiMessage}</p>
      <div className="relative mx-auto my-2 flex items-center justify-center w-full pt-[75%] rounded-lg overflow-hidden border-2 border-primario bg-gray-700">
        <video ref={videoRef} playsInline autoPlay muted className="absolute inset-0 h-full w-full object-cover transform scale-x-[-1]" />
        {!isCameraReady && <div className="absolute inset-0 flex items-center justify-center bg-gray-700/50"><p className="animate-pulse text-white text-sm md:text-base">Configurando cámara…</p></div>}
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {livenessStatus === 'SUCCESS' && (
        <Button onClick={handleCapturarSelfie} disabled={isProcessing} fullWidth className="mt-2">
          {isProcessing ? 'Procesando Selfie…' : 'Tomar Selfie y Continuar'}
        </Button>
      )}
    </div>
  );
};

export default SelfieLiveness;