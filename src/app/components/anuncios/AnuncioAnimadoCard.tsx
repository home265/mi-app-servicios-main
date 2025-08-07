'use client';

import React, { useState, useEffect } from 'react';
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import { HorariosDeAtencion, RangoHorario } from '@/types/horarios';
import Avatar from '@/app/components/common/Avatar';

/**
 * Convierte los horarios de atención en líneas de texto.
 */
const obtenerLineasHorarios = (
  horarios?: HorariosDeAtencion | null
): string[] => {
  if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
    return ['Consultar horarios'];
  }
  const diasAbiertos = horarios.filter(
    (dia) => dia.estado !== 'cerrado'
  );
  if (diasAbiertos.length === 0) {
    return ['Cerrado todos los días'];
  }
  return diasAbiertos.map((dia) => {
    const abrev = dia.diaAbreviatura;
    if (dia.estado === 'abierto24h') {
      return `${abrev}: 24hs`;
    }
    if (Array.isArray(dia.estado) && dia.estado.length > 0) {
      const rangos = dia.estado
        .map((rango: RangoHorario) => `${rango.de}-${rango.a}`)
        .join(', ');
      return `${abrev}: ${rangos}`;
    }
    return `${abrev}: consultar`;
  });
};

interface Props {
  publicacion: SerializablePaginaAmarillaData;
  duracionFrente: number;
  duracionDorso: number;
}

const AnuncioAnimadoCard: React.FC<Props> = ({
  publicacion,
  duracionFrente,
  duracionDorso,
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Título de la cara trasera
  const tituloDorso =
    publicacion.tituloCard ||
    (publicacion.creatorRole === 'comercio'
      ? 'Nuestros Productos'
      : 'Especialidades');

  // Detalles a mostrar
  const detalles: string[] = [];
  if (publicacion.creatorRole === 'prestador') {
    if (publicacion.categoria) detalles.push(publicacion.categoria);
    if (publicacion.subCategoria)
      detalles.push(publicacion.subCategoria);
  } else {
    if (publicacion.rubro) detalles.push(publicacion.rubro);
    if (publicacion.subRubro) detalles.push(publicacion.subRubro);
  }
  if (publicacion.descripcion) {
    detalles.push(
      `${publicacion.descripcion.substring(0, 50)}...`
    );
  }

  const lineasHorarios = obtenerLineasHorarios(
    publicacion.horarios
  );

  useEffect(() => {
    const ciclo = duracionFrente + duracionDorso;
    const flipCard = () => {
      setIsFlipped(false);
      setTimeout(() => setIsFlipped(true), duracionFrente);
    };
    flipCard();
    const intervalo = setInterval(flipCard, ciclo);
    return () => clearInterval(intervalo);
  }, [duracionFrente, duracionDorso]);

  return (
    <div className="perspective-1000 w-full max-w-sm mx-auto">
      <div
        className={
          `relative w-full h-full duration-1000 transition-transform preserve-3d ` +
          (isFlipped ? 'rotate-y-180' : '')
        }
        style={{ aspectRatio: '9/12' }}
      >
        {/* --- CARA FRONTAL --- */}
        <div className="absolute inset-0 backface-hidden overflow-hidden rounded-2xl border-2 border-amber-400 shadow-2xl shadow-amber-500/20 bg-tarjeta flex flex-col items-center justify-center p-6 text-center">
          <Avatar
            selfieUrl={
              publicacion.imagenPortadaUrl ?? undefined
            }
            nombre={publicacion.nombrePublico}
            size={120}
          />
          <h3 className="mt-4 text-2xl font-bold text-amber-300">
            {publicacion.nombrePublico}
          </h3>
        </div>

        {/* --- CARA TRASERA --- */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 overflow-hidden rounded-2xl border-2 border-amber-400 shadow-2xl bg-fondo-oscuro flex flex-col justify-between p-6">
          <div>
            <h4 className="text-xl font-bold text-texto-principal mb-3">
              {tituloDorso}
            </h4>
            {detalles.length > 0 && (
              <ul className="text-sm text-texto-secundario list-disc list-inside space-y-1">
                {detalles.map((detalle, idx) => (
                  <li key={idx}>{detalle}</li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <h5 className="font-semibold text-texto-principal">
                Días de Atención:
              </h5>
              <ul className="text-xs text-texto-secundario space-y-1 mt-1">
                {lineasHorarios.slice(0, 3).map((linea, idx) => (
                  <li key={idx}>{linea}</li>
                ))}
                {lineasHorarios.length > 3 && (
                  <li className="opacity-70">... y más.</li>
                )}
              </ul>
            </div>
          </div>
          <a
            href={`https://wa.me/${publicacion.telefonoContacto?.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4 btn-primary text-center"
          >
            Contactar Ahora
          </a>
        </div>
      </div>
    </div>
  );
};

export default AnuncioAnimadoCard;
