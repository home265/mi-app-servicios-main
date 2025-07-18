/* eslint-disable @next/next/no-img-element */
// src/app/(auth)/registro/selfie/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import Logo from '@/app/components/ui/Logo';
import {
  FaceDetector,
  FilesetResolver,
  FaceDetectorResult
} from '@mediapipe/tasks-vision';

// Se eliminan los imports de Firebase y bcrypt, ya que esa lógica ahora vive en la API.
import { useTheme } from 'next-themes';

interface StoredFormData {
  nombre?: string;
  apellido?: string;
  email?: string;
  contrasena?: string;
  pin?: string;
  localidad?: { id: string; nombre: string; provinciaNombre: string } | null;
  seleccionCategoria?: { categoria: string; subcategoria: string | null } | null;
  seleccionRubro?: { rubro: string; subrubro: string | null } | null;
  matricula?: string;
  cuilCuit?: string;
  descripcion?: string;
  telefono?: string;
}

type LivenessState =
  | "INITIAL"
  | "LOADING_MODEL"
  | "MODEL_LOADED"
  | "INITIALIZING_CAMERA"
  | "DETECTING_CENTER"
  | "CENTER_DETECTED"
  | "DETECTING_TURN"
  | "TURN_DETECTED"
  | "DETECTING_RETURN"
  | "SUCCESS"
  | "FAILED_ATTEMPT"
  | "FAILED_NO_ATTEMPTS"
  | "ERROR_SETUP";

const ACTIVE_LIVENESS_STATES: LivenessState[] = [
  "DETECTING_CENTER", "CENTER_DETECTED", "DETECTING_TURN", "TURN_DETECTED", "DETECTING_RETURN"
];

