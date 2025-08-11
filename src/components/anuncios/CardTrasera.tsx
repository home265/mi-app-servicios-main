'use client';

import React from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { HorariosDeAtencion } from '@/types/horarios';
import { BuildingStorefrontIcon, WrenchScrewdriverIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

// --- INICIO: IMPORTS PARA NUEVOS ICONOS ---
import { FaWhatsapp, FaInstagram, FaFacebookF } from 'react-icons/fa';
import { GlobeAltIcon } from '@heroicons/react/24/solid';
// --- FIN: IMPORTS PARA NUEVOS ICONOS ---

const obtenerLineasHorarios = (horarios?: HorariosDeAtencion | null): string[] => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) return ['Consultar horarios'];
  const diasAbiertos = horarios.filter(d => d.estado !== 'cerrado');
  if (diasAbiertos.length === 0) return ['Cerrado todos los días'];

  const grouped = diasAbiertos.reduce((acc, dia) => {
    const horarioStr = dia.estado === 'abierto24h'
      ? '24hs'
      : (Array.isArray(dia.estado) ? dia.estado.map(r => `${r.de}-${r.a}`).join(', ') : 'Consultar');
    (acc[horarioStr] ||= []).push(dia.diaAbreviatura);
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped).map(([horario, dias]) =>
    dias.length > 2 ? `${dias[0]}-${dias[dias.length - 1]}: ${horario}` : `${dias.join(', ')}: ${horario}`
  );
};

interface Props {
  publicacion: SerializablePaginaAmarillaData;
}

const CardTrasera: React.FC<Props> = ({ publicacion }) => {
  const lineasHorarios = obtenerLineasHorarios(publicacion.horarios);
  const tituloDorso = publicacion.tituloCard || (publicacion.creatorRole === 'comercio' ? 'Nuestros Productos' : 'Mis Especialidades');
  const matricula = publicacion.matriculaProfesional;

  return (
    <div
      className="w-full h-full rounded-2xl text-white p-6 flex flex-col justify-between"
      style={{
        background: "url('/textura-oscura.png')",
        backgroundSize: 'cover',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
      }}
    >
      <div className="flex items-start justify-between border-b border-white/10 pb-3 mb-3">
        <h3 className="text-xl font-bold">{tituloDorso}</h3>
        {publicacion.creatorRole === 'comercio'
          ? <BuildingStorefrontIcon className="h-6 w-6 text-amber-400" />
          : <WrenchScrewdriverIcon className="h-6 w-6 text-amber-400" />
        }
      </div>

      <div className="flex-grow space-y-4 overflow-y-auto text-sm">
        {publicacion.descripcion && (<p className="opacity-80">{publicacion.descripcion}</p>)}

        {matricula && (
          <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
            <CheckBadgeIcon className="h-5 w-5 text-green-400 shrink-0" />
            <div>
              <p className="font-semibold text-xs opacity-70">Matrícula Profesional</p>
              <p className="font-mono">{matricula}</p>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-1">Horarios de Atención:</h4>
          <ul className="space-y-1 text-xs opacity-80">
            {lineasHorarios.map((linea, idx) => <li key={idx}>{linea}</li>)}
          </ul>
        </div>
      </div>

      {/* --- INICIO: SECCIÓN DE CONTACTO ACTUALIZADA CON ICONOS --- */}
      <div className="pt-4 mt-auto border-t border-white/10">
        <p className="text-center text-xs opacity-70 mb-3">Contactar por:</p>
        <div className="flex items-center justify-center gap-4">
          
          {/* Icono de WhatsApp (solo si hay teléfono) */}
          {publicacion.telefonoContacto && (
            <a href={`https://wa.me/${publicacion.telefonoContacto.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" 
   className="w-12 h-12 rounded-full bg-tarjeta flex items-center justify-center text-texto-principal text-2xl
              transition-all duration-150 ease-in-out hover:scale-110 active:scale-95 
              shadow-[2px_2px_5px_rgba(0,0,0,0.5),-2px_-2px_5px_rgba(255,255,255,0.1)]
              active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)]">
  <FaWhatsapp />
</a>
          )}

          {/* Icono de Instagram (solo si hay enlace) */}
          {publicacion.enlaceInstagram && (
            <a href={publicacion.enlaceInstagram} target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white text-2xl
                          transition-all duration-150 ease-in-out hover:scale-110 active:scale-95 
                          shadow-[2px_2px_5px_rgba(0,0,0,0.5),-2px_-2px_5px_rgba(255,255,255,0.1)]
                          active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)]">
              <FaInstagram />
            </a>
          )}

          {/* Icono de Facebook (solo si hay enlace) */}
          {publicacion.enlaceFacebook && (
            <a href={publicacion.enlaceFacebook} target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-2xl
                          transition-all duration-150 ease-in-out hover:scale-110 active:scale-95 
                          shadow-[2px_2px_5px_rgba(0,0,0,0.5),-2px_-2px_5px_rgba(255,255,255,0.1)]
                          active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)]">
              <FaFacebookF />
            </a>
          )}

          {/* Icono de Página Web (solo si hay enlace) */}
          {publicacion.enlaceWeb && (
            <a href={publicacion.enlaceWeb} target="_blank" rel="noopener noreferrer"
               className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white text-2xl
                          transition-all duration-150 ease-in-out hover:scale-110 active:scale-95 
                          shadow-[2px_2px_5px_rgba(0,0,0,0.5),-2px_-2px_5px_rgba(255,255,255,0.1)]
                          active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)]">
              <GlobeAltIcon className="w-7 h-7" />
            </a>
          )}
          
        </div>
      </div>
      {/* --- FIN: SECCIÓN DE CONTACTO ACTUALIZADA --- */}
    </div>
  );
};

export default CardTrasera;