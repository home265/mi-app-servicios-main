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

// Firebase
import { auth, db, storage } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
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
  const [selfieImageDataUrl, setSelfieImageDataUrl] = useState<string | null>(null);
  const initialFaceMetricsRef = useRef<{ noseX: number; faceWidth: number } | null>(null);

  // 1. Cargar datos del formulario desde sessionStorage
  useEffect(() => {
    if (!formData && !datosInicialesProcesadosRef.current) {
      console.log("SelfiePage: Hook #1 [SessionStorage] - Leyendo datos iniciales...");
      setUiMessage("Cargando información de registro...");
      // ... (resto del código como antes) ...
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

  // 2. Cargar el modelo FaceDetector de MediaPipe
  useEffect(() => {
    if (livenessStatus !== "LOADING_MODEL") return;
    console.log("SelfiePage: Hook #2 [LoadModel] - Iniciando carga de FaceDetector. Status:", livenessStatus);
    // ... (resto del código como antes) ...
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

  // 3. Inicializar la cámara
  // 3. Inicializar la cámara
  useEffect(() => {
    console.log("SelfiePage: Hook #3 [InitCamera] - Evaluando. Status:", livenessStatus, "isCameraReady:", isCameraReady, "faceDetector:", !!faceDetector, "formData:", !!formData);
    
    // --- INICIO DE LA MODIFICACIÓN ---
    // Captura el valor actual de videoRef.current al inicio del efecto.
    const currentVideoElement = videoRef.current;
    // --- FIN DE LA MODIFICACIÓN ---

    // Esta guarda asegura que el proceso de inicialización solo comience una vez.
    if (livenessStatus !== "MODEL_LOADED" || !faceDetector || !formData || isCameraReady) {
      if (livenessStatus === "MODEL_LOADED" && isCameraReady) {
        console.log("SelfiePage: Hook #3 [InitCamera] - Cámara ya lista y modelo cargado, no se re-inicializa.");
      }
      return;
    }
    
    console.log("SelfiePage: Hook #3 [InitCamera] - Procediendo a inicializar cámara.");
    setLivenessStatus("INITIALIZING_CAMERA"); // Cambia estado para UI
    setUiMessage("Iniciando cámara...");     // Actualiza UI

    let localStreamTracks: MediaStreamTrack[] | null = null; // Usar variable local para los tracks de esta instancia del efecto

    // Usa 'currentVideoElement' aquí en lugar de 'videoRef.current' directamente para la guarda principal.
    // 'videoElement' en tu código original ya hacía esto si 'const videoElement = videoRef.current;' se mantenía.
    // Para consistencia, usaremos currentVideoElement donde sea apropiado.
    if (currentVideoElement) {
      console.log("SelfiePage: Hook #3 [InitCamera] - currentVideoElement encontrado. Llamando a getUserMedia...");
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      .then(stream => {
        console.log("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - MediaStream obtenido:", stream.id);
        localStreamTracks = stream.getTracks(); // Asigna a la variable local
      
        // Es crucial chequear videoRef.current (o currentVideoElement) de nuevo aquí porque esto es asíncrono.
        // videoRef.current es la fuente de verdad más actualizada para el elemento DOM después de un render.
        // Pero para operaciones dentro de esta instancia del 'then', si currentVideoElement sigue siendo el mismo, es válido.
        // Por seguridad, usaremos videoRef.current para interactuar con el DOM, ya que el ref se actualiza por React.
        if (videoRef.current) { 
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            console.log("SelfiePage: Hook #3 [InitCamera] - onloadedmetadata - Video metadata cargados. Video dimensions:", videoRef.current?.videoWidth, videoRef.current?.videoHeight);
            if (videoRef.current) { // Chequear de nuevo antes de play()
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
          // Log para verificar si onloadedmetadata se registra
          console.log("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - Handler onloadedmetadata asignado.");

          // Fallback por si onloadedmetadata no se dispara (raro, pero para depurar)
          setTimeout(() => {
            // Usar videoRef.current aquí es correcto porque es una comprobación diferida del estado actual del DOM.
            if (videoRef.current && videoRef.current.readyState < HTMLMediaElement.HAVE_METADATA && !isCameraReady) {
                 console.warn("SelfiePage: Hook #3 [InitCamera] - TIMEOUT (5s) - Video metadata no parece haberse cargado. ReadyState:", videoRef.current?.readyState);
            }
          }, 5000);

        } else { // videoRef.current es null cuando el .then de getUserMedia se ejecuta
          console.warn("SelfiePage: Hook #3 [InitCamera] - getUserMedia.then() - videoRef.current es null. Deteniendo tracks locales.");
          if (localStreamTracks) localStreamTracks.forEach(track => track.stop());
        }
      })
      .catch(err => {
        console.error("SelfiePage: Hook #3 [InitCamera] - getUserMedia.catch() - Error al acceder a la cámara:", err);
        setError("No se pudo acceder a la cámara. Verifica los permisos e intenta de nuevo.");
        setLivenessStatus("ERROR_SETUP");
      });
    } else { // currentVideoElement (videoRef.current capturado al inicio del efecto) era null
        console.warn("SelfiePage: Hook #3 [InitCamera] - currentVideoElement (videoRef.current capturado) es null al inicio del proceso de inicialización.");
        // Si no hay videoElement, no podemos continuar, podría ser un error de configuración.
        setError("Error interno: No se encontró el elemento de video.");
        setLivenessStatus("ERROR_SETUP");
    }

    return () => {
      // Esta limpieza se ejecuta cuando el componente se desmonta O cuando las dependencias del hook cambian
      // y el hook se re-ejecuta.
      console.log("SelfiePage: Hook #3 [InitCamera] - Limpiando efecto de cámara. Status actual:", livenessStatus, "LocalStreamTracks:", !!localStreamTracks);
      if (localStreamTracks) {
        console.log("SelfiePage: Hook #3 [InitCamera] - Deteniendo localStreamTracks.");
        localStreamTracks.forEach(track => track.stop());
      }
      // Adicionalmente, si el videoRef tiene un srcObject, también intentar limpiarlo.
      // Esto es importante si la limpieza ocurre por desmontaje del componente.
      // --- INICIO DE LA MODIFICACIÓN PARA LA LIMPIEZA ---
      // USA LA VARIABLE CAPTURADA "currentVideoElement" EN LA LIMPIEZA
      if (currentVideoElement && currentVideoElement.srcObject) {
          console.log("SelfiePage: Hook #3 [InitCamera] - Limpiando srcObject del currentVideoElement.");
          try {
            (currentVideoElement.srcObject as MediaStream)?.getTracks().forEach(track => track.stop());
          } catch (cleanupError) { console.warn("SelfiePage: Hook #3 [InitCamera] - Error menor en limpieza de srcObject:", cleanupError); }
          currentVideoElement.srcObject = null; // Usa la variable capturada
      }
      // --- FIN DE LA MODIFICACIÓN PARA LA LIMPIEZA ---
    };
  // Las dependencias siguen siendo las mismas. La lógica interna del hook y el renderizado condicional
  // son clave para evitar problemas.
  }, [livenessStatus, faceDetector, formData, isCameraReady]);

  // 4. Bucle de Detección y Prueba de Vida (Definición)
  // ... (sin cambios respecto a la versión anterior que te pasé, con el LoopManager y el useCallback de detectFaceAndLiveness) ...
  const detectFaceAndLiveness = useCallback(() => {    
    if (!isCameraReady || !faceDetector || !videoRef.current || videoRef.current.paused || videoRef.current.ended || videoRef.current.readyState < 2) {
      console.warn("SelfiePage: detectFaceAndLiveness - Condiciones de video/cámara no listas. Retornando. CamReady:", isCameraReady, "Detector:", !!faceDetector, "Video State:", videoRef.current?.readyState);
      return;
    }
    if (!ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      console.log("SelfiePage: detectFaceAndLiveness - Estado no activo para detección, retornando. Status:", livenessStatus);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    console.log("SelfiePage: detectFaceAndLiveness - Ejecutando. Status:", livenessStatus, "CamaraLista:", isCameraReady);
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
              else setUiMessage("Por favor, centra tu rostro y asegúrate de estar visible.");
            }
            break;
          case "CENTER_DETECTED": 
            if(livenessStatus === "CENTER_DETECTED") setLivenessStatus("DETECTING_TURN"); 
            break;
          case "DETECTING_TURN":
            if (initialFaceMetricsRef.current) {
              const currentNoseXPx = noseTip.x * video.videoWidth;
              const initialNoseXPx = initialFaceMetricsRef.current.noseX * video.videoWidth;
              const deviationPx = Math.abs(currentNoseXPx - initialNoseXPx);
              const turnThresholdPx = initialFaceMetricsRef.current.faceWidth * 0.4; 

              if (deviationPx > turnThresholdPx) {
                setUiMessage("¡Giro detectado!");
                setTimeout(() => { 
                  if (livenessStatus === "DETECTING_TURN") { 
                    setLivenessStatus("TURN_DETECTED"); 
                    setUiMessage("Perfecto. Vuelve a mirar al frente."); 
                  }
                }, 500);
              } else { 
                setUiMessage("Gira tu cabeza lentamente...");
              }
            }
            break;
          case "TURN_DETECTED": 
            if(livenessStatus === "TURN_DETECTED") setLivenessStatus("DETECTING_RETURN"); 
            break;
          case "DETECTING_RETURN":
            if (initialFaceMetricsRef.current) {
              const currentNoseXPx = noseTip.x * video.videoWidth;
              const initialNoseXPx = initialFaceMetricsRef.current.noseX * video.videoWidth;
              const returnThresholdPx = initialFaceMetricsRef.current.faceWidth * 0.15; 

              if (Math.abs(currentNoseXPx - initialNoseXPx) < returnThresholdPx) {
                setUiMessage("¡Excelente! Prueba de vida completada.");
                setLivenessStatus("SUCCESS");
              } else { 
                setUiMessage("Vuelve a mirar al frente...");
              }
            }
            break;
        }
      }
    } else { 
      if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
        console.log("SelfiePage: detectFaceAndLiveness - No se detectaron caras.");
        setUiMessage("Asegúrate de que tu rostro esté visible.");
      }
    }
    
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus)) {
      animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
    } else {
      console.log("SelfiePage: detectFaceAndLiveness - Bucle NO continuado (o finalizado internamente), estado:", livenessStatus);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }
  }, [faceDetector, livenessStatus, isCameraReady]);

  // LoopManager (sin cambios)
  useEffect(() => {
    console.log("SelfiePage: Hook [LoopManager] - Evaluando. Status:", livenessStatus, "CamReady:", isCameraReady, "Detector:", !!faceDetector);
    const canStartDetectionLoop = 
      isCameraReady && 
      faceDetector && 
      videoRef.current &&
      !videoRef.current.paused && 
      !videoRef.current.ended &&
      videoRef.current.readyState >= 2 &&
      ACTIVE_LIVENESS_STATES.includes(livenessStatus);

    if (canStartDetectionLoop) {
      console.log("SelfiePage: Hook [LoopManager] - Iniciando/Continuando bucle de detección. Status:", livenessStatus);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(detectFaceAndLiveness);
    } else {
      console.log("SelfiePage: Hook [LoopManager] - Condiciones NO cumplidas para bucle o estado no activo. Status:", livenessStatus, "CamReady:", isCameraReady, "Video State:", videoRef.current?.readyState);
      if (animationFrameIdRef.current) {
        console.log("SelfiePage: Hook [LoopManager] - Cancelando frame existente.");
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    }

    return () => {
      console.log("SelfiePage: Hook [LoopManager] - Limpiando efecto LoopManager. Cancelando frame si existe. Status actual:", livenessStatus);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isCameraReady, faceDetector, livenessStatus, detectFaceAndLiveness]);

  // 5. Temporizador de Intentos (sin cambios)
  // ... (código del temporizador como antes) ...
  useEffect(() => {
    let attemptTimerId: NodeJS.Timeout | null = null;
    if (ACTIVE_LIVENESS_STATES.includes(livenessStatus) && attempts > 0) {
      console.log(`SelfiePage: Hook #5 [AttemptTimer] - Iniciando temporizador de intento (${25}s). Intentos restantes: ${attempts}. Status: ${livenessStatus}`);
      attemptTimerId = setTimeout(() => {
        if (livenessStatus !== "SUCCESS") { 
          console.warn(`SelfiePage: Hook #5 [AttemptTimer] - Intento ${4 - attempts} fallido por tiempo (estado al expirar: ${livenessStatus}).`);
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
        } else {
          console.log("SelfiePage: Hook #5 [AttemptTimer] - Temporizador expiró, pero el estado es SUCCESS. No se hace nada.");
        }
      }, 25000); 
    }
    return () => { 
      if (attemptTimerId) {
        console.log("SelfiePage: Hook #5 [AttemptTimer] - Limpiando temporizador de intento. Status:", livenessStatus);
        clearTimeout(attemptTimerId); 
      }
    };
  }, [livenessStatus, attempts, router]);


  // Efecto para reiniciar la prueba después de un FAILED_ATTEMPT (sin cambios)
  // ... (código de reinicio como antes) ...
  useEffect(() => {
    if (livenessStatus === "FAILED_ATTEMPT") {
      console.log("SelfiePage: Hook [FailedAttemptReset] - Estado FAILED_ATTEMPT detectado. Preparando reinicio.");
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
        console.log("SelfiePage: Hook [FailedAttemptReset] - Tracks de video detenidos.");
      }
      if (animationFrameIdRef.current) { 
          cancelAnimationFrame(animationFrameIdRef.current);
          animationFrameIdRef.current = null;
          console.log("SelfiePage: Hook [FailedAttemptReset] - Bucle de detección cancelado.");
      }

      setTimeout(() => {
        console.log("SelfiePage: Hook [FailedAttemptReset] - Reiniciando para el siguiente intento.");
        setLivenessStatus("INITIAL"); 
        initialFaceMetricsRef.current = null;
        setIsCameraReady(false); 
        setError(null);
        setUiMessage("Reiniciando para el siguiente intento...");
      }, 2000); 
    }
  }, [livenessStatus]);

  // 6. Capturar Selfie (sin cambios)
  // ... (código de captura como antes) ...
  const handleCapturarSelfie = () => {
    console.log("SelfiePage: handleCapturarSelfie - Iniciado. Status:", livenessStatus);
    if (!videoRef.current || !canvasRef.current || livenessStatus !== "SUCCESS") {
      setError("La prueba de vida debe completarse con éxito primero."); 
      console.error("SelfiePage: handleCapturarSelfie - Condiciones no cumplidas. Video:",!!videoRef.current, "Canvas:",!!canvasRef.current, "Status:", livenessStatus);
      return;
    }
    setIsProcessingAction(true); setUiMessage("Capturando selfie...");
    const video = videoRef.current; const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (context) {
      context.translate(canvas.width, 0); context.scale(-1, 1); 
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.setTransform(1, 0, 0, 1, 0, 0); 
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelfieImageDataUrl(imageDataUrl);
      console.log("SelfiePage: handleCapturarSelfie - Selfie capturada.");
      setUiMessage("Selfie capturada. Finalizando registro...");
      handleFinalizarRegistro(imageDataUrl);
    } else {
      console.error("SelfiePage: handleCapturarSelfie - No se pudo obtener contexto 2D del canvas.");
      setError("No se pudo procesar la imagen de la selfie.");
      setIsProcessingAction(false); setUiMessage("Error al capturar selfie.");
    }
  };

  // 7. Finalizar Registro (sin cambios)
  // ... (código de finalizar registro como antes) ...
 //=============== INICIO DE LA SOLUCIÓN DEFINITIVA ===============

// 1. Define una interfaz para el documento que se guardará en Firestore.
// Puedes colocarla justo encima de la función handleFinalizarRegistro.
interface UserDocumentData {
  uid: string;
  email: string | undefined;
  nombre: string | null;
  apellido: string | null;
  rol: string | null;
  telefono: string | null;
  localidad: { id: string; nombre: string; provinciaNombre: string } | null;
  selfieURL: string;
  hashedPin: string | null;
  fechaRegistro: string;
  activo: boolean;
  // Campos de rol opcionales
  categoria?: { categoria: string; subcategoria: string | null } | null;
  rubro?: { rubro: string; subrubro: string | null } | null;
  matricula?: string | null;
  cuilCuit?: string | null;
  descripcion?: string | null;
}

// 2. Reemplaza tu función handleFinalizarRegistro con esta versión mejorada.
const handleFinalizarRegistro = async (selfieData: string | null) => {
  console.log("SelfiePage: handleFinalizarRegistro - Iniciado.");
  if (!formData || !rol || !selfieData) {
    setError("Faltan datos esenciales para finalizar el registro.");
    setIsProcessingAction(false);
    setUiMessage("Error de datos al finalizar.");
    console.error("SelfiePage: handleFinalizarRegistro - Faltan datos. formData:", !!formData, "rol:", !!rol, "selfieData:", !!selfieData);
    return;
  }
  if (!formData.email || !formData.contrasena || !formData.pin) {
    setError("Email, contraseña o PIN no encontrados en los datos del formulario.");
    setIsProcessingAction(false);
    setUiMessage("Error de credenciales al finalizar.");
    console.error("SelfiePage: handleFinalizarRegistro - Faltan email, contraseña o pin.");
    return;
  }
  setIsProcessingAction(true);
  setUiMessage("Creando tu cuenta y guardando datos...");

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(formData.pin, salt);
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.contrasena);
    const user = userCredential.user;
    console.log("SelfiePage: handleFinalizarRegistro - Usuario creado en Firebase Auth. UID:", user.uid);

    const response = await fetch(selfieData);
    const selfieBlob = await response.blob();
    const selfieStorageRef = ref(storage, `selfies/${user.uid}/profile.jpg`);
    await uploadBytes(selfieStorageRef, selfieBlob);
    const selfieURL = await getDownloadURL(selfieStorageRef);
    console.log("SelfiePage: handleFinalizarRegistro - Selfie subida a Firebase Storage. URL:", selfieURL);

    // Crea el objeto base con el tipado explícito de la interfaz que definimos
    const userDataToSave: UserDocumentData = {
      uid: user.uid,
      email: formData.email,
      nombre: formData.nombre || null,
      apellido: formData.apellido || null,
      rol: rol,
      telefono: formData.telefono || null,
      localidad: formData.localidad || null,
      selfieURL: selfieURL,
      hashedPin: hashedPin,
      fechaRegistro: new Date().toISOString(),
      activo: true,
    };

    // Agrega las propiedades de rol de forma condicional y segura
    if (rol === 'prestador') {
      userDataToSave.categoria = formData.seleccionCategoria || null;
      userDataToSave.matricula = formData.matricula || null;
      userDataToSave.cuilCuit = formData.cuilCuit || null;
      userDataToSave.descripcion = formData.descripcion || null;
    } else if (rol === 'comercio') {
      userDataToSave.rubro = formData.seleccionRubro || null;
      userDataToSave.matricula = formData.matricula || null;
      userDataToSave.cuilCuit = formData.cuilCuit || null;
      userDataToSave.descripcion = formData.descripcion || null;
    }

    let collectionName = 'usuarios_generales';
    if (rol === 'prestador') collectionName = 'prestadores';
    else if (rol === 'comercio') collectionName = 'comercios';
    
    // Ahora userDataToSave es un objeto perfectamente tipado y sin 'undefined'
    await setDoc(doc(db, collectionName, user.uid), userDataToSave);
    console.log(`SelfiePage: handleFinalizarRegistro - Datos de usuario guardados en Firestore en colección: ${collectionName}`);

    setUiMessage("¡Registro exitoso! Redirigiendo...");
    setIsProcessingAction(false);
    setTimeout(() => router.push('/bienvenida'), 2000);
  } catch (err) {
    console.error("SelfiePage: handleFinalizarRegistro - Error en finalización de registro:", err);
    let friendlyErrorMsg = "Ocurrió un error al finalizar tu registro.";
    if (err && typeof err === 'object' && 'code' in err && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
        const firebaseError = err as { code: string; message: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use': friendlyErrorMsg = "Este correo electrónico ya está en uso."; break;
          case 'auth/weak-password': friendlyErrorMsg = "La contraseña es muy débil (mín. 6 caracteres)."; break;
          default: friendlyErrorMsg = `Error de Firebase: ${firebaseError.message}`;
        }
      } else if (err instanceof Error) { friendlyErrorMsg = err.message; }
    setError(friendlyErrorMsg); setUiMessage("Error en el registro."); setIsProcessingAction(false);
  }
};

//=============== FIN DE LA SOLUCIÓN DEFINITIVA ===============


  // --- Renderizado (AJUSTADO) ---

  // Define cuándo mostrar la interfaz principal de la cámara (incluyendo el video y los mensajes de estado)
  const shouldDisplayCameraInterface = formData && rol && !selfieImageDataUrl &&
                                     (livenessStatus === "MODEL_LOADED" || // Modelo cargado, listo para init cámara
                                      livenessStatus === "INITIALIZING_CAMERA" || // Cámara inicializando (video debe estar visible)
                                      ACTIVE_LIVENESS_STATES.includes(livenessStatus) || // Detección activa
                                      livenessStatus === "SUCCESS" // Prueba exitosa, mostrar botón de selfie
                                     ) &&
                                     livenessStatus !== "ERROR_SETUP" &&
                                     livenessStatus !== "FAILED_NO_ATTEMPTS" &&
                                     livenessStatus !== "FAILED_ATTEMPT"; // FAILED_ATTEMPT tiene su propia UI

  // Pantalla de carga inicial (antes de que el modelo se cargue o si hay procesamiento de selfie)
  if ( (livenessStatus === "INITIAL" || livenessStatus === "LOADING_MODEL") || (isProcessingAction && selfieImageDataUrl) ) {
    console.log("SelfiePage: Render - Mostrando LoadingScreen (Initial/ModelLoading/Processing). UI Message:", uiMessage);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p className="animate-pulse text-lg">{uiMessage}</p>
      </div>
    );
  }

  // Pantalla específica para FAILED_ATTEMPT
  if (livenessStatus === "FAILED_ATTEMPT" && !error) {
      console.log("SelfiePage: Render - Mostrando FAILED_ATTEMPT UI. UI Message:", uiMessage);
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
              <Logo />

              <p className="text-xl text-yellow-400 mb-4">Intento Fallido</p> {/* Color ajustado para visibilidad */}
              <p className="mb-6 text-center text-lg">{uiMessage}</p>
              <p className="animate-pulse text-md">Reiniciando...</p>
          </div>
      );
  }
  
  // Pantalla de Error general
  const showErrorScreen = error && (livenessStatus === "ERROR_SETUP" || livenessStatus === "FAILED_NO_ATTEMPTS");
  if (showErrorScreen) {
    console.log("SelfiePage: Render - Mostrando ErrorScreen. Error:", error, "Status:", livenessStatus);
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
  
  // Fallback si faltan datos del formulario (debería ser raro si la lógica anterior funciona)
  if (!formData || !rol) { 
    console.log("SelfiePage: Render - Fallback: formData o rol no disponibles aún. UI Message:", uiMessage);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
        <p className="animate-pulse text-lg">{uiMessage || "Cargando datos del registro..."}</p>
      </div>
    );
  }

  // Renderizar la Interfaz de Cámara si corresponde
  if (shouldDisplayCameraInterface) {
  console.log('SelfiePage: Render – CameraInterface…');

  /* acceso al tema para la marca de agua */
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { resolvedTheme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logoClaro = '/MARCA_CODYS_13.png';
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logoOscuro = '/MARCA_CODYS_14.png';

 return (
  <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto px-2 py-6">

    {/* ─── Isotipo sin transparencia ─── */}
    <img
      src={resolvedTheme === 'dark' ? '/MARCA_CODYS_14.png' : '/MARCA_CODYS_13.png'}
      alt="Isotipo CODYS"
      className="mx-auto mb-6 w-36 md:w-44 object-contain"
      width={128}
      height={128}
    />

    {/* ─── Tarjeta de verificación ─── */}
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

      {/* Video responsivo 4:3 */}
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



  // Fallback final si ninguna otra condición de renderizado se cumple
  console.log("SelfiePage: Render - Mostrando Fallback final (inesperado si la lógica es correcta). UI Message:", uiMessage);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-fondo text-texto p-4">
      <p className="text-lg">{uiMessage || "Por favor, espera..."}</p>
    </div>
  );
}}