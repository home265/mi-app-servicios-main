// src/app/components/ayuda-contenido/AyudaBusqueda.tsx
import {
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  HandThumbUpIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaBusqueda() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* CORRECCIÓN FINAL: Envolvemos el Logo en un div y le damos el tamaño al div. */}
        <div className="w-20 h-auto">
          <Logo />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-6">¿Cómo buscar un servicio?</h2>

      {/* --- PASO 1 --- */}
      <h3 className="font-bold text-lg mb-2 text-primario">Paso 1: Crear tu Solicitud</h3>
      <ul className="space-y-3 mb-6">
        <li className="flex items-start">
          <ClipboardDocumentListIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Completa el formulario</h4>
            <p className="text-texto-secundario">
              Selecciona una categoría y subcategoría, y luego describe brevemente el trabajo que necesitas. Ambos campos son obligatorios.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <PaperAirplaneIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Envía tu búsqueda</h4>
            <p className="text-texto-secundario">
              Al presionar <strong className="font-semibold text-texto-principal">Buscar prestadores</strong>, tu solicitud se enviará a todos los profesionales de la zona que coincidan con tu pedido.
            </p>
          </div>
        </li>
      </ul>

      {/* --- PASO 2 --- */}
      <h3 className="font-bold text-lg mb-2 text-primario">Paso 2: Revisar las Respuestas</h3>
      <ul className="space-y-3 mb-6">
        <li className="flex items-start">
          <ChatBubbleLeftRightIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Revisa tus notificaciones</h4>
            <p className="text-texto-secundario">
              Las respuestas de los prestadores aparecerán como notificaciones debajo del formulario de búsqueda.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <UserCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Investiga al prestador</h4>
            <p className="text-texto-secundario">
              Haz clic en la <strong className="font-semibold text-texto-principal">foto de perfil</strong> de la notificación para ver los datos del prestador y las reseñas de otros usuarios. ¡Te recomendamos hacer esto primero!
            </p>
          </div>
        </li>
      </ul>

      {/* --- PASO 3 --- */}
      <h3 className="font-bold text-lg mb-2 text-primario">Paso 3: Contactar y Calificar</h3>
      <ul className="space-y-3">
        <li className="flex items-start">
          <HandThumbUpIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Contacta y confirma</h4>
            <p className="text-texto-secundario">
              Una vez que elijas a alguien, usa los botones para contactarlo. Si llegan a un acuerdo, la app te pedirá confirmarlo. Esto es importante para poder dejar una reseña después.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <StarIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Deja tu reseña</h4>
            <p className="text-texto-secundario">
              Tu opinión es pública y ayuda a toda la comunidad. Para asegurar la transparencia, todas las reseñas incluyen tu nombre y foto de perfil.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ExclamationTriangleIcon className="w-6 h-6 mr-3 mt-1 text-error flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Importante!</h4>
            <p className="text-texto-secundario">
              Si tienes dos calificaciones pendientes para prestadores, no podrás solicitar nuevos servicios hasta que califiques al menos a uno.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}