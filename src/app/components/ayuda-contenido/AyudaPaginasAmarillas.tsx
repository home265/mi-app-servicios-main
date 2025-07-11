// src/app/components/ayuda-contenido/AyudaPaginasAmarillas.tsx
import {
  MapPinIcon,
  TagIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaPaginasAmarillas() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="w-20 h-auto">
          <Logo />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Explorando las Páginas Amarillas</h2>
      <p className="text-center text-texto-secundario mb-6">
        Encuentra comercios y prestadores de servicios como en las guías telefónicas de antes, ¡pero de forma digital!
      </p>

      {/* --- PASO A PASO --- */}
      <ul className="space-y-4">
        <li className="flex items-start">
          <MapPinIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">1. Elige la Localidad</h4>
            <p className="text-texto-secundario">
              Comienza a escribir el nombre de una ciudad. Aparecerá una lista con las coincidencias y su provincia. Selecciona la correcta, ideal para búsquedas locales o si estás de viaje.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <TagIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">2. Selecciona el Tipo de Publicación</h4>
            <p className="text-texto-secundario">
              Puedes buscar <strong className="text-texto-principal">Todos</strong>, o ser más específico eligiendo solo <strong className="text-texto-principal">Prestadores</strong> o <strong className="text-texto-principal">Comercios</strong>.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <FunnelIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">3. Aplica Filtros Específicos</h4>
            <p className="text-texto-secundario">
              Según tu elección anterior, podrás filtrar por <strong className="text-texto-principal">Categoría</strong> (para prestadores) o por <strong className="text-texto-principal">Rubro</strong> (para comercios). También puedes marcar la casilla para ver solo los que realizan envíos.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <MagnifyingGlassIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">4. ¡Encuentra lo que buscas!</h4>
            <p className="text-texto-secundario">
              Presiona <strong className="text-texto-principal">Buscar</strong> y los resultados aparecerán debajo en forma de tarjetas. Cada una tendrá la información y botones para contactar directamente.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}