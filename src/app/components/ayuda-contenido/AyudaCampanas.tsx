// src/app/components/ayuda-contenido/AyudaCampanas.tsx
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PencilIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaCampanas() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-2 -mt-15">
        <Logo width={240} height={240} />
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Paso 2: Elige la Duración</h2>
      <p className="text-center text-texto-secundario mb-6">
        Aquí decides por cuánto tiempo estará activo tu plan. A esto lo llamamos Campaña.
      </p>

      <ul className="space-y-4">
        <li className="flex items-start">
          <CalendarDaysIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Más Tiempo, Más Continuidad</h4>
            <p className="text-texto-secundario">
              Elige entre campañas de 1, 3, 6 o 12 meses. Una campaña más larga asegura que tu publicación permanezca visible sin interrupciones.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <CurrencyDollarIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Ahorra con Campañas Largas</h4>
            <p className="text-texto-secundario">
              ¡A mayor duración, mayor es el descuento que aplicamos sobre el precio final! Revisa el porcentaje de descuento en cada opción.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <PencilIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Siguiente Paso: Los Detalles</h4>
            <p className="text-texto-secundario">
              Una vez que elijas la duración, pasarás al último paso: completar o editar la información de tu publicación.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}