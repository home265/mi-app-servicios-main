// src/app/components/common/Avatar.tsx
'use client'; // Marcado como componente cliente debido a la interactividad (onClick).

import Image from 'next/image';
import React from 'react'; // Importar React explícitamente si no se hace globalmente.

// Define las propiedades que acepta el componente Avatar.
interface AvatarProps {
  selfieUrl?: string | null; // URL de la imagen del avatar, puede ser nula o indefinida.
  nombre?: string | null;     // Nombre del usuario para el texto alternativo y el inicial del placeholder.
  size?: number;              // Tamaño del avatar en píxeles (ancho y alto).
  onClick?: () => void;       // Función opcional a ejecutar al hacer clic en el avatar.
  clickable?: boolean;        // Booleano que indica si el avatar es interactivo (clicable).
}

const Avatar: React.FC<AvatarProps> = ({
  selfieUrl,
  nombre,
  size = 96, // Tamaño por defecto del avatar.
  onClick,
  clickable = false, // Por defecto el avatar no es clicable.
}) => {
  // Calcula la inicial del nombre para usarla como placeholder si no hay imagen.
  // Si no hay nombre, usa un signo de interrogación.
  const placeholderInitial = nombre ? nombre.charAt(0).toUpperCase() : '?';

  return (
    <div
      // Aplica el handler onClick solo si 'clickable' es true y 'onClick' está definido.
      onClick={clickable && onClick ? onClick : undefined}
      // Clases de Tailwind CSS para el contenedor del avatar:
      // - `rounded-full overflow-hidden`: Asegura que el contenido sea circular y recorta lo que se desborde.
      // - `bg-primario/10`: Fondo sutil para el placeholder, utilizando el color primario con baja opacidad
      //   para un estilo limpio y profesional que se adapta al modo claro/oscuro.
      // - `border-2 border-borde-tarjeta`: Borde de 2px con el color de borde de tarjeta,
      //   proporcionando una definición suave y consistente con otros elementos de la UI.
      // - `shadow-md`: Una sombra de tamaño mediano para dar una ligera profundidad,
      //   manteniendo el aspecto minimalista.
      // - `flex items-center justify-center`: Centra horizontal y verticalmente el contenido (imagen o inicial).
      // - `transition-all duration-150`: Aplica una transición suave a todas las propiedades animables.
      // - Clases condicionales para interactividad:
      //   - `cursor-pointer`: Cambia el cursor para indicar que el elemento es clicable.
      //   - `hover:scale-105`: Ligeramente agranda el avatar al pasar el cursor para feedback visual.
      //   - `hover:shadow-lg`: Aumenta la sombra al pasar el cursor, creando una sensación de "elevación".
      className={`
        rounded-full overflow-hidden 
        bg-primario/10 
        border-2 border-borde-tarjeta 
        shadow-md
        flex items-center justify-center
        transition-all duration-150 ease-in-out
        ${clickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
      `}
      // Define el tamaño del avatar dinámicamente usando estilo en línea.
      style={{ width: `${size}px`, height: `${size}px` }}
    >
      {selfieUrl ? (
        // Si hay una URL de selfie, muestra la imagen.
        <Image
          src={selfieUrl}
          alt={`Avatar de ${nombre || 'usuario'}`} // Texto alternativo para accesibilidad.
          width={size}   // Ancho de la imagen (optimización).
          height={size}  // Alto de la imagen (optimización).
          // SE CORRIGIÓ ESTA LÍNEA:
          className="w-full h-full object-cover" // Añadido w-full y h-full para que la imagen rellene el contenedor.
          priority // Prioriza la carga de esta imagen.
        />
      ) : (
        // Si no hay selfie, muestra la inicial del nombre como placeholder.
        <span
          className="text-texto-principal font-semibold" // Color de texto principal y semi-negrita.
          // Tamaño de fuente dinámico para que la inicial se ajuste bien al tamaño del avatar.
          style={{ fontSize: `${size / 2.5}px` }}
        >
          {placeholderInitial}
        </span>
      )}
    </div>
  );
};

export default Avatar;