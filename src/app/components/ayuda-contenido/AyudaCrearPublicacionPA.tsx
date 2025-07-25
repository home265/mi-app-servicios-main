// src/app/components/ayuda-contenido/AyudaCrearPublicacionPA.tsx
import {
  UserCircleIcon,
  BuildingStorefrontIcon,
  PencilSquareIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaCrearPublicacionPA() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="flex justify-center mb-2 -mt-15">
          <Logo width={240} height={240} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Tu Tarjeta en Páginas Amarillas</h2>
      <p className="text-center text-texto-secundario mb-6">
        Crea tu tarjeta de presentación digital. El formulario se adapta si eres Prestador o Comercio.
      </p>

      {/* --- SECCIÓN POR ROLES --- */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start">
          <UserCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Si eres Prestador de Servicios</h4>
            <p className="text-texto-secundario">
              ¡Ahorras tiempo! Tu nombre, foto de perfil, categoría y ubicación se cargan automáticamente desde tu perfil. Solo necesitas completar tu información de contacto.
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <BuildingStorefrontIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Si eres un Comercio</h4>
            <p className="text-texto-secundario">
              Podrás subir el logo de tu negocio y escribir su nombre público. Además, tendrás una casilla especial para indicar si realizas envíos a domicilio.
            </p>
          </div>
        </div>
      </div>

      {/* --- FUNCIONES COMUNES --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Funciones Disponibles para Todos</h3>
      <ul className="space-y-4">
        <li className="flex items-start">
          <PencilSquareIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Información de la Tarjeta</h4>
            <p className="text-texto-secundario">
              Añade un <strong className="text-texto-principal">Título</strong> y <strong className="text-texto-principal">Subtítulo</strong> llamativos, y una <strong className="text-texto-principal">Descripción</strong> detallada de lo que ofreces.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ClockIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Configura tus Horarios</h4>
            <p className="text-texto-secundario">
              Para cada día, puedes tocar en <strong className="text-texto-principal">&quot;Cerrado&quot;</strong> para desplegar las opciones: horario de 24hs, o añadir turnos para horarios cortados (ej: mañana y tarde).
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <EyeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Vista Previa en Tiempo Real</h4>
            <p className="text-texto-secundario">
              A la derecha de la pantalla, verás cómo queda tu tarjeta mientras completas los campos. ¡Sin sorpresas!
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CheckCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Finalizar y Publicar</h4>
            <p className="text-texto-secundario">
              Cuando todo esté listo, presiona <strong className="text-texto-principal">Crear Publicación</strong>. Un mensaje te confirmará que tu tarjeta ha sido guardada y ya está visible en las Páginas Amarillas.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}