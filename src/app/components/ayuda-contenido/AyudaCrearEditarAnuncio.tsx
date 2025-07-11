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
} from '@heroicons/react/24/solid';
import Logo from '@/app/components/ui/Logo';

export default function AyudaCrearEditarAnuncio() {
  return (
    <div className="text-sm">
      <div className="flex justify-center mb-4">
        {/* Manejo correcto del componente Logo */}
        <div className="w-20 h-auto">
          <Logo />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-center mb-4">Creando tu Anuncio Animado</h2>
      <p className="text-center text-texto-secundario mb-6">
        Sigue estos pasos para diseñar un anuncio dinámico, similar a un reel, que se mostrará en toda la app.
      </p>

      {/* --- FASE 1: Configuración --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Fase 1: Configuración Inicial</h3>
      <ol className="space-y-4 mb-6 list-decimal list-inside">
        <li className="flex items-start">
          <RectangleStackIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Elige tu Plan</h4>
            <p className="text-texto-secundario">Selecciona el plan que mejor se ajuste a tus necesidades. Cada plan define el precio, la duración y la cantidad máxima de imágenes que puedes usar.</p>
          </div>
        </li>
        <li className="flex items-start">
          <CalendarDaysIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Define tu Campaña</h4>
            <p className="text-texto-secundario">Escoge por cuánto tiempo quieres que tu anuncio esté activo (mensual, trimestral, etc.). Fíjate en los posibles descuentos. Verás un resumen y el precio total.</p>
          </div>
        </li>
        <li className="flex items-start">
          <PhotoIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Selecciona la Cantidad de Imágenes</h4>
            <p className="text-texto-secundario">Usa la barra deslizante para elegir cuántas imágenes (pantallas) tendrá tu anuncio, hasta el máximo permitido por tu plan. La barra te informará la duración total del anuncio.</p>
          </div>
        </li>
      </ol>

      {/* --- FASE 2: Editor --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Fase 2: El Editor Creativo</h3>
      <ol className="space-y-4 mb-6 list-decimal list-inside">
        <li className="flex items-start">
          <PaintBrushIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Usa las Herramientas</h4>
            <p className="text-texto-secundario">A un costado, encontrarás la barra de herramientas. Podrás añadir fondos de color, gradientes, imágenes, logos, texto (normal y curvo) y efectos de transición entre cada pantalla.</p>
          </div>
        </li>
         <li className="flex items-start">
          <DocumentCheckIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Navega y Guarda</h4>
            <p className="text-texto-secundario">Usa el botón <strong className="text-texto-principal">Guardar y Continuar</strong> para pasar a la siguiente imagen. En la última, el botón cambiará a <strong className="text-texto-principal">Finalizar</strong>.</p>
          </div>
        </li>
      </ol>
      
      {/* --- FASE 3: Finalización --- */}
      <h3 className="font-bold text-lg mb-3 text-primario border-b border-borde-tarjeta pb-1">Fase 3: Revisión Final y Pago</h3>
      <ol className="space-y-4 mb-6 list-decimal list-inside">
        <li className="flex items-start">
          <EyeIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Previsualización Final</h4>
            <p className="text-texto-secundario">Antes de pagar, verás una vista previa exacta de tu anuncio. Si algo no te gusta, puedes <strong className="text-texto-principal">Volver a editar</strong>.</p>
          </div>
        </li>
        <li className="flex items-start">
          <CreditCardIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">Confirmación y Pago</h4>
            <p className="text-texto-secundario">Al presionar <strong className="text-texto-principal">Continuar y pagar</strong>, se abrirá un último resumen. Confirma los datos y realiza el pago.</p>
          </div>
        </li>
        <li className="flex items-start">
          <CheckCircleIcon className="w-6 h-6 mr-3 mt-1 text-secundario flex-shrink-0" />
          <div>
            <h4 className="font-semibold">¡Anuncio Activado!</h4>
            <p className="text-texto-secundario">Tras un pago exitoso, tu anuncio se marcará como activo y pronto comenzará a mostrarse en la app. Serás redirigido a la pantalla de bienvenida.</p>
          </div>
        </li>
      </ol>

      {/* --- BONUS --- */}
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

    </div>
  );
}