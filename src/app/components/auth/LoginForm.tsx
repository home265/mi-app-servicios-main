// src/app/components/auth/LoginForm.tsx
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth'; // <-- Importar función y tipo de error
import { auth } from '@/lib/firebase/config'; // <-- Importar tu instancia de auth
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Login attempt:', { email }); // No loguear contraseña

    try {
      // --- INICIO: Lógica Real de Firebase Auth ---
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Si llegamos aquí, el login fue exitoso en Firebase
      console.log('Login exitoso en Firebase para:', userCredential.user.email);
      
      // NO necesitamos hacer nada más aquí (ni setError, ni setIsLoading(false)).
      // onAuthStateChanged en Providers.tsx se activará automáticamente
      // y manejará la carga del perfil y la redirección a /pin-entry.
      // Dejar que Providers.tsx maneje la transición después del éxito.
      // --- FIN: Lógica Real de Firebase Auth ---

    } catch (err) {
      console.error("Error en inicio de sesión:", err);
      const authError = err as AuthError; // Hacer type assertion a AuthError
      let errorMessage = "Ocurrió un error al iniciar sesión.";
      // Códigos de error comunes de signInWithEmailAndPassword
      switch (authError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential': // Código más nuevo/general para email/pwd incorrectos
              errorMessage = "El correo electrónico o la contraseña son incorrectos.";
              break;
          case 'auth/invalid-email':
              errorMessage = "El formato del correo electrónico no es válido.";
              break;
          case 'auth/user-disabled':
              errorMessage = "Esta cuenta de usuario ha sido deshabilitada.";
              break;
          case 'auth/too-many-requests':
               errorMessage = "Demasiados intentos fallidos. Por favor, intenta más tarde.";
               break;
          // Puedes añadir más casos si los necesitas
          default:
              // Usar el mensaje de error de Firebase si no es uno de los códigos comunes
              errorMessage = authError.message || errorMessage; 
              break;
      }
      setError(errorMessage);
      setIsLoading(false); // Detener la carga solo si hay un error aquí
    } 
    // No poner setIsLoading(false) aquí fuera del catch, 
    // porque en caso de éxito, la transición y posible redirección
    // harán que el estado de carga de este componente ya no importe.
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        id="email"
        label="Email"
        type="email"
        placeholder="ingrese email válido"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        disabled={isLoading} // Deshabilitar inputs mientras carga
      />
      <Input
        id="password"
        label="Contraseña"
        type="password"
        placeholder="ingrese contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
        disabled={isLoading} // Deshabilitar inputs mientras carga
      />

      {error && (
        <p className="text-sm text-error text-center">{error}</p> // Usar tu color 'error'
      )}

      <Button type="submit" isLoading={isLoading} fullWidth>
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </Button>
    </form>
  );
}