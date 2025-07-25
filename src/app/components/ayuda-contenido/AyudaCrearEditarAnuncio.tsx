// src/app/components/ayuda-contenido/AyudaCrearEditarAnuncio.tsx
import {
  RectangleStackIcon,
  CalendarDaysIcon,
  PhotoIcon,
  PaintBrushIcon,
  EyeIcon,
  CreditCardIcon,
  CheckCircleIcon,
  GiftIcon,
  DocumentCheckIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

// Definimos el tipo para las fases granulares.
type FaseAnuncio = 'fase1a' | 'fase1b' | 'fase1c' | 'fase1d' | 'fase2' | 'fase3';

interface Props {
  fase?: FaseAnuncio;
}

export default function AyudaCrearEditarAnuncio({ fase }: Props) {
  // --- Componentes para cada fase ---

  const Fase1a = ( // Ayuda para la pantalla de Planes
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Paso 1: Elige tu Plan</h3>
      <div className="flex items-start">
        <RectangleStackIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
        <div>
          <h4 className="font-semibold">¿Qué plan se ajusta a ti?</h4>
          <p className="text-texto-secundario">Selecciona el plan que mejor se ajuste a tus necesidades. Cada plan define el precio, la duración y la cantidad máxima de imágenes que puedes usar.</p>
        </div>
      </div>
    </>
  );

  const Fase1b = ( // Ayuda para la pantalla de Campañas
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Paso 2: Define tu Campaña</h3>
      <div className="flex items-start">
        <CalendarDaysIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
        <div>
          <h4 className="font-semibold">¿Por cuánto tiempo?</h4>
          <p className="text-texto-secundario">Escoge por cuánto tiempo quieres que tu anuncio esté activo (mensual, trimestral, etc.). Fíjate en los posibles descuentos que ofrecemos para campañas más largas.</p>
        </div>
      </div>
    </>
  );

  const Fase1c = ( // Ayuda para la pantalla de Resumen
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Paso 3: Revisa el Resumen</h3>
      <div className="flex items-start">
        <ClipboardDocumentCheckIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Confirma tus elecciones</h4>
          <p className="text-texto-secundario">
            Esta pantalla te muestra un resumen de tu plan y campaña con el costo total. Usa los botones para: 
            <strong className="text-texto-principal"> Volver</strong>, 
            <strong className="text-texto-principal"> Cancelar</strong> o 
            <strong className="text-texto-principal"> Continuar</strong> al siguiente paso.
          </p>
        </div>
      </div>
    </>
  );

  const Fase1d = ( // Ayuda para la pantalla del Contador de Imágenes
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Paso 4: Cantidad de Imágenes</h3>
      <div className="flex items-start">
        <PhotoIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
        <div>
          <h4 className="font-semibold">Ajusta tu anuncio</h4>
          <p className="text-texto-secundario">Usa la barra deslizante para elegir cuántas imágenes (pantallas) tendrá tu anuncio, hasta el máximo permitido por tu plan. La barra te informará la duración de cada imagen.</p>
        </div>
      </div>
    </>
  );

  const Fase2 = ( // --- FASE 2 MODIFICADA ---
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Fase 2: El Editor Creativo</h3>
      <ol className="space-y-4 mb-6 list-decimal list-inside">
        <li className="flex items-start">
          <PaintBrushIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Usa las Herramientas</h4>
            <p className="text-texto-secundario">A un costado, encontrarás la barra de herramientas. Podrás añadir fondos, imágenes, logos y texto.</p>
          </div>
        </li>
         <li className="flex items-start">
          <DocumentCheckIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Navega y Guarda</h4>
            <p className="text-texto-secundario">Usa el botón <strong className="text-texto-principal">Guardar y Continuar</strong> para pasar a la siguiente imagen.</p>
          </div>
        </li>
        {/* --- MOVIMOS ESTE PASO DE LA FASE 3 A LA FASE 2 --- */}
        <li className="flex items-start">
          <EyeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Previsualiza y Finaliza</h4>
            <p className="text-texto-secundario">En la última pantalla, el botón cambiará a <strong className="text-texto-principal">Finalizar</strong>. Esto te llevará a una vista previa exacta de tu anuncio. Si algo no te gusta, podrás <strong className="text-texto-principal">Volver a editar</strong>.</p>
          </div>
        </li>
      </ol>
    </>
  );

  const Fase3 = ( // --- FASE 3 MODIFICADA ---
    <>
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Fase 3: Pago del Anuncio</h3>
      <ol className="space-y-4 mb-6 list-decimal list-inside">
        {/* --- SE ELIMINÓ EL PASO DE PREVISUALIZACIÓN DE AQUÍ --- */}
        <li className="flex items-start">
          <CreditCardIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Confirmación y Pago</h4>
            <p className="text-texto-secundario">Desde la previsualización, al presionar <strong className="text-texto-principal">Continuar y pagar</strong>, se abrirá un último resumen para que confirmes los datos y realices el pago.</p>
          </div>
        </li>
        <li className="flex items-start">
          <CheckCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Anuncio Activado!</h4>
            <p className="text-texto-secundario">Tras un pago exitoso, tu anuncio se marcará como activo y pronto comenzará a mostrarse en la app.</p>
          </div>
        </li>
      </ol>
    </>
  );

  const Bonus = (
    <>
        <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">¡Bonus Desbloqueado!</h3>
        <div className="flex items-start">
          <GiftIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Publicación Gratis en Páginas Amarillas</h4>
            <p className="text-texto-secundario">
              Al tener un anuncio activo, se habilitarán en tu pantalla de bienvenida los botones para <strong className="text-texto-principal">Crear y Editar tu Publicación</strong> en las Páginas Amarillas, ¡gratis durante un año!
            </p>
          </div>
        </div>
    </>
  );
  
  const renderContent = () => {
    switch (fase) {
      case 'fase1a': return Fase1a;
      case 'fase1b': return Fase1b;
      case 'fase1c': return Fase1c;
      case 'fase1d': return Fase1d;
      case 'fase2': return Fase2;
      case 'fase3': return Fase3;
      default:
        return (
          <>
            <h2 className='text-xl font-bold text-center mb-4 text-primario'>Flujo Completo</h2>
            {Fase1a}
            {Fase1b}
            {Fase1c}
            {Fase1d}
            {Fase2}
            {Fase3}
            {Bonus}
          </>
        );
    }
  };

  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        <div className="flex justify-center mb-2 -mt-15">
          <Logo width={240} height={240} />
        </div>
      </div>
      {!fase && <h2 className="text-2xl font-bold text-center mb-4">Creando tu Anuncio Animado</h2>}
      
      {renderContent()}
    </div>
  );
}