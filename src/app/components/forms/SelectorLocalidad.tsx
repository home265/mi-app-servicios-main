'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useCallback } from 'react';
import BotonDeSeleccion from '@/app/components/common/BotonDeSeleccion';

// Las interfaces permanecen intactas.
export interface Localidad {
  id: string;
  nombre: string;
  provincia: {
    id: string;
    nombre: string;
  };
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
}

const SelectorLocalidad: React.FC<SelectorLocalidadProps> = ({
  id,
  label,
  placeholder = "Empieza a escribir...",
  error,
  onLocalidadSeleccionada,
}) => {
  // Se elimina el estado 'todasLasLocalidades' para no almacenar el JSON en el cliente.
  const [estadoCarga, setEstadoCarga] = useState<'idle' | 'loading' | 'error'>('idle');
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Localidad[]>([]);
  const [seleccionActual, setSeleccionActual] = useState<string>('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Se elimina el useEffect que cargaba el archivo completo al inicio.

  // Este useEffect ahora maneja la búsqueda dinámica con "debounce".
  useEffect(() => {
    // Si el término de búsqueda es muy corto, no hacemos nada.
    if (terminoBusqueda.length < 2) {
      setSugerencias([]);
      setMostrarSugerencias(false);
      return;
    }

    // "Debounce": Espera 300ms después de que el usuario deja de escribir.
    const temporizador = setTimeout(() => {
      setEstadoCarga('loading');
      // Llama a la nueva API de búsqueda.
      fetch(`/api/buscar-localidades?query=${encodeURIComponent(terminoBusqueda)}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error('Error en la respuesta del servidor');
          }
          return res.json();
        })
        .then((data: { sugerencias: Localidad[] }) => {
          setSugerencias(data.sugerencias || []);
          setMostrarSugerencias(true);
          setEstadoCarga('idle');
        })
        .catch((err) => {
          console.error("Error al buscar localidades:", err);
          setEstadoCarga('error');
        });
    }, 300);

    // Limpia el temporizador si el usuario sigue escribiendo.
    return () => clearTimeout(temporizador);
  }, [terminoBusqueda]);

  // Las siguientes funciones y lógicas de manejo de eventos se mantienen
  // exactamente como las tenías, ya que están bien implementadas.

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mostrarSugerencias && !(event.target as HTMLElement).closest(`#${id}-wrapper`)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarSugerencias, id]);

  const placeholderActual = estadoCarga === 'loading'
    ? 'Buscando...'
    : estadoCarga === 'error'
    ? 'Error en la búsqueda'
    : placeholder;

  return (
    <div id={`${id}-wrapper`} className="mb-4 relative">
      <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-2">
        {label}
      </label>
      {/* --- INPUT CON ESTILO 3D "HUNDIDO" --- */}
      <input
        type="text"
        id={id}
        value={seleccionActual}
        onChange={handleChange}
        onFocus={() => {
          if (sugerencias.length > 0) {
            setMostrarSugerencias(true);
          }
        }}
        placeholder={placeholderActual}
        autoComplete="off"
        className="block w-full px-4 py-3 bg-tarjeta border-none rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6)] placeholder-texto-secundario focus:outline-none focus:ring-2 focus:ring-primario text-texto-principal transition-shadow"
      />

      {/* --- PANEL DE SUGERENCIAS 3D CON BOTONES --- */}
      {mostrarSugerencias && sugerencias.length > 0 && (
        <div
          className="
            absolute w-full
            bg-tarjeta
            rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.4),-2px_-2px_8px_rgba(249,243,217,0.08)]
            mt-2 max-h-60 overflow-y-auto
            z-50
            p-2 space-y-2
          "
        >
          {sugerencias.map((loc) => (
            <BotonDeSeleccion
              key={loc.id}
              onClick={() => handleSeleccion(loc)}
              label={`${loc.nombre}, ${loc.provincia.nombre}`}
            />
          ))}
        </div>
      )}
      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
};

export default SelectorLocalidad;