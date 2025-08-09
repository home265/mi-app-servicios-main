// src/app/components/ayuda-contenido/AyudaBienvenida.tsx
import {
  LightBulbIcon,
  HomeIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowUturnLeftIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaBienvenida() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-2 -mt-15">
        <Logo width={240} height={240} />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">¡Bienvenido a tu Guía!</h2>
      
      {/* --- 1. PRESENTACIÓN DEL BOTÓN DE AYUDA --- */}
      <div className="flex items-center text-center bg-fondo p-4 rounded-lg border border-borde-tarjeta mb-6">
        <LightBulbIcon className="w-10 h-10 mr-4 text-primario flex-shrink-0" />
        <p className="text-texto-secundario text-left">
          ¡Hola! Soy tu asistente. En cada página que navegues, si tienes dudas, haz clic en mí (el ícono de la bombilla amarilla) y te explicaré qué puedes hacer.
        </p>
      </div>

      {/* --- 2. EXPLICACIÓN DE LA PANTALLA ACTUAL --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Tu Pantalla Principal</h3>
      <p className="text-texto-secundario mb-6">
        Desde aquí tienes acceso rápido a todas las funciones de la aplicación a través de los botones grandes del centro de la pantalla.
      </p>

      {/* --- 3. EXPLICACIÓN DE LA BARRA DE MENÚ --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Tu Barra de Navegación</h3>
      <ul className="space-y-4">
        <li className="flex items-start">
          <HomeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Inicio</h4>
            <p className="text-texto-secundario">Te trae de vuelta a esta pantalla principal desde cualquier lugar de la app.</p>
          </div>
        </li>
        <li className="flex items-start">
          <UserCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Perfil</h4>
            <p className="text-texto-secundario">Accede para ver y editar tu información personal, foto y datos de contacto.</p>
          </div>
        </li>
        <li className="flex items-start">
          <Cog6ToothIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Ajustes</h4>
            <p className="text-texto-secundario">Configura notificaciones, cambia el tema visual y gestiona tu cuenta.</p>
          </div>
        </li>
        <li className="flex items-start">
          <ArrowUturnLeftIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Volver</h4>
            <p className="text-texto-secundario">Te permite regresar a la pantalla en la que estabas anteriormente.</p>
          </div>
        </li>
      </ul>
    </div>
  );
}