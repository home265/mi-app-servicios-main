'use client';

import React, { useState, useEffect, useRef } from 'react';
import BotonDeSeleccion from '@/components/common/BotonDeSeleccion';

// 1. PRIMER CAMBIO: Se actualizan las interfaces para que coincidan con los datos de la API.
export interface Localidad {
  nombre: string;
  provincia: string;
}

export interface LocalidadSeleccionada {
  id: string; // Mantenemos un id para la selección
  nombre: string;
  provinciaNombre: string;
}

interface SelectorLocalidadProps {
  id: string;
  label: string;
  placeholder?: string;
  error?: string;
  onLocalidadSeleccionada: (localidad: LocalidadSeleccionada | null) => void;
  strict?: boolean;
}

const SelectorLocalidad: React.FC<SelectorLocalidadProps> = ({
  id,
  label,
  placeholder = "Empieza a escribir...",
  error,
  onLocalidadSeleccionada,
  strict = true,
}) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Localidad[]>([]);
  const [seleccionActual, setSeleccionActual] = useState('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [estadoCarga, setEstadoCarga] = useState<'idle' | 'loading' | 'error'>('idle');
  const clicEnSugerenciaRef = useRef(false);

  useEffect(() => {
    if (terminoBusqueda.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }
    const temporizador = setTimeout(() => {
      setEstadoCarga('loading');
      fetch(`/api/buscar-localidades?query=${encodeURIComponent(terminoBusqueda)}`)
        .then(res => res.json())
        .then((data: { sugerencias: Localidad[] }) => {
          setSugerencias(data.sugerencias || []);
          setMostrarSugerencias(true);
          setEstadoCarga('idle');
        })
        .catch(() => setEstadoCarga('error'));
    }, 300);
    return () => clearTimeout(temporizador);
  }, [terminoBusqueda]);

  // 2. SEGUNDO CAMBIO: Se ajusta la lógica de 'handleSeleccion'.
  const handleSeleccion = (localidad: Localidad) => {
    const seleccion: LocalidadSeleccionada = {
      // Creamos un ID único combinando nombre y provincia, ya que no viene de la API.
      id: `${localidad.nombre}-${localidad.provincia}`, 
      nombre: localidad.nombre,
      provinciaNombre: localidad.provincia, // Se usa directamente 'localidad.provincia'.
    };
    // El texto mostrado ahora usa 'localidad.provincia' directamente.
    setSeleccionActual(`${localidad.nombre}, ${localidad.provincia}`);
    setTerminoBusqueda('');
    setMostrarSugerencias(false);
    onLocalidadSeleccionada(seleccion);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;
    setSeleccionActual(nuevoValor);
    setTerminoBusqueda(nuevoValor);
    if (nuevoValor === '') {
      onLocalidadSeleccionada(null);
    }
  };
  
  const handleBlur = () => {
    setTimeout(() => {
      if (clicEnSugerenciaRef.current) {
        clicEnSugerenciaRef.current = false;
        return;
      }
      // La lógica de match exacto también debe usar el nuevo formato.
      const matchExacto = sugerencias.find(
        s => `${s.nombre}, ${s.provincia}`.toLowerCase() === seleccionActual.toLowerCase()
      );

      if (!matchExacto && strict) {
        setSeleccionActual('');
        setTerminoBusqueda('');
        onLocalidadSeleccionada(null);
      }
      setMostrarSugerencias(false);
    }, 150);
  };

  const placeholderActual = estadoCarga === 'loading' ? 'Buscando...' : placeholder;

  return (
    <div className="mb-4 relative">
      <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-2">
        {label}
      </label>
      <input
        type="text"
        id={id}
        value={seleccionActual}
        onChange={handleChange}
        onFocus={() => { if (terminoBusqueda.length >= 2) setMostrarSugerencias(true); }}
        onBlur={handleBlur}
        placeholder={placeholderActual}
        autoComplete="off"
        className="block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow"
      />

      {mostrarSugerencias && sugerencias.length > 0 && (
        <div className="absolute w-full bg-tarjeta rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.4),-2px_-2px_8px_rgba(249,243,217,0.08)] mt-2 max-h-60 overflow-y-auto z-50 p-2 space-y-2">
          
          {/* 3. TERCER CAMBIO: Se ajusta cómo se muestran las sugerencias. */}
          {sugerencias.map((loc) => (
            <BotonDeSeleccion
              // Se crea una 'key' única, ya que 'loc.id' no existe.
              key={`${loc.nombre}-${loc.provincia}`} 
              // Se muestra 'loc.provincia' directamente.
              label={`${loc.nombre}, ${loc.provincia}`}
              onMouseDown={() => { clicEnSugerenciaRef.current = true; }}
              onClick={() => handleSeleccion(loc)}
            />
          ))}

        </div>
      )}
      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
};

export default SelectorLocalidad;