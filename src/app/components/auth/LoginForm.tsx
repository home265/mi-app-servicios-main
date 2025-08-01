'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword, AuthError } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
// Se eliminan los imports de los componentes genéricos que vamos a reemplazar
// import Input from '@/app/components/ui/Input';
// import Button from '@/app/components/ui/Button';

// --- INICIO: MODIFICACIÓN ---
// 1. Definimos las props que el componente recibirá.
// `onLoginSuccess` es una función opcional.
interface LoginFormProps {
  onLoginSuccess?: () => void;
}

// 2. Usamos las props en la definición del componente.
export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
// --- FIN: MODIFICACIÓN ---

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    console.log('Login attempt:', { email });

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login exitoso en Firebase para:', userCredential.user.email);

      // --- INICIO: MODIFICACIÓN ---
      // 3. Verificamos si la función onLoginSuccess fue proporcionada.
      if (onLoginSuccess) {
        // Si es así, la llamamos. Esto se usa en el flujo de desbloqueo/recuperación de PIN.
        // La función se encargará de la lógica posterior (como redirigir a "set-new-pin").
        onLoginSuccess();
      }
      // Si onLoginSuccess NO se proporciona, se ejecuta el flujo de login normal.
      // El onAuthStateChanged global se encargará de la redirección, por lo que no
      // es necesario hacer nada más aquí, la lógica existente es correcta.
      // --- FIN: MODIFICACIÓN ---

    } catch (err) {
      console.error("Error en inicio de sesión:", err);
      const authError = err as AuthError;
      let errorMessage = "Ocurrió un error al iniciar sesión.";
      switch (authError.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
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
          default:
              errorMessage = authError.message || errorMessage; 
              break;
      }
      setError(errorMessage);
      setIsLoading(false);
    } 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-texto-secundario mb-2">
            Email
        </label>
        <input
            id="email"
            type="email"
            placeholder="ingrese email válido"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
            className="block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-texto-secundario mb-2">
            Contraseña
        </label>
        <input
            id="password"
            type="password"
            placeholder="ingrese contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
            className="block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow"
        />
      </div>

      {error && (
        <p className="text-sm text-error text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}