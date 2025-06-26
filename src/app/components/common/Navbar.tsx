// src/app/components/common/Navbar.tsx
'use client'; // Marcado como componente cliente para usar hooks de Next.js.

import Link from 'next/link';
import { usePathname } from 'next/navigation'; // Importa el hook usePathname para obtener la ruta actual.

// Icono de Ajustes (SVG): Utiliza un SVG para mayor control y escalabilidad,
// y 'currentColor' para que se adapte automáticamente al color de texto definido por Tailwind.
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 5.852a.75.75 0 001.176.882l.069-.043a8.25 8.25 0 014.298 0l.069.043a.75.75 0 001.176-.882l-.178-2.025a1.875 1.875 0 00-1.85-1.567h-1.796zm-1.796 18c.917 0 1.699-.663 1.85-1.567l.178-2.025a.75.75 0 00-1.176-.882l-.069.043a8.25 8.25 0 01-4.298 0l-.069-.043a.75.75 0 00-1.176.882l.178 2.025A1.875 1.875 0 009.282 21.75h1.796zM1.625 11.25a1.875 1.875 0 011.85-1.567l2.026-.178a.75.75 0 00.882-1.176l-.044-.069a8.25 8.25 0 010-4.298l.044-.069a.75.75 0 00-.882-1.176l-2.026.178A1.875 1.875 0 011.625 5.078v1.796c0 .917.663 1.699 1.567 1.85l2.025.178a.75.75 0 00.882 1.176l.044.069a8.25 8.25 0 010 4.298l-.044.069a.75.75 0 00-.882 1.176l-2.025-.178a1.875 1.875 0 01-1.567 1.85v-1.796zm18.75 0c0-.917-.663-1.699-1.85-1.567l-2.026.178a.75.75 0 00-.882 1.176l.044.069a8.25 8.25 0 010 4.298l-.044-.069a.75.75 0 00.882 1.176l2.026-.178c1.187.151 1.85.933 1.85 1.85v1.796c0 .917-.663 1.699-1.85 1.567l-2.025-.178a.75.75 0 00-.882-1.176l-.044-.069a8.25 8.25 0 010-4.298l.044-.069a.75.75 0 00.882-1.176l2.025.178c1.188-.151 1.85-.933 1.85-1.85v-1.796zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" clipRule="evenodd" />
  </svg>
);

const Navbar: React.FC = () => {
  const pathname = usePathname(); // Obtiene la ruta actual para controlar la visibilidad del Navbar.

  // Define las rutas en las que el Navbar (o solo el ícono de Ajustes) no debe aparecer.
  // Se extiende para cubrir todas las subrutas de '/registro'.
  const hideNavbarOnPaths = [
    '/login',
    '/pin-entry',
    '/seleccionar-registro',
    '/registro', // Esto cubrirá rutas como /registro/usuario, /registro/selfie, etc.
  ];

  // Comprueba si la ruta actual comienza con alguna de las rutas a ocultar.
  // Si coincide, el Navbar no se renderiza.
  if (hideNavbarOnPaths.some(path => pathname.startsWith(path))) {
    // console.log("Navbar: Ocultando Navbar en la ruta:", pathname); // Para depuración
    return null;
  }

  // console.log("Navbar: Mostrando Navbar en la ruta:", pathname); // Para depuración

  return (
    // Contenedor principal de la barra de navegación.
    // - `w-full p-4`: Ocupa todo el ancho y tiene un padding general para espaciado.
    // - `flex justify-end items-center`: Alinea el contenido a la derecha verticalmente centrado.
    // - `absolute top-0 right-0 z-10`: Posiciona el navbar absolutamente en la esquina superior derecha,
    //   asegurando que siempre esté visible y por encima de otros elementos con `z-10`.
    // - `bg-fondo`: Utiliza el color de fondo definido para integrarse sutilmente,
    //   sin ser una barra de navegación prominente, lo que contribuye al minimalismo.
    // - `md:p-6`: Aumenta el padding en pantallas medianas y grandes para más espacio visual.
    <nav className="w-full p-4 flex justify-end items-center absolute top-0 right-0 z-10 bg-fondo md:p-6">
      {/*
        El Navbar actual es minimalista y solo contiene el botón de Ajustes.
        Si se expande en el futuro, se podrían añadir más elementos aquí,
        como un Logo a la izquierda o un ThemeSwitcher.
      */}
      <Link
        href="/ajustes"
        // Estilos para el botón del icono de Ajustes:
        // - `p-2`: Padding alrededor del icono para un área de clic cómoda.
        // - `rounded-full`: Icono circular para un aspecto suave y moderno.
        // - `text-texto-principal`: Color del icono que se adapta al tema.
        // - `hover:bg-tarjeta hover:shadow-sm`: Efecto de hover que cambia el fondo
        //   a `color-tarjeta` y añade una sombra sutil para feedback visual.
        // - `focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-2 focus:ring-offset-fondo`:
        //   Estilos de enfoque accesibles y visualmente agradables.
        // - `transition-all duration-150 ease-in-out`: Transiciones suaves para los efectos.
        // - `aria-label`: Etiqueta para mejorar la accesibilidad para usuarios de lectores de pantalla.
        className="
          p-2 rounded-full text-texto-principal 
          hover:bg-tarjeta hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-primario focus:ring-offset-2 focus:ring-offset-fondo 
          transition-all duration-150 ease-in-out
        "
        aria-label="Ir a la página de Ajustes"
      >
        <SettingsIcon /> {/* Renderiza el icono de ajustes. */}
      </Link>
    </nav>
  );
};

export default Navbar;