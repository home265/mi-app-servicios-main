'use client';

import React from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
// --- CAMBIO: Se elimina la importación de 'RangoHorario' que no se usaba ---
import { HorariosDeAtencion } from '@/types/horarios';
import { BuildingStorefrontIcon, WrenchScrewdriverIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';


// --- Función de Ayuda para procesar los horarios ---
const obtenerLineasHorarios = (horarios?: HorariosDeAtencion | null): string[] => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return ['Consultar horarios'];
  }
  const diasAbiertos = horarios.filter(d => d.estado !== 'cerrado');
  if (diasAbiertos.length === 0) {
    return ['Cerrado todos los días'];
  }
  // Lógica para agrupar días con horarios idénticos
  const grouped = diasAbiertos.reduce((acc, dia) => {
    const horarioStr = dia.estado === 'abierto24h' ? '24hs' :
      (Array.isArray(dia.estado) ? dia.estado.map(r => `${r.de}-${r.a}`).join(', ') : 'Consultar');
    
    if (acc[horarioStr]) {
      acc[horarioStr].push(dia.diaAbreviatura);
    } else {
      acc[horarioStr] = [dia.diaAbreviatura];
    }
    return acc;
  }, {} as Record<string, string[]>);

  return Object.entries(grouped).map(([horario, dias]) => {
    if (dias.length > 2) {
      return `${dias[0]}-${dias[dias.length - 1]}: ${horario}`;
    }
    return `${dias.join(', ')}: ${horario}`;
  });
};

interface Props {
  publicacion: SerializablePaginaAmarillaData;
}

const CardTrasera: React.FC<Props> = ({ publicacion }) => {
  const lineasHorarios = obtenerLineasHorarios(publicacion.horarios);

  const tituloDorso = publicacion.tituloCard || (publicacion.creatorRole === 'comercio' ? 'Nuestros Productos' : 'Mis Especialidades');
  
  // --- CAMBIO: Se accede a 'matriculaProfesional' de forma segura y sin 'any' ---
  const matricula = publicacion.matriculaProfesional;

  return (
    <div className="w-full h-full rounded-2xl text-white p-6 flex flex-col justify-between" style={{ background: "url('/textura-oscura.png')", backgroundSize: 'cover' }}>
      {/* Sección Superior con Título e Icono */}
      <div className="flex items-start justify-between border-b border-white/10 pb-3 mb-3">
        <h3 className="text-xl font-bold">{tituloDorso}</h3>
        {publicacion.creatorRole === 'comercio' 
          ? <BuildingStorefrontIcon className="h-6 w-6 text-amber-400" />
          : <WrenchScrewdriverIcon className="h-6 w-6 text-amber-400" />
        }
      </div>

      {/* Contenido Principal */}
      <div className="flex-grow space-y-4 overflow-y-auto text-sm">
        {publicacion.descripcion && (
          <p className="opacity-80">{publicacion.descripcion}</p>
        )}
        
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
            {lineasHorarios.map((linea, idx) => (
              <li key={idx}>{linea}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Botón de Contacto Fijo en la Parte Inferior */}
      <div className="pt-4 mt-auto">
        <a
            href={`https://wa.me/${publicacion.telefonoContacto?.replace(/\D/g, '') || ''}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-primary text-center block" // `block` es importante
          >
            Contactar Ahora
          </a>
      </div>
    </div>
  );
};

export default CardTrasera;