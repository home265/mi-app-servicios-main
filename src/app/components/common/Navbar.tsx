// src/app/components/common/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Importar usePathname

// Icono de Ajustes (SVG)
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.852a.75.75 0 001.176.882l.069-.043a8.25 8.25 0 014.298 0l.069.043a.75.75 0 001.176-.882l-.178-2.025a1.875 1.875 0 00-1.85-1.567h-1.796zm-1.796 18c.917 0 1.699-.663 1.85-1.567l.178-2.025a.75.75 0 00-1.176-.882l-.069.043a8.25 8.25 0 01-4.298 0l-.069-.043a.75.75 0 00-1.176.882l.178 2.025A1.875 1.875 0 009.282 21.75h1.796zM1.625 11.25a1.875 1.875 0 011.85-1.567l2.026-.178a.75.75 0 00.882-1.176l-.044-.069a8.25 8.25 0 010-4.298l.044-.069a.75.75 0 00-.882-1.176l-2.026.178A1.875 1.875 0 011.625 5.078v1.796c0 .917.663 1.699 1.567 1.85l2.025.178a.75.75 0 00.882 1.176l.044.069a8.25 8.25 0 010 4.298l-.044.069a.75.75 0 00-.882 1.176l-2.025-.178a1.875 1.875 0 01-1.567 1.85v-1.796zm18.75 0c0-.917-.663-1.699-1.85-1.567l-2.026.178a.75.75 0 00-.882 1.176l.044.069a8.25 8.25 0 010 4.298l-.044-.069a.75.75 0 00.882 1.176l2.026-.178c1.187.151 1.85.933 1.85 1.85v1.796c0 .917-.663 1.699-1.85 1.567l-2.025-.178a.75.75 0 00-.882-1.176l-.044-.069a8.25 8.25 0 010-4.298l.044-.069a.75.75 0 00.882-1.176l2.025.178c1.188-.151 1.85-.933 1.85-1.85v-1.796zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" clipRule="evenodd" />
  </svg>
);

// También podrías importar y usar tu ThemeSwitcher aquí si quisieras que esté en la barra de navegación.
// import { ThemeSwitcher } from '@/app/components/ThemeSwitcher';

const Navbar: React.FC = () => {
  const pathname = usePathname(); // Usamos pathname

  // Definir rutas donde NO quieres que aparezca este Navbar (solo el ícono de Ajustes)
  // Esto incluye las rutas de autenticación y las de registro.
  const hideNavbarOnPaths = [
    '/login', 
    '/pin-entry', 
    '/seleccionar-registro', 
    '/registro' // Esto cubrirá /registro/[rol] y /registro/selfie
  ];

  // Comprueba si la ruta actual comienza con alguna de las rutas a ocultar.
  // Esto es útil si /registro tiene subrutas como /registro/usuario, /registro/selfie.
  if (hideNavbarOnPaths.some(path => pathname.startsWith(path))) {
    console.log("Navbar: Ocultando Navbar en la ruta:", pathname);
    return null; // No renderizar nada si estamos en una de esas rutas
  }

  console.log("Navbar: Mostrando Navbar en la ruta:", pathname);
  return (
    <nav className="w-full p-4 flex justify-end items-center absolute top-0 right-0 z-10">
      {/* Podrías añadir más elementos aquí si este Navbar crece, como:
        <div className="flex items-center space-x-4">
          <ThemeSwitcher /> // Ejemplo si quieres el ThemeSwitcher aquí
          <Link href="/ajustes" ...> <SettingsIcon /> </Link>
        </div>
      */}
      <Link 
        href="/ajustes"
        className="p-2 rounded-lg text-texto hover:bg-tarjeta focus:outline-none focus:ring-2 focus:ring-primario transition-colors"
        aria-label="Ir a la página de Ajustes"
      >
        <SettingsIcon />
      </Link>
    </nav>
  );
};

export default Navbar;