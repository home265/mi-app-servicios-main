'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useCallback } from 'react';

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
      <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
        {label}
      </label>
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
        // El input ya no se deshabilita, solo cambia el placeholder para indicar el estado.
        className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark disabled:bg-gray-200 disabled:dark:bg-gray-700"
      />

      {mostrarSugerencias && sugerencias.length > 0 && (
        <ul
          className="
            absolute w-full
            bg-white dark:bg-zinc-800
            border border-borde-tarjeta
            rounded-md shadow-xl
            mt-1 max-h-60 overflow-y-auto
            z-50
          "
        >
          {sugerencias.map((loc) => (
            <li
              key={loc.id}
              onClick={() => handleSeleccion(loc)}
              className="px-3 py-2 hover:bg-secundario hover:text-white cursor-pointer text-sm text-texto dark:text-texto-dark dark:hover:text-secundario dark:hover:bg-opacity-80"
            >
              {loc.nombre}, {loc.provincia.nombre}
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-error mt-1">{error}</p>}
    </div>
  );
};

export default SelectorLocalidad;