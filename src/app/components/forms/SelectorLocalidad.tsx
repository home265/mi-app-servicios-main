'use client';

import React, { useState, useEffect, useCallback } from 'react';

// 1. Se elimina la importación del archivo JSON.
// import localidadesData from '@/data/localidades.json';

// Las interfaces ahora definen la estructura de los datos que se cargarán.
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

// 2. Ya no se crea la constante 'todasLasLocalidades' desde el import.

const SelectorLocalidad: React.FC<SelectorLocalidadProps> = ({
  id,
  label,
  placeholder = "Empieza a escribir...",
  error,
  onLocalidadSeleccionada,
}) => {
  // 3. Se añaden estados para manejar la carga de datos.
  const [todasLasLocalidades, setTodasLasLocalidades] = useState<Localidad[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<'idle' | 'loading' | 'error'>('idle');

  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Localidad[]>([]);
  const [seleccionActual, setSeleccionActual] = useState<string>('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // 4. useEffect para cargar los datos desde la carpeta 'public'.
  useEffect(() => {
    setEstadoCarga('loading');
    fetch('/localidades.json') // La URL es relativa a la carpeta 'public'.
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Error HTTP: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Asumimos que el JSON tiene una clave 'localidades' que contiene el array.
        setTodasLasLocalidades(data.localidades || []);
        setEstadoCarga('idle');
      })
      .catch((err) => {
        console.error("Error al cargar localidades.json:", err);
        setEstadoCarga('error');
      });
  }, []); // El array vacío [] asegura que esto se ejecute solo una vez.

  const filtrarLocalidades = useCallback((busqueda: string) => {
    if (busqueda.length < 2) {
      setSugerencias([]);
      return;
    }
    const busquedaNormalizada = busqueda.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // 5. La función ahora usa el estado 'todasLasLocalidades' que se cargó con fetch.
    const filtradas = todasLasLocalidades
      .filter(loc => {
        const nombreNormalizado = loc.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const provinciaNormalizada = loc.provincia.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nombreNormalizado.includes(busquedaNormalizada) || provinciaNormalizada.includes(busquedaNormalizada);
      })
      .slice(0, 10);
    setSugerencias(filtradas);
  }, [todasLasLocalidades]); // Se añade dependencia para que se actualice cuando los datos carguen.

  useEffect(() => {
    if (terminoBusqueda.length >= 2) {
      filtrarLocalidades(terminoBusqueda);
      setMostrarSugerencias(true);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [terminoBusqueda, filtrarLocalidades]);

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

  // 6. Se mejora el placeholder y se deshabilita el input mientras carga.
  const placeholderActual = estadoCarga === 'loading'
    ? 'Cargando localidades...'
    : estadoCarga === 'error'
    ? 'Error al cargar datos'
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
          if (terminoBusqueda.length >= 2 && sugerencias.length > 0) {
            setMostrarSugerencias(true);
          }
        }}
        placeholder={placeholderActual}
        autoComplete="off"
        disabled={estadoCarga !== 'idle'}
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