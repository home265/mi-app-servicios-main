// src/app/components/ayuda-contenido/AyudaEmpleados.tsx
import {
  MapPinIcon,
  TagIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaEmpleados() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="flex justify-center mb-2 -mt-15">
          <Logo width={240} height={240} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Búsqueda de Empleados</h2>
      <p className="text-center text-texto-secundario mb-6">
        Encuentra candidatos para cubrir puestos de trabajo en tu zona de influencia.
      </p>

      {/* --- PASO A PASO --- */}
      <ul className="space-y-4">
        <li className="flex items-start">
          <MapPinIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">1. Búsqueda Automática por Zona</h4>
            <p className="text-texto-secundario">
              La búsqueda se realiza automáticamente en base a la <strong className="text-texto-principal">localidad y provincia</strong> que tienes registrada en tu perfil. No necesitas ingresarla.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <TagIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">2. Filtra por Rubro (Opcional)</h4>
            <p className="text-texto-secundario">
              Para encontrar un perfil más específico, puedes seleccionar <strong className="text-texto-principal">un rubro</strong>. Si no seleccionas ninguno, la búsqueda te mostrará todos los CVs disponibles en tu zona.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <MagnifyingGlassIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">3. Inicia la Búsqueda</h4>
            <p className="text-texto-secundario">
              Presiona el botón <strong className="text-texto-principal">Buscar</strong>. Los resultados con los currículums de los candidatos se listarán debajo.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <UserGroupIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">4. Contacta a los Candidatos</h4>
            <p className="text-texto-secundario">
              Cada CV listado tendrá opciones para que puedas ver el perfil completo del candidato y botones con sus datos para que puedas contactarlo directamente.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}