export default function SelfiePage() {
  console.log("SelfiePage RENDERIZANDO INICIO - Timestamp:", Date.now());
  const router = useRouter();

  const [formData, setFormData] = useState<StoredFormData | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string>("Cargando información...");
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState<boolean>(false);
  const datosInicialesProcesadosRef = useRef(false);
  const [livenessStatus, setLivenessStatus] = useState<LivenessState>("INITIAL");
  const [attempts, setAttempts] = useState<number>(3);
  // Se cambia el estado de la selfie a una ref para evitar re-renders innecesarios.
  const selfieImageDataUrlRef = useRef<string | null>(null);
  const initialFaceMetricsRef = useRef<{ noseX: number; faceWidth: number } | null>(null);

  // 1. Cargar datos del formulario desde sessionStorage (SIN CAMBIOS)
  useEffect(() => {
    if (!formData && !datosInicialesProcesadosRef.current) {
      console.log("SelfiePage: Hook #1 [SessionStorage] - Leyendo datos iniciales...");
      setUiMessage("Cargando información de registro...");
      const storedDataString = sessionStorage.getItem('registroFormData');
      const storedRol = sessionStorage.getItem('registroFormRol');

      console.log("SelfiePage: Hook #1 [SessionStorage] - storedDataString:", storedDataString ? "Encontrado" : "NO Encontrado");
      console.log("SelfiePage: Hook #1 [SessionStorage] - storedRol:", storedRol ? "Encontrado" : "NO Encontrado");

      if (storedDataString && storedRol) {
        try {
          const parsedData: StoredFormData = JSON.parse(storedDataString);
          setFormData(parsedData);
          setRol(storedRol);
          console.log("SelfiePage: Hook #1 [SessionStorage] - Datos del formulario y rol establecidos en el estado.");

          sessionStorage.removeItem('registroFormData');
          sessionStorage.removeItem('registroFormRol');
          console.log("SelfiePage: Hook #1 [SessionStorage] - sessionStorage limpiado.");

          setLivenessStatus("LOADING_MODEL");
        } catch (err) {
          console.error("SelfiePage: Hook #1 [SessionStorage] - Error al parsear JSON:", err);
          let friendlyMessage = "Hubo un problema al procesar tus datos de registro.";
          if (err instanceof Error) { friendlyMessage = `Error procesando datos: ${err.message}`; }
          setError(friendlyMessage);
          setLivenessStatus("ERROR_SETUP");
          setUiMessage(""); 
        }
      } else {
        console.warn("SelfiePage: Hook #1 [SessionStorage] - NO se encontraron datos o uno de ellos falta.");
        setError("No se encontraron los datos del registro. La UI mostrará opción para reiniciar.");
        setLivenessStatus("ERROR_SETUP");
        setUiMessage("");
      }
      datosInicialesProcesadosRef.current = true;
    } else if (formData && rol && livenessStatus === "INITIAL" && datosInicialesProcesadosRef.current) {
      console.log("SelfiePage: Hook #1 [SessionStorage] - Datos ya en estado (Strict Mode), asegurando transición a LOADING_MODEL.");
      setLivenessStatus("LOADING_MODEL");
    }
  }, [formData, rol, livenessStatus]);

  // 2. Cargar el modelo FaceDetector de MediaPipe (SIN CAMBIOS)
  useEffect(() => {
    if (livenessStatus !== "LOADING_MODEL") return;
    console.log("SelfiePage: Hook #2 [LoadModel] - Iniciando carga de FaceDetector. Status:", livenessStatus);
    const loadFaceDetector = async () => {
      setUiMessage("Iniciando componentes de verificación...");
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5,
        });
        setFaceDetector(detector);
        setLivenessStatus("MODEL_LOADED");
        setUiMessage("Componentes listos.");
        console.log("SelfiePage: Hook #2 [LoadModel] - FaceDetector cargado. Status ahora: MODEL_LOADED");
      } catch (e) {
        console.error("SelfiePage: Hook #2 [LoadModel] - Error al cargar FaceDetector:", e);
        setError("No se pudo iniciar la verificación facial. Revisa los permisos o intenta recargar.");
        setLivenessStatus("ERROR_SETUP");
      }
    };
    loadFaceDetector();
  }, [livenessStatus]);

  // 3. Inicializar la cámara (SIN CAMBIOS)
  useEffect(() => {
    console.log("SelfiePage: Hook #3 [InitCamera] - Evaluando. Status:", livenessStatus, "isCameraReady:", isCameraReady, "faceDetector:", !!faceDetector, "formData:", !!formData);
    
    const currentVideoElement = videoRef.current;

    if (livenessStatus !== "MODEL_LOADED" || !faceDetector || !formData || isCameraReady) {
      if (livenessStatus === "MODEL_LOADED" && isCameraReady) {
        console.log("SelfiePage: Hook #3 [InitCamera] - Cámara ya lista y modelo cargado, no se re-inicializa.");
      }
      return;
    }
    
    console.log("SelfiePage: Hook #3 [InitCamera] - Procediendo a inicializar cámara.");
    setLivenessStatus("INITIALIZING_CAMERA");
    setUiMessage("Iniciando cámara...");

    let localStreamTracks: MediaStreamTrack[] | null = null;

    if (currentVideoElement) {
      console.log("SelfiePage: Hook #3 [InitCamera] - currentVideoElement encontrado. Llamando a getUserMedia...");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        console.log("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - MediaStream obtenido:", stream.id);
        localStreamTracks = stream.getTracks();
      
        if (videoRef.current) { 
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("SelfiePage: Hook #3 [InitCamera] - onloadedmetadata - Video metadata cargados. Video dimensions:", videoRef.current?.videoWidth, videoRef.current?.videoHeight);
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log("SelfiePage: Hook #3 [InitCamera] - video.play().then() - ¡Video comenzado a reproducir!");
                setIsCameraReady(true); 
                setLivenessStatus("DETECTING_CENTER"); 
                setUiMessage("Por favor, mira al frente y centra tu rostro.");
              }).catch(playError => {
                console.error("SelfiePage: Hook #3 [InitCamera] - video.play().catch() - Error al reproducir video:", playError);
                setError("Problema al iniciar el video de la cámara.");
                setLivenessStatus("ERROR_SETUP"); 
              });
            } else {
              console.warn("SelfiePage: Hook #3 [InitCamera] - onloadedmetadata - videoRef.current es null antes de play(). Deteniendo tracks locales.");
              if (localStreamTracks) localStreamTracks.forEach(track => track.stop());
            }
          };
          console.log("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - Handler onloadedmetadata asignado.");

          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState < HTMLMediaElement.HAVE_METADATA && !isCameraReady) {
                 console.warn("SelfiePage: Hook #3 [InitCamera] - TIMEOUT (5s) - Video metadata no parece haberse cargado. ReadyState:", videoRef.current?.readyState);
            }
          }, 5000);

        } else {
          console.warn("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - videoRef.current es null. Deteniendo tracks locales.");
          if (localStreamTracks) localStreamTracks.forEach(track => track.stop());
        }
      })
      .catch(err => {
        console.error("SelfiePage: Hook #3 [InitCamera] - getUserMedia.catch() - Error al acceder a la cámara:", err);
        setError("No se pudo acceder a la cámara. Verifica los permisos e intenta de nuevo.");
        setLivenessStatus("ERROR_SETUP");
      });
    } else {
        console.warn("SelfiePage: Hook #3 [InitCamera] - currentVideoElement (videoRef.current capturado) es null al inicio del proceso de inicialización.");
        setError("Error interno: No se encontró el elemento de video.");
        setLivenessStatus("ERROR_SETUP");
    }

    return () => {
      console.log("SelfiePage: Hook #3 [InitCamera] - Limpiando efecto de cámara. Status actual:", livenessStatus, "LocalStreamTracks:", !!localStreamTracks);
      if (localStreamTracks) {
        console.log("SelfiePage: Hook #3 [InitCamera] - Deteniendo localStreamTracks.");
        localStreamTracks.forEach(track => track.stop());
      }
      if (currentVideoElement && currentVideoElement.srcObject) {
          console.log("SelfiePage: Hook #3 [InitCamera] - Limpiando srcObject del currentVideoElement.");
          try {
            (currentVideoElement.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
          } catch (cleanupError) { console.warn("SelfiePage: Hook #3 [InitCamera] - Error menor en limpieza de srcObject:", cleanupError); }
          currentVideoElement.srcObject = null;
      }
    };
  }, [livenessStatus, faceDetector, formData, isCameraReady]);

  // 4. Lógica de MediaPipe (SIN CAMBIOS)
  const detectFaceAndLiveness = useCallback(() => {    
    if (!isCameraReady || !faceDetector || !videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2) {
      console.warn("SelfiePage: detectFaceAndLiveness - Condiciones de video/cámara no listas. Retornando. CamReady:", isCameraReady, "Detector:", !!faceDetector, "Video State:", videoRef.current?.readyState);
      return;
    }
    if (!ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    const video = videoRef.current;
    const result: FaceDetectorResult = faceDetector.detectForVideo(video, performance.now());

    if (result.detections.length > 0) {
      const face = result.detections[0];
      const { boundingBox, keypoints } = face;
      const noseTip = keypoints.find(k => k.label === 'NoseTip') || keypoints[2];

      if (boundingBox && noseTip && keypoints[0] && keypoints[1]) {
        const faceCenterX = boundingBox.originX + boundingBox.width / 2;
        const videoCenterX = video.videoWidth / 2;
        
        switch (livenessStatus) {
          case "DETECTING_CENTER":
            const isCentered = Math.abs(faceCenterX - videoCenterX) < video.videoWidth * 0.2;
            const isGoodSize = boundingBox.width > video.videoWidth * 0.3;
            if (isCentered && isGoodSize) {
              setUiMessage("¡Bien! Mantén la posición un momento...");
              initialFaceMetricsRef.current = { noseX: noseTip.x, faceWidth: boundingBox.width };
              setTimeout(() => { 
                if (livenessStatus === "DETECTING_CENTER") { 
                  setLivenessStatus("CENTER_DETECTED"); 
                  setUiMessage("Ahora, gira tu cabeza lentamente hacia un lado."); 
                }
              }, 1000);
            } else { 
              if (!isCentered) setUiMessage("Intenta centrar tu rostro en el óvalo.");
              else if (!isGoodSize) setUiMessage("Asegúrate de estar un poco más cerca.");
            }
            break;
          case "CENTER_DETECTED": 
            if(livenessStatus === "CENTER_DETECTED") setLivenessStatus("DETECTING_TURN"); 
            break;
          case "DETECTING_TURN":
            if (initialFaceMetricsRef.current) {
              const deviationPx = Math.abs((noseTip.x * video.videoWidth) - (initialFaceMetricsRef.current.noseX * video.videoWidth));
              const turnThresholdPx = initialFaceMetricsRef.current.faceWidth * 0.4; 

              if (deviationPx > turnThresholdPx) {
                setUiMessage("¡Giro detectado!");
                setTimeout(() => { 
                  if (livenessStatus === "DETECTING_TURN") { 
                    setLivenessStatus("TURN_DETECTED"); 
                    setUiMessage("Perfecto. Vuelve a mirar al frente."); 
                  }
                }, 500);
              }
            }
            break;
          case "TURN_DETECTED": 
            if(livenessStatus === "TURN_DETECTED") setLivenessStatus("DETECTING_RETURN"); 
            break;
          case "DETECTING_RETURN":
            if (initialFaceMetricsRef.current) {
              const returnThresholdPx = initialFaceMetricsRef.current.faceWidth * 0.15; 
              if (Math.abs((noseTip.x * video.videoWidth) - (initialFaceMetricsRef.current.noseX * video.videoWidth)) < returnThresholdPx) {
                setUiMessage("¡Excelente! Prueba de vida completada.");
                setLivenessStatus("SUCCESS");
              }
            }
            break;
        }
      }
    } else { 
      if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
        setUiMessage("Asegúrate de que tu rostro esté visible.");
      }
    }
    
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
  }, [faceDetector, livenessStatus, isCameraReady]);

  // LoopManager y otros hooks (SIN CAMBIOS)
  useEffect(() => {
    const canStartDetectionLoop = isCameraReady && faceDetector && videoRef.current && !videoRef.current.paused && !videoRef.current.ended && videoRef.current.readyState >= 2 && ACTIVE_LIVENESS_STATES.includes(livenessStatus);
    if (canStartDetectionLoop) {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraReady, faceDetector, livenessStatus, detectFaceAndLiveness]);

  useEffect(() => {
    let attemptTimerId: NodeJS.Timeout | null = null;
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus) && attempts > 0) {
      attemptTimerId = setTimeout(() => {
        if (livenessStatus !== "SUCCESS") { 
          const newAttempts = attempts - 1;
          setAttempts(newAttempts);
          if (newAttempts > 0) {
            setUiMessage(`Intento fallido. Quedan ${newAttempts} intentos. Prepárate...`);
            setLivenessStatus("FAILED_ATTEMPT");
          } else {
            setUiMessage("Has agotado tus intentos de verificación.");
            setError("Verificación fallida después de varios intentos. Serás redirigido.");
            setLivenessStatus("FAILED_NO_ATTEMPTS");
            setTimeout(() => router.replace('/seleccionar-registro'), 4000);
          }
        }
      }, 25000); 
    }
    return () => { 
      if (attemptTimerId) clearTimeout(attemptTimerId); 
    };
  }, [livenessStatus, attempts, router]);

  useEffect(() => {
    if (livenessStatus === "FAILED_ATTEMPT") {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      if (animationFrameIdRef.current) { 
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
      }
      setTimeout(() => {
        setLivenessStatus("INITIAL"); 
        initialFaceMetricsRef.current = null;
        setIsCameraReady(false); 
        setError(null);
        setUiMessage("Reiniciando para el siguiente intento...");
      }, 2000); 
    }
  }, [livenessStatus]);

  // CAMBIO PRINCIPAL: La lógica de registro ahora llama a la API.
  const handleFinalizarRegistro = async (selfieData: string | null) => {
    console.log("SelfiePage: handleFinalizarRegistro - Iniciado.");
    if (!formData || !rol || !selfieData) {
      setError("Faltan datos esenciales para finalizar el registro.");
      setIsProcessingAction(false);
      setUiMessage("Error de datos al finalizar.");
      return;
    }
    
    setIsProcessingAction(true);
    setUiMessage("Procesando tu registro de forma segura...");

    try {
      // Se hace la llamada a la API segura que creamos.
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: formData,
          rol: rol,
          selfieData: selfieData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Si la API devuelve un error, se lo mostramos al usuario.
        throw new Error(result.error || `Error del servidor: ${response.status}`);
      }
      
      // Si la API devuelve éxito (status 201)
      setUiMessage("¡Registro exitoso! Redirigiendo...");
      setIsProcessingAction(false);
      setTimeout(() => router.push('/bienvenida'), 2000);

    } catch (err) {
      // Se manejan errores de red o los errores lanzados desde la API.
      const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado.";
      console.error("SelfiePage: handleFinalizarRegistro - Error:", errorMessage);
      setError(errorMessage);
      setUiMessage("Error en el registro.");
      setIsProcessingAction(false);
    }
  };

  const handleCapturarSelfie = () => {
    console.log("SelfiePage: handleCapturarSelfie - Iniciado. Status:", livenessStatus);
    if (!videoRef.current || !canvasRef.current || livenessStatus !== "SUCCESS") {
      setError("La prueba de vida debe completarse con éxito primero."); 
      return;
    }
    setIsProcessingAction(true); 
    setUiMessage("Capturando selfie...");
    
    const video = videoRef.current; 
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth; 
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.translate(canvas.width, 0); 
      context.scale(-1, 1); 
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0); 
      
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      selfieImageDataUrlRef.current = imageDataUrl; // Se guarda la selfie en la ref.
      
      console.log("SelfiePage: handleCapturarSelfie - Selfie capturada.");
      setUiMessage("Selfie capturada. Finalizando registro...");
      
      handleFinalizarRegistro(imageDataUrl); // Se llama a la función de registro.
    } else {
      console.error("SelfiePage: handleCapturarSelfie - No se pudo obtener contexto 2D del canvas.");
      setError("No se pudo procesar la imagen de la selfie.");
      setIsProcessingAction(false); 
      setUiMessage("Error al capturar selfie.");
    }
  };

  // --- Lógica de Renderizado (SIN CAMBIOS FUNCIONALES, SOLO AJUSTES DE REF) ---
  const shouldDisplayCameraInterface = formData && rol && !selfieImageDataUrlRef.current &&
                                     (livenessStatus === "MODEL_LOADED" ||
                                      livenessStatus === "INITIALIZING_CAMERA" ||
                                      ACTIVE_LIVENESS_STATES.includes(livenessStatus) ||
                                      livenessStatus === "SUCCESS"
                                     ) &&
                                     livenessStatus !== "ERROR_SETUP" &&
                                     livenessStatus !== "FAILED_NO_ATTEMPTS" &&
                                     livenessStatus !== "FAILED_ATTEMPT";

  if ( (livenessStatus === "INITIAL" || livenessStatus === "LOADING_MODEL") || (isProcessingAction && selfieImageDataUrlRef.current) ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p className="animate-pulse text-lg">{uiMessage}</p>
      </div>
    );
  }

  if (livenessStatus === "FAILED_ATTEMPT" && !error) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
              <Logo />
              <p className="text-xl text-yellow-400 mb-4">Intento Fallido</p>
              <p className="mb-6 text-center text-lg">{uiMessage}</p>
              <p className="animate-pulse text-md">Reiniciando...</p>
          </div>
      );
  }
  
  const showErrorScreen = error && (livenessStatus === "ERROR_SETUP" || livenessStatus === "FAILED_NO_ATTEMPTS");
  if (showErrorScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-error p-4">
        <Logo />
        <p className="text-2xl font-bold mb-4">Error en la Verificación</p>
        <p className="mb-6 text-center text-lg">{error}</p>
        <Button onClick={() => {
            console.log("SelfiePage: ErrorScreen - Botón presionado. Redirigiendo a /seleccionar-registro");
            sessionStorage.clear(); 
            router.replace('/seleccionar-registro');
          }}>
          {livenessStatus === "FAILED_NO_ATTEMPTS" || livenessStatus === "ERROR_SETUP" ? "Volver a Iniciar Registro" : "Intentar de Nuevo el Registro"}
        </Button>
      </div>
    );
  }
  
  if (!formData || !rol) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p className="animate-pulse text-lg">{uiMessage || "Cargando datos del registro..."}</p>
      </div>
    );
  }

  if (shouldDisplayCameraInterface) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logoClaro = '/MARCA_CODYS_13.png';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logoOscuro = '/MARCA_CODYS_14.png';

 return (
  <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">

    <img
      src={resolvedTheme === 'dark' ? '/MARCA_CODYS_14.png' : '/MARCA_CODYS_13.png'}
      alt="Isotipo CODYS"
      className="mx-auto mb-6 w-36 md:w-44 object-contain"
      width={128}
      height={128}
    />

    <div className="
      w-[90vw] sm:max-w-md md:max-w-xl
      space-y-4 rounded-xl border border-borde-tarjeta
      bg-tarjeta p-5 shadow-xl md:p-8
    ">
      <h1 className="text-center text-lg font-bold text-primario md:text-xl">
        Verificación de Identidad
      </h1>
      <p className="text-center text-xs text-texto-secundario md:text-sm">
        Intentos restantes: {attempts}
      </p>
      <p className="h-9 flex items-center justify-center text-center text-xs md:text-sm text-texto-secundario">
        {uiMessage}
      </p>
      <div className="
        relative mx-auto my-2 flex items-center justify-center
        w-full pt-[75%]
        rounded-lg overflow-hidden border-2 border-primario bg-gray-700
      ">
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover transform scale-x-[-1]"
        />
        {livenessStatus === 'INITIALIZING_CAMERA' && !isCameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-700/50">
            <p className="animate-pulse text-white text-sm md:text-base">
              Configurando cámara…
            </p>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {livenessStatus === 'SUCCESS' && (
        <Button
          onClick={handleCapturarSelfie}
          disabled={isProcessingAction}
          fullWidth
          className="mt-2"
        >
          {isProcessingAction ? 'Procesando Selfie…' : 'Tomar Selfie y Continuar'}
        </Button>
      )}
    </div>
  </div>
);

  }

  // Fallback final.
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
      <p className="text-lg">{uiMessage || "Por favor, espera..."}</p>
    </div>
  );
}