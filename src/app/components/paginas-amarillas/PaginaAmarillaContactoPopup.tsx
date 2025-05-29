// src/app/components/paginas-amarillas/PaginaAmarillaContactoPopup.tsx
'use client';

import React from 'react';
import {
  XMarkIcon, // Para el botón de cerrar
  PhoneIcon,
  GlobeAltIcon, // Para sitio web
  // No tenemos iconos directos para Instagram o Facebook en Heroicons v2 outline/solid.
  // Usaremos GlobeAltIcon como genérico o consideraremos otra librería si son estrictamente necesarios.
  // Para WhatsApp, se suele usar un icono de chat o el propio logo de WhatsApp (imagen).
  // Por simplicidad y para usar Heroicons, podemos usar ChatBubbleLeftEllipsisIcon o similar.
  ChatBubbleLeftEllipsisIcon, // Para WhatsApp (o un genérico de chat)
  LinkIcon, // Placeholder genérico para redes sociales si no hay específicos
} from '@heroicons/react/24/outline';

import Card from '@/app/components/ui/Card';
import Avatar from '@/app/components/common/Avatar';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button';
import { PaginaAmarillaData } from '@/types/paginaAmarilla';

// --- Helper para generar enlaces ---
const generarEnlaceWhatsApp = (telefono: string | null | undefined): string | undefined => {
  if (!telefono) return undefined;
  // Limpiar el número de caracteres no numéricos, excepto el '+' inicial si existe
  const numeroLimpio = telefono.replace(/[^\d+]/g, '');
  return `https://wa.me/${numeroLimpio}`;
};

// --- Props del Componente ---
interface PaginaAmarillaContactoPopupProps {
  publicacion: PaginaAmarillaData;
  onClose: () => void;
}

// --- Componente Interno para cada Botón de Contacto (para evitar repetición) ---
interface ContactoBotonProps {
  href: string | undefined;
  label: string;
  ariaLabel: string;
  icon: React.ReactNode; // Recibe el componente icono ya instanciado
  //   onClick?: () => void; // Por si alguna acción no es un simple enlace
}

const ContactoBoton: React.FC<ContactoBotonProps> = ({ href, label, ariaLabel, icon }) => {
  if (!href) return null; // No renderizar si no hay enlace

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="flex flex-col items-center space-y-1 text-texto-secundario hover:text-primario transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </a>
  );
};


const PaginaAmarillaContactoPopup: React.FC<PaginaAmarillaContactoPopupProps> = ({
  publicacion,
  onClose,
}) => {
  const {
    nombrePublico,
    imagenPortadaUrl,
    telefonoContacto,
    emailContacto, // Ya existe en PaginaAmarillaData
    // --- Campos que NECESITAMOS añadir a PaginaAmarillaData para el popup ---
    // enlaceInstagram?: string;
    // enlaceFacebook?: string;
    // enlaceWeb?: string; // Este sí parece estar contemplado en la descripción
  } = publicacion;

  // Simulamos los campos que faltan en PaginaAmarillaData para desarrollo.
  // En producción, estos vendrían de `publicacion` si se añaden al tipo y al backend.
  const enlaceWeb = (publicacion as PaginaAmarillaData & { enlaceWeb?: string }).enlaceWeb;
  const enlaceInstagram = (publicacion as PaginaAmarillaData & { enlaceInstagram?: string }).enlaceInstagram;
  const enlaceFacebook = (publicacion as PaginaAmarillaData & { enlaceFacebook?: string }).enlaceFacebook;


  // No podemos tener un botón "Cancelar" que llame a onClose directamente dentro del Card
  // si usamos el Card como un modal completo con overlay.
  // El overlay debe manejar el onClose, o el botón de cerrar.

  return (
    // Overlay semitransparente para el modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose} // Cerrar al hacer clic en el overlay
    >
      <Card
        className="w-full max-w-xs shadow-2xl rounded-xl"
        onClick={(e) => e.stopPropagation()} // Evitar que el clic en la card cierre el modal
      >
        <div className="p-5 relative">
          {/* Botón de Cerrar en la esquina superior derecha */}
          <button
            onClick={onClose}
            aria-label="Cerrar popup"
            className="absolute top-3 right-3 text-texto-secundario hover:text-texto-principal p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Sección del Logo y Nombre */}
          <div className="flex flex-col items-center mb-6 mt-4"> {/* mt-4 para dejar espacio al botón cerrar */}
            <Avatar
              selfieUrl={imagenPortadaUrl}
              nombre={nombrePublico}
              size={80}
            />
            <h3 className="mt-3 text-lg font-semibold text-texto-principal text-center">
              {nombrePublico}
            </h3>
          </div>

          {/* Iconos Clicleables */}
          <div className="grid grid-cols-3 gap-x-2 gap-y-6 mb-6">
            {/* Teléfono */}
            <ContactoBoton
              href={telefonoContacto ? `tel:${telefonoContacto}` : undefined}
              label="Llamar"
              ariaLabel={`Llamar a ${nombrePublico}`}
              icon={<PhoneIcon className="h-7 w-7" />}
            />

            {/* WhatsApp */}
            <ContactoBoton
              href={generarEnlaceWhatsApp(telefonoContacto)}
              label="WhatsApp"
              ariaLabel={`Enviar WhatsApp a ${nombrePublico}`}
              icon={<ChatBubbleLeftEllipsisIcon className="h-7 w-7" />}
            />

            {/* Email */}
            <ContactoBoton
              href={emailContacto ? `mailto:${emailContacto}` : undefined}
              label="Email"
              ariaLabel={`Enviar email a ${nombrePublico}`}
              icon={<LinkIcon className="h-7 w-7" />} // Cambiado de EnvelopeIcon a LinkIcon temporalmente
            />
            
            {/* Página Web */}
            <ContactoBoton
              href={enlaceWeb} // Usará el simulado o el real si se añade a PaginaAmarillaData
              label="Sitio Web"
              ariaLabel={`Visitar sitio web de ${nombrePublico}`}
              icon={<GlobeAltIcon className="h-7 w-7" />}
            />

            {/* Instagram */}
            <ContactoBoton
              href={enlaceInstagram} // Usará el simulado o el real
              label="Instagram"
              ariaLabel={`Visitar Instagram de ${nombrePublico}`}
              // Podríamos usar un SVG personalizado si Heroicons no tiene uno adecuado
              // o un icono genérico de "enlace" o "red social".
              icon={<LinkIcon className="h-7 w-7" />} // Placeholder
            />

            {/* Facebook */}
            <ContactoBoton
              href={enlaceFacebook} // Usará el simulado o el real
              label="Facebook"
              ariaLabel={`Visitar Facebook de ${nombrePublico}`}
              icon={<LinkIcon className="h-7 w-7" />} // Placeholder
            />
          </div>

          {/* Botón de "Hecho" o "Cerrar" dentro de la card si se prefiere al X */}
          {/* <Button variant="secondary" fullWidth onClick={onClose}>
            Cerrar
          </Button> */}
          {/* Por ahora, el XMarkIcon y el click en overlay son suficientes */}
        </div>
      </Card>
    </div>
  );
};

export default PaginaAmarillaContactoPopup;