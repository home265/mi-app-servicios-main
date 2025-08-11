// src/app/components/ayuda-contenido/AyudaAjustes.tsx
import {
  HomeIcon,
  BellIcon,
  PaintBrushIcon,
  TrashIcon,
  LifebuoyIcon,
  ArrowLeftOnRectangleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/components/ui/Logo';

export default function AyudaAjustes() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-2 -mt-15">
  <Logo width={240} height={240} />
</div>
      <h2 className="text-2xl font-bold text-center mb-4 ">Guía Rápida de CODYS</h2>
      <p className="text-center text-texto-secundario mb-6">
        Aquí encontrarás cómo navegar la app y configurar tu experiencia.
      </p>

      {/* --- PANTALLA PRINCIPAL --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Tu Pantalla Principal</h3>
      <div className="flex items-start mb-6">
        <HomeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
        <div>
          <h4 className="font-semibold">El Centro de Comandos</h4>
          <p className="text-texto-secundario">
            La pantalla de bienvenida es tu punto de partida. Desde aquí, los botones te llevarán a las distintas secciones de la app. En cada pantalla, busca el ícono <strong className="text-texto-principal">?</strong> para obtener ayuda específica de esa sección.
          </p>
        </div>
      </div>

      {/* --- MENÚ DE AJUSTES --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Menú de Ajustes</h3>
      <ul className="space-y-4 mb-6">
        <li className="flex items-start">
          <BellIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Notificaciones Push</h4>
            <p className="text-texto-secundario">Actívalas para recibir alertas importantes incluso cuando no estés usando la aplicación.</p>
          </div>
        </li>
        <li className="flex items-start">
          <PaintBrushIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Modo Claro y Oscuro</h4>
            <p className="text-texto-secundario">Presiona el ícono del sol o la luna para cambiar el tema visual de la app según tu preferencia.</p>
          </div>
        </li>
        <li className="flex items-start">
          <TrashIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Eliminar CV</h4>
            <p className="text-texto-secundario">Si ya no deseas que tu curriculum vitae esté en nuestra base de datos, puedes eliminarlo permanentemente desde aquí.</p>
          </div>
        </li>
         <li className="flex items-start">
          <LifebuoyIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Contacto con Soporte</h4>
            <p className="text-texto-secundario">
              ¿Necesitas ayuda? Escríbenos a <strong className="text-texto-principal">soporte@andescode.tech</strong>.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ArrowLeftOnRectangleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Cerrar Sesión</h4>
            <p className="text-texto-secundario">
              Al volver a ingresar, se te pedirá tu email, contraseña y finalmente tu PIN de 4 dígitos.
            </p>
          </div>
        </li>
      </ul>

      {/* --- ZONA DE PELIGRO --- */}
      <h3 className="font-bold text-lg mb-3 text-error border-b border-error/50 pb-1">Zona de Peligro</h3>
      <div className="flex items-start">
        <ExclamationTriangleIcon className="w-6 h-6 mr-3 mt-1 text-error flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Dar de Baja la Cuenta</h4>
          <p className="text-texto-secundario">
            Esta es una acción <strong className="text-error">permanente e irreversible</strong>. Por tu seguridad, para confirmar la eliminación de tu cuenta se te pedirá que ingreses tu email y contraseña nuevamente.
          </p>
        </div>
      </div>

    </div>
  );
}