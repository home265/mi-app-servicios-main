// src/app/registro/selfie/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { auth, db, storage } from '@/lib/firebase/config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, getDownloadURL, uploadBytes } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';

// Importamos el componente de forma dinámica
const SelfieLiveness = dynamic(
  () => import('@/components/auth/SelfieLiveness'),
  {
    // Deshabilitamos el renderizado en servidor, la cámara solo funciona en el cliente
    ssr: false,
    // Mostramos un estado de carga mientras se descarga el componente pesado
    loading: () => (
      <div className="text-center p-8">
        <p className="animate-pulse text-lg">Cargando componentes de verificación...</p>
      </div>
    ),
  }
);

// Tipos para los datos del formulario que vienen de sessionStorage
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

export default function SelfiePage() {
  const router = useRouter();
  const [formData, setFormData] = useState<StoredFormData | null>(null);
  const [rol, setRol] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uiMessage, setUiMessage] = useState<string>('Cargando información...');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  // Carga inicial de datos desde sessionStorage
  useEffect(() => {
    const storedDataString = sessionStorage.getItem('registroFormData');
    const storedRol = sessionStorage.getItem('registroFormRol');

    if (storedDataString && storedRol) {
      setFormData(JSON.parse(storedDataString));
      setRol(storedRol);
      sessionStorage.removeItem('registroFormData');
      sessionStorage.removeItem('registroFormRol');
    } else {
      setError('No se encontraron los datos del registro. Por favor, inicia de nuevo.');
    }
    setIsDataLoaded(true);
  }, []);
  
  // Función para manejar el registro final, se llama cuando la selfie es capturada
  const handleFinalizarRegistro = async (selfieDataUrl: string) => {
    if (!formData || !rol) {
      setError('Faltan datos para finalizar el registro.'); return;
    }
    if (!formData.email || !formData.contrasena || !formData.pin) {
      setError('Credenciales (email, contraseña, PIN) incompletas.'); return;
    }

    setIsProcessingAction(true);
    setUiMessage('Creando tu cuenta y guardando datos de forma segura...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.contrasena);
      const user = userCredential.user;
      
      const response = await fetch(selfieDataUrl);
      const selfieBlob = await response.blob();
      
      const selfieStorageRef = ref(storage, `selfies/${user.uid}/profile.jpg`);
      await uploadBytes(selfieStorageRef, selfieBlob);
      const selfieURL = await getDownloadURL(selfieStorageRef);

      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(formData.pin, salt);

      const userDataToSave = {
        uid: user.uid, email: formData.email, nombre: formData.nombre || null,
        apellido: formData.apellido || null, rol: rol, telefono: formData.telefono || null,
        localidad: formData.localidad || null, selfieURL: selfieURL, hashedPin: hashedPin,
        fechaRegistro: new Date().toISOString(), activo: true,
        ...(rol === 'prestador' && { categoria: formData.seleccionCategoria || null, matricula: formData.matricula || null, cuilCuit: formData.cuilCuit || null, descripcion: formData.descripcion || null }),
        ...(rol === 'comercio' && { rubro: formData.seleccionRubro || null, matricula: formData.matricula || null, cuilCuit: formData.cuilCuit || null, descripcion: formData.descripcion || null }),
      };

      const collectionName = rol === 'prestador' ? 'prestadores' : rol === 'comercio' ? 'comercios' : 'usuarios_generales';
      await setDoc(doc(db, collectionName, user.uid), userDataToSave);

      setUiMessage('¡Registro exitoso! Redirigiendo...');
      setTimeout(() => router.push('/bienvenida'), 2000);

    } catch (err) {
      let friendlyErrorMsg = 'Ocurrió un error al finalizar tu registro.';
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string; message: string };
        switch (firebaseError.code) {
          case 'auth/email-already-in-use': friendlyErrorMsg = 'Este correo electrónico ya está en uso.'; break;
          case 'auth/weak-password': friendlyErrorMsg = 'La contraseña es muy débil (mín. 6 caracteres).'; break;
          default: friendlyErrorMsg = `Error: ${firebaseError.message}`;
        }
      } else if (err instanceof Error) { friendlyErrorMsg = err.message; }
      setError(friendlyErrorMsg);
      setUiMessage('');
      setIsProcessingAction(false);
    }
  };
  
  const handleFailureAndRestart = () => {
    sessionStorage.clear();
    router.replace('/seleccionar-registro');
  };

  const renderContent = () => {
    if (!isDataLoaded || isProcessingAction) {
      return <div className="text-center p-8"><p className="animate-pulse text-lg">{uiMessage}</p></div>;
    }
    
    if (error) {
      return (
        <div className="text-center p-8 text-error">
          <p className="font-bold text-xl mb-4">Ocurrió un Problema</p>
          <p className="mb-6">{error}</p>
          <Button onClick={handleFailureAndRestart}>Reiniciar Registro</Button>
        </div>
      );
    }

    return (
      <SelfieLiveness
        onSelfieCaptured={handleFinalizarRegistro}
        onLivenessFailed={handleFailureAndRestart}
        isProcessing={isProcessingAction}
      />
    );
  };
  
  return (
  <div className="flex min-h-screen flex-col items-center justify-center bg-fondo text-texto-principal px-2 py-6">
    
    {/* Se reemplaza <img> por el componente <Logo /> */}
    <Logo />

    <div className="w-[90vw] sm:max-w-md md:max-w-xl space-y-4 rounded-xl border border-borde-tarjeta bg-tarjeta p-5 shadow-xl md:p-8">
      <h1 className="text-center text-lg font-bold text-primario md:text-xl">
        Verificación de Identidad
      </h1>
      {renderContent()}
    </div>
  </div>
);
}