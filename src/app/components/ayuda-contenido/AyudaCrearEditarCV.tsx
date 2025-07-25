// src/app/components/ayuda-contenido/AyudaCrearEditarCV.tsx
import {
  IdentificationIcon,
  PencilSquareIcon,
  DocumentCheckIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaCrearEditarCV() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="flex justify-center mb-2 -mt-15">
          <Logo width={240} height={240} />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Tu Curriculum Vitae en CODYS</h2>
      <p className="text-center text-texto-secundario mb-6">
        Crea tu CV para que prestadores y comercios puedan contactarte para cubrir puestos de trabajo.
      </p>

      {/* --- PASO A PASO --- */}
      <ul className="space-y-4">
        <li className="flex items-start">
          <IdentificationIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">1. Tus Datos Principales (¡Automático!)</h4>
            <p className="text-texto-secundario">
              Para evitar fraudes, tu nombre y foto de perfil se cargan automáticamente desde tu registro. ¡No tienes que preocuparte por ellos!
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <PencilSquareIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">2. Completa tu Perfil Profesional</h4>
            <p className="text-texto-secundario">
              Describe tus habilidades, elige hasta 4 rubros donde te destacas y detalla tus estudios (completo, incompleto, etc.). Sé honesto, ya que un empleador podría solicitarte los certificados.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <DocumentCheckIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">3. Guarda, Edita y Elimina</h4>
            <p className="text-texto-secundario">
              La primera vez, el botón dirá <strong className="text-texto-principal">Crear CV</strong>. Después, cambiará a <strong className="text-texto-principal">Editar CV</strong>. <strong className="text-error">¡Atención!</strong> Tienes un límite de ediciones, así que revisa bien tus datos antes de guardar. Si quieres eliminar tu CV, podrás hacerlo desde la sección de <strong className="text-texto-principal">Ajustes</strong>.
            </p>
          </div>
        </li>
        <li className="flex items-start">
          <ShieldExclamationIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Nuestra Política de Contratación</h4>
            <p className="text-texto-secundario">
              CODYS solo facilita el contacto. La postulación, entrevistas y contratación son un acuerdo privado entre tú y el empleador. Te recomendamos tomar los recaudos necesarios.
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}