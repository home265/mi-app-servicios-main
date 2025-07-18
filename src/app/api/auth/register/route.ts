import { NextResponse } from 'next/server';
import { db, auth, storage } from '@/lib/firebase/config'; // Tus inicializaciones de Firebase
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import bcrypt from 'bcryptjs'; // bcrypt se usa aquí, en el servidor.

// Interfaz para el documento que se guardará en Firestore
// (La misma que definimos en la página de la selfie, ahora vive aquí)
interface UserDocumentData {
  uid: string;
  email: string;
  nombre: string | null;
  apellido: string | null;
  rol: string;
  telefono: string | null;
  localidad: { id: string; nombre: string; provinciaNombre: string } | null;
  selfieURL: string;
  hashedPin: string;
  fechaRegistro: string;
  activo: boolean;
  categoria?: { categoria: string; subcategoria: string | null } | null;
  rubro?: { rubro: string; subrubro: string | null } | null;
  matricula?: string | null;
  cuilCuit?: string | null;
  descripcion?: string | null;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { formData, rol, selfieData } = data;

    // Validación de datos de entrada
    if (!formData || !rol || !selfieData || !formData.email || !formData.contrasena || !formData.pin) {
      return NextResponse.json({ error: 'Faltan datos esenciales para el registro.' }, { status: 400 });
    }

    // --- LÓGICA DE REGISTRO SEGURA (LADO DEL SERVIDOR) ---
    
    // 1. Hashear el PIN
    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(formData.pin, salt);

    // 2. Crear el usuario en Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.contrasena);
    const user = userCredential.user;

    // 3. Subir la imagen de la selfie a Firebase Storage
    // Convertir la dataURL (formato base64) a un Blob para subirla
    const response = await fetch(selfieData);
    const selfieBlob = await response.blob();
    const selfieStorageRef = ref(storage, `selfies/${user.uid}/profile.jpg`);
    await uploadBytes(selfieStorageRef, selfieBlob);
    const selfieURL = await getDownloadURL(selfieStorageRef);

    // 4. Preparar el documento para guardar en Firestore
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

    // Añadir campos específicos del rol
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

    // 5. Determinar la colección y guardar el documento en Firestore
    let collectionName = 'usuarios_generales';
    if (rol === 'prestador') collectionName = 'prestadores';
    else if (rol === 'comercio') collectionName = 'comercios';
    
    await setDoc(doc(db, collectionName, user.uid), userDataToSave);

    // --- FIN DE LÓGICA DE SERVIDOR ---

    // Si todo fue exitoso, devolver una respuesta positiva
    return NextResponse.json({ success: true, message: 'Usuario registrado exitosamente', uid: user.uid }, { status: 201 });

  } catch (err: unknown) {
    console.error("Error en API /api/auth/register:", err);

    let friendlyErrorMsg = "Ocurrió un error inesperado en el servidor.";
    let statusCode = 500;

    // Manejo de errores específicos de Firebase
    if (err && typeof err === 'object' && 'code' in err) {
      const firebaseError = err as { code: string };
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          friendlyErrorMsg = "Este correo electrónico ya está en uso por otra cuenta.";
          statusCode = 409; // 409 Conflict: indica que la petición no se pudo completar por un conflicto con el estado actual del recurso.
          break;
        case 'auth/weak-password':
          friendlyErrorMsg = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
          statusCode = 400; // 400 Bad Request: la petición del cliente es inválida.
          break;
        case 'auth/invalid-email':
            friendlyErrorMsg = "El formato del correo electrónico no es válido.";
            statusCode = 400;
            break;
      }
    }
    
    // Devolver una respuesta de error clara al cliente
    return NextResponse.json({ error: friendlyErrorMsg }, { status: statusCode });
  }
}