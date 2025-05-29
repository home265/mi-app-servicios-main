// src/app/components/forms/SelectorLocalidad.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import localidadesData from '@/data/localidades.json';

interface Localidad {
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

const todasLasLocalidades: Localidad[] = localidadesData.localidades;

const SelectorLocalidad: React.FC<SelectorLocalidadProps> = ({
  id,
  label,
  placeholder = "Empieza a escribir...",
  error,
  onLocalidadSeleccionada,
}) => {
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState<Localidad[]>([]);
  const [seleccionActual, setSeleccionActual] = useState<string>(''); // Lo que el usuario ve en el input
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  const filtrarLocalidades = useCallback((busqueda: string) => {
    if (busqueda.length < 2) {
      setSugerencias([]);
      return;
    }
    const busquedaNormalizada = busqueda.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const filtradas = todasLasLocalidades
      .filter(loc => {
        const nombreNormalizado = loc.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const provinciaNormalizada = loc.provincia.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nombreNormalizado.includes(busquedaNormalizada) || provinciaNormalizada.includes(busquedaNormalizada);
      })
      .slice(0, 10);
    setSugerencias(filtradas);
  }, []);

  useEffect(() => {
    if (terminoBusqueda.length >= 2) { // Solo filtrar y mostrar si hay al menos 2 caracteres
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
    setTerminoBusqueda(''); // Limpia el término para que el useEffect oculte sugerencias
    setMostrarSugerencias(false); // Ocultar explícitamente
    onLocalidadSeleccionada(seleccion);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevoValor = e.target.value;
    setSeleccionActual(nuevoValor); // El usuario está escribiendo, actualizamos lo que ve
    setTerminoBusqueda(nuevoValor); // Y el término para filtrar
    if (nuevoValor === '') { // Si borra todo, limpiamos la selección en el form
        onLocalidadSeleccionada(null);
    }
  };

  // Cierra las sugerencias si se hace clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Verifica que el clic no sea dentro del wrapper del selector
      if (mostrarSugerencias && !(event.target as HTMLElement).closest(`#${id}-wrapper`)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarSugerencias, id]); // Dependencia 'id' para que el selector del listener sea correcto

  return (
    // ESTE DIV DEBE SER 'relative' para que el 'absolute' del 'ul' funcione correctamente dentro de él.
    <div id={`${id}-wrapper`} className="mb-4 relative">
      <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
        {label}
      </label>
      <input
        type="text"
        id={id} // El id del input
        value={seleccionActual} // Lo que el usuario ve y escribe
        onChange={handleChange}
        onFocus={() => {
          // Mostrar sugerencias si ya hay algo escrito y hay sugerencias para mostrar
          if (terminoBusqueda.length >= 2 && sugerencias.length > 0) {
            setMostrarSugerencias(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off" // Evita que el navegador muestre su propio autocompletado
        className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark"
      />

      {mostrarSugerencias && sugerencias.length > 0 && (
        <ul
          className="
            absolute w-full       /* Posicionamiento absoluto */
            bg-white dark:bg-zinc-800            /* Fondo sólido (usa tu variable --color-tarjeta) */
            border border-borde-tarjeta /* Borde violeta (usa --color-borde-tarjeta) */
            rounded-md shadow-xl  /* Sombra para destacar */
            mt-1 max-h-60 overflow-y-auto /* Scroll si hay muchas opciones */
            z-50                  /* <<-- z-index ALTO para estar por encima -->> */
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