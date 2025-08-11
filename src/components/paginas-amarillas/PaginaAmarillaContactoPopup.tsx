'use client';

import React from 'react';
import {
  XMarkIcon,
  PhoneIcon,
  GlobeAltIcon,
  ChatBubbleLeftEllipsisIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

import Card from '@/components/ui/Card';
import Avatar from '@/components/common/Avatar';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/components/ui/Button';
// --- CAMBIO 1: Se importa el tipo de dato serializado ---
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';

// --- Helper para generar enlaces (sin cambios) ---
const generarEnlaceWhatsApp = (telefono: string | null | undefined): string | undefined => {
  if (!telefono) return undefined;
  const numeroLimpio = telefono.replace(/[^\d+]/g, '');
  return `https://wa.me/${numeroLimpio}`;
};

// --- Props del Componente (actualizadas) ---
interface PaginaAmarillaContactoPopupProps {
  // --- CAMBIO 2: Se usa el tipo de dato serializado ---
  publicacion: SerializablePaginaAmarillaData;
  onClose: () => void;
}

// --- Componente Interno para cada Botón de Contacto (sin cambios) ---
interface ContactoBotonProps {
  href: string | undefined;
  label: string;
  ariaLabel: string;
  icon: React.ReactNode;
}

const ContactoBoton: React.FC<ContactoBotonProps> = ({ href, label, ariaLabel, icon }) => {
  if (!href) return null;

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
    emailContacto,
    enlaceWeb,
    enlaceInstagram,
    enlaceFacebook,
  } = publicacion;

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
            className="absolute top-3 right-3 text-texto-secundario hover:text-texto-principal p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          {/* Sección del Logo y Nombre */}
          <div className="flex flex-col items-center mb-6 mt-4">
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
            <ContactoBoton
              href={telefonoContacto ? `tel:${telefonoContacto}` : undefined}
              label="Llamar"
              ariaLabel={`Llamar a ${nombrePublico}`}
              icon={<PhoneIcon className="h-7 w-7" />}
            />

            <ContactoBoton
              href={generarEnlaceWhatsApp(telefonoContacto)}
              label="WhatsApp"
              ariaLabel={`Enviar WhatsApp a ${nombrePublico}`}
              icon={<ChatBubbleLeftEllipsisIcon className="h-7 w-7" />}
            />

            <ContactoBoton
              href={emailContacto ? `mailto:${emailContacto}` : undefined}
              label="Email"
              ariaLabel={`Enviar email a ${nombrePublico}`}
              icon={<LinkIcon className="h-7 w-7" />}
            />
            
            <ContactoBoton
              href={enlaceWeb || undefined}
              label="Sitio Web"
              ariaLabel={`Visitar sitio web de ${nombrePublico}`}
              icon={<GlobeAltIcon className="h-7 w-7" />}
            />

            <ContactoBoton
              href={enlaceInstagram || undefined}
              label="Instagram"
              ariaLabel={`Visitar Instagram de ${nombrePublico}`}
              icon={<LinkIcon className="h-7 w-7" />}
            />

            <ContactoBoton
              href={enlaceFacebook || undefined}
              label="Facebook"
              ariaLabel={`Visitar Facebook de ${nombrePublico}`}
              icon={<LinkIcon className="h-7 w-7" />}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaginaAmarillaContactoPopup;