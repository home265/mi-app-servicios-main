// src/app/components/ayuda-contenido/AyudaEditarPublicacionPA.tsx
import {
  PencilIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaEditarPublicacionPA() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="w-20 h-auto">
          <Logo />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Editando tu Publicación</h2>
      <p className="text-center text-texto-secundario mb-6">
        Mantén tu tarjeta de presentación digital siempre actualizada. Aquí te explicamos cómo.
      </p>

      {/* --- PASO A PASO --- */}
      <ul className="space-y-4">
        <li className="flex items-start">
          <PencilIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">1. Modifica los Campos Necesarios</h4>
            <p className="text-texto-secundario">
              Puedes cambiar tu logo o foto, información de contacto, descripción, horarios y más. La interfaz es idéntica a la de creación para que te resulte familiar.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <LockClosedIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">2. Datos Fijos</h4>
            <p className="text-texto-secundario">
              Recuerda que ciertos datos como tu rol (<strong className="text-texto-principal">Prestador</strong> o <strong className="text-texto-principal">Comercio</strong>), la categoría/rubro principal y tu ubicación no se pueden cambiar desde aquí.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ExclamationTriangleIcon className="w-6 h-6 mr-3 mt-1 text-error flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Importante! Límite de Ediciones</h4>
            <p className="text-texto-secundario">
              Dispones de <strong className="text-error">6 ediciones por año</strong> para cada publicación. El ciclo se reinicia anualmente desde la fecha de creación. Usa tus ediciones sabiamente.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CheckCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">4. Guarda tus Cambios</h4>
            <p className="text-texto-secundario">
              El botón de <strong className="text-texto-principal">Guardar Cambios</strong> se activará en cuanto modifiques algún campo. Presiónalo para aplicar tus actualizaciones.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}