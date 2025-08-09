// src/app/components/ayuda-contenido/AyudaPlanes.tsx
import {
  SparklesIcon,
  CalendarDaysIcon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  CreditCardIcon,
  EyeIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaPlanes() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-2 -mt-15">
        <Logo width={240} height={240} />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Paso 1: Elige tu Plan</h2>
      <p className="text-center text-texto-secundario mb-6">
        Tu plan determina el nivel de visibilidad y el tiempo de exposición que tendrá tu anuncio.
      </p>

      <ul className="space-y-4">
        <li className="flex items-start">
          <EyeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¿Qué es la Exposición?</h4>
            <p className="text-texto-secundario">
              Es el tiempo total en segundos que tu anuncio animado (tarjeta 3D) se muestra cada vez que aparece. Un plan superior significa más tiempo en pantalla para captar la atención.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <SparklesIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Tipos de Planes</h4>
            <p className="text-texto-secundario">
              Los planes como <strong className="text-texto-principal">Bronce, Plata y Oro</strong> rotan de forma estándar en la aplicación. El plan <strong className="text-primario">Platino</strong> tiene una exposición premium y prioritaria.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CalendarDaysIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Siguiente Paso: La Duración</h4>
            <p className="text-texto-secundario">
              Después de elegir tu plan, seleccionarás por cuántos meses quieres mantenerlo activo.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}