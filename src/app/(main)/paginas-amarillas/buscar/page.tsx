// src/app/(main)/paginas-amarillas/buscar/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation'; // Para manejar query params

import { PaginaAmarillaData, PaginaAmarillaFiltros, RolPaginaAmarilla } from '@/types/paginaAmarilla';
import PaginasAmarillasFiltros from './components/PaginasAmarillasFiltros';
import PaginasAmarillasResultados from './components/PaginasAmarillasResultados';
// import { toast } from 'react-hot-toast'; // O tu sistema de notificaciones

type EstadoCarga = 'idle' | 'loading' | 'success' | 'error';

// --- Helper para construir la query string ---
const construirQueryString = (filtros: PaginaAmarillaFiltros): string => {
  const params = new URLSearchParams();
  if (filtros.provincia) params.append('provincia', filtros.provincia);
  if (filtros.localidad) params.append('localidad', filtros.localidad);
  if (filtros.rol) params.append('rol', filtros.rol);
  if (filtros.categoria) params.append('categoria', filtros.categoria);
  if (filtros.subCategoria) params.append('subCategoria', filtros.subCategoria);
  if (filtros.rubro) params.append('rubro', filtros.rubro);
  if (filtros.subRubro) params.append('subRubro', filtros.subRubro);
  if (typeof filtros.realizaEnvios === 'boolean') {
    params.append('realizaEnvios', String(filtros.realizaEnvios));
  }
  // if (filtros.terminoBusqueda) params.append('terminoBusqueda', filtros.terminoBusqueda);
  // 'activa' por defecto se busca true en el backend, no es necesario pasarlo a menos que queramos buscar inactivas.
  return params.toString();
};

// --- Helper para parsear query params a filtros iniciales ---
// Este se ejecutará en el cliente al inicio.
const parseQueryParamsToFiltros = (searchParams: URLSearchParams | null): PaginaAmarillaFiltros => {
  if (!searchParams) return {};
  const filtros: PaginaAmarillaFiltros = {};
  
  const provincia = searchParams.get('provincia');
  if (provincia) filtros.provincia = provincia;

  const localidad = searchParams.get('localidad');
  if (localidad) filtros.localidad = localidad;
  
  const rol = searchParams.get('rol') as RolPaginaAmarilla | null;
  if (rol && (rol === 'prestador' || rol === 'comercio')) filtros.rol = rol;

  const categoria = searchParams.get('categoria');
  if (categoria) filtros.categoria = categoria;
  
  const subCategoria = searchParams.get('subCategoria');
  if (subCategoria) filtros.subCategoria = subCategoria;

  const rubro = searchParams.get('rubro');
  if (rubro) filtros.rubro = rubro;

  const subRubro = searchParams.get('subRubro');
  if (subRubro) filtros.subRubro = subRubro;

  const realizaEnvios = searchParams.get('realizaEnvios');
  if (realizaEnvios === 'true') filtros.realizaEnvios = true;
  else if (realizaEnvios === 'false') filtros.realizaEnvios = false;

  // const terminoBusqueda = searchParams.get('terminoBusqueda');
  // if (terminoBusqueda) filtros.terminoBusqueda = terminoBusqueda;

  return filtros;
};


// --- Componente Funcional para la Lógica (para usar hooks de Next.js) ---
// Next.js recomienda usar <Suspense> para los searchParams,
// pero para un manejo más directo en un client component, podemos usarlos así.
// Si hubiera un data fetching server-side basado en params, Suspense sería clave.
const BusquedaPaginasAmarillasClientLogic: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname(); // Ruta actual, ej: /paginas-amarillas/buscar
  const searchParams = useSearchParams(); // Hook para leer query params

  // Estado para los filtros que se usarán para la búsqueda y se pasarán a PaginasAmarillasFiltros
  const [filtrosActivos, setFiltrosActivos] = useState<PaginaAmarillaFiltros>(() => parseQueryParamsToFiltros(searchParams));
  
  const [publicaciones, setPublicaciones] = useState<PaginaAmarillaData[]>([]);
  const [estadoCarga, setEstadoCarga] = useState<EstadoCarga>('idle');
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  // const [hasSearched, setHasSearched] = useState(false); // Para distinguir "sin resultados" de "no se ha buscado"

  // Función que se llamará desde PaginasAmarillasFiltros
  const handleBuscar = async (nuevosFiltros: PaginaAmarillaFiltros) => {
    setEstadoCarga('loading');
    setMensajeError(null);
    // setHasSearched(true);
    setFiltrosActivos(nuevosFiltros); // Actualiza los filtros que se muestran como activos

    const queryString = construirQueryString(nuevosFiltros);
    const nuevaUrl = queryString ? `${pathname}?${queryString}` : pathname;
    
    // Actualizar URL sin recargar la página, solo para reflejar los filtros
    // Esto se hace ANTES del fetch para que si el usuario recarga, los filtros persistan.
    router.push(nuevaUrl, { scroll: false }); // `scroll: false` evita el scroll al inicio

    try {
      const response = await fetch(`/api/paginas-amarillas?${queryString}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }
      const data: PaginaAmarillaData[] = await response.json();
      setPublicaciones(data);
      setEstadoCarga('success');
    } catch (error: unknown) {
      console.error("Error en la búsqueda:", error);
      const errMsg = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
      setMensajeError(errMsg);
      // toast.error(`Error en búsqueda: ${errMsg}`);
      setEstadoCarga('error');
      setPublicaciones([]); // Limpiar resultados en caso de error
    }
  };
  
  // Si quisieras cargar resultados basados en la URL al montar el componente
  // (simulando un "useEffect" para la carga inicial de datos desde URL sin usar el hook):
  // Esto es un poco más complejo de manejar sin useEffect para evitar múltiples llamadas.
  // Una forma es usar una ref para controlar si la carga inicial ya se hizo.
  // O, mejor aún, que `handleBuscar` se llame explícitamente si hay `initialFiltros` significativos.
  // Por ahora, la búsqueda se activa solo con el botón "Buscar".
  // Si se quiere cargar al inicio con filtros de URL:
  // const initialLoadDone = useRef(false);
  // if (!initialLoadDone.current && Object.keys(filtrosActivos).length > 0) {
  //   handleBuscar(filtrosActivos);
  //   initialLoadDone.current = true;
  // }


  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-8">
      <PaginasAmarillasFiltros 
        onBuscar={handleBuscar} 
        isLoading={estadoCarga === 'loading'}
        initialFiltros={filtrosActivos} // Pasamos los filtros actuales (que pueden venir de la URL)
      />
      <PaginasAmarillasResultados
        publicaciones={publicaciones}
        isLoading={estadoCarga === 'loading'}
        error={mensajeError}
        // hasSearched={hasSearched}
      />
    </div>
  );
};


// --- Componente de Página Principal (Wrapper para Suspense si se usa) ---
const BuscarPaginaAmarillaPage: React.FC = () => {
  // Suspense es necesario si `useSearchParams` se usa en un componente
  // que podría renderizarse en el servidor inicialmente o si hay transiciones.
  // En un Client Component raíz de página, suele funcionar bien directamente.
  return (
    <Suspense fallback={<div className="p-8 text-center">Cargando filtros...</div>}>
      <BusquedaPaginasAmarillasClientLogic />
    </Suspense>
  );
};

export default BuscarPaginaAmarillaPage;