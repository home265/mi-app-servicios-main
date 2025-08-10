'use client';

import React, { useState, useEffect, useRef } from 'react'; // Se añade useRef
import BotonDeSeleccion from '@/app/components/common/BotonDeSeleccion';

// Las interfaces permanecen intactas.
export interface Localidad {
  id: string;
  nombre: string;
  provincia: { id: string; nombre: string; };
}

export interface LocalidadSeleccionada {
  id: string;
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

  // --- INICIO: LÓGICA CON useRef ---
  // Usamos useRef para tener una referencia mutable que no se vea afectada por los closures.
  const clicEnSugerenciaRef = useRef(false);
  // --- FIN: LÓGICA CON useRef ---

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

  const handleSeleccion = (localidad: Localidad) => {
    const seleccion: LocalidadSeleccionada = {
      id: localidad.id,
      nombre: localidad.nombre,
      provinciaNombre: localidad.provincia.nombre,
    };
    setSeleccionActual(`${localidad.nombre}, ${localidad.provincia.nombre}`);
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
    // Damos un pequeño respiro para que el onMouseDown del botón se registre.
    setTimeout(() => {
      // Si la bandera 'clicEnSugerenciaRef' está activa, significa que el usuario
      // está seleccionando una opción, por lo que no hacemos nada y reseteamos la bandera.
      if (clicEnSugerenciaRef.current) {
        clicEnSugerenciaRef.current = false;
        return;
      }
      
      // Si no se hizo clic en una sugerencia, procedemos con la lógica de limpieza.
      const matchExacto = sugerencias.find(
        s => `${s.nombre}, ${s.provincia.nombre}`.toLowerCase() === seleccionActual.toLowerCase()
      );

      if (!matchExacto && strict) {
        setSeleccionActual('');
        setTerminoBusqueda('');
        onLocalidadSeleccionada(null);
      }
      setMostrarSugerencias(false);
    }, 150); // Un delay corto es suficiente.
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
          {sugerencias.map((loc) => (
            <BotonDeSeleccion
              key={loc.id}
              label={`${loc.nombre}, ${loc.provincia.nombre}`}
              // Al presionar el botón, activamos nuestra bandera.
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