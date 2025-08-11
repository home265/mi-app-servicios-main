// src/app/components/ayuda-contenido/AyudaTrabajos.tsx
import {
  BriefcaseIcon,
  CheckBadgeIcon,
  StarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/components/ui/Logo';

export default function AyudaTrabajos() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
  {/* El div ahora tiene un tamaño fijo (w-20 h-20) */}
  <div className="flex justify-center mb-2 -mt-15">
    <Logo width={240} height={240} />
  </div>
</div>
      <h2 className="text-2xl font-bold text-center mb-6">¿Cómo gestionar tus trabajos?</h2>
      
      {/* --- PASO 1 --- */}
      <h3 className="font-bold text-lg mb-2 text-primario">1. Gestionar Solicitudes</h3>
      <ul className="space-y-3 mb-6">
        <li className="flex items-start">
          <BriefcaseIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Recibe solicitudes de trabajo</h4>
            <p className="text-texto-secundario">
              Cuando un usuario busca tus servicios, recibirás una notificación aquí. Podrás ver la descripción del trabajo que necesitan.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CheckBadgeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Acepta o rechaza</h4>
            <p className="text-texto-secundario">
              Usa los botones de la notificación para aceptar el trabajo y notificar al usuario, o para eliminar la solicitud si no te interesa.
            </p>
          </div>
        </li>
      </ul>

      {/* --- PASO 2 --- */}
      <h3 className="font-bold text-lg mb-2 text-primario">2. Acuerdos y Calificaciones</h3>
      <ul className="space-y-3">
        <li className="flex items-start">
          <StarIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Califica a tus clientes</h4>
            <p className="text-texto-secundario">
              Cuando un usuario confirme que llegaron a un acuerdo, recibirás una notificación para que, al finalizar el trabajo, califiques tu experiencia con él.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ExclamationTriangleIcon className="w-6 h-6 mr-3 mt-1 text-error flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Importante!</h4>
            <p className="text-texto-secundario">
              Si tienes dos calificaciones pendientes para usuarios, no podrás aceptar nuevos trabajos hasta que califiques al menos a uno. ¡Mantén tus reseñas al día!
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}