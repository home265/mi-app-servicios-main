// src/app/components/ayuda-contenido/AyudaMisAnuncios.tsx
import {
  RectangleGroupIcon,
  InformationCircleIcon,
  CursorArrowRaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaMisAnuncios() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="flex justify-center mb-2 -mt-15">
          <Logo width={240} height={240} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Gestionando Mis Anuncios</h2>
      <p className="text-center text-texto-secundario mb-6">
        Aquí puedes ver y administrar todos los anuncios que has creado en la aplicación.
      </p>

      {/* --- PASO A PASO --- */}
      <ul className="space-y-4">
        <li className="flex items-start">
          <RectangleGroupIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">1. Tu Lista de Anuncios</h4>
            <p className="text-texto-secundario">
              Cada tarjeta que ves representa uno de tus anuncios. La imagen que se muestra es la última diapositiva de tu anuncio para que puedas reconocerlo fácilmente.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <InformationCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">2. Información a la Vista</h4>
            <p className="text-texto-secundario">
              En la esquina superior derecha de cada tarjeta, encontrarás una leyenda con los datos clave: el estado (<strong className="text-texto-principal">activo</strong> o <strong className="text-texto-principal">inactivo</strong>), el plan, la campaña y el tiempo que le queda.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CursorArrowRaysIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">3. Acciones Disponibles</h4>
            <p className="text-texto-secundario">
              Cada anuncio tiene dos botones: <strong className="text-texto-principal">Vista previa</strong> para ver cómo quedó, y <strong className="text-texto-principal">Editar</strong> para modificarlo.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ExclamationTriangleIcon className="w-6 h-6 mr-3 mt-1 text-error flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Atención! Límite de Edición</h4>
            <p className="text-texto-secundario">
              Solo puedes editar cada anuncio <strong className="text-error">dos veces por mes</strong>. Planifica tus cambios, especialmente si usas los anuncios para promocionar ofertas por tiempo limitado.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}