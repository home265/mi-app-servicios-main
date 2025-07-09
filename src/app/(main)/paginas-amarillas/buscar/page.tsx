// src/app/(main)/paginas-amarillas/buscar/page.tsx

'use client';

import React, { useState, Suspense } from 'react';
import {
  useSearchParams,
  useRouter,
  usePathname,
} from 'next/navigation';
// --- 1. IMPORTAR EL ÍCONO (COMO EN TRABAJOS/PAGE.TSX) ---
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

import {
  PaginaAmarillaData,
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import PaginasAmarillasFiltros from './components/PaginasAmarillasFiltros';
import PaginasAmarillasResultados from './components/PaginasAmarillasResultados';


type EstadoCarga = 'idle' | 'loading' | 'success' | 'error';

/* -------------------------------------------------------------------- */
/* Helpers                                                              */
/* -------------------------------------------------------------------- */
const construirQueryString = (f: PaginaAmarillaFiltros): string => {
  const p = new URLSearchParams();
  if (f.provincia) p.append('provincia', f.provincia);
  if (f.localidad) p.append('localidad', f.localidad);
  if (f.rol) p.append('rol', f.rol);
  if (f.categoria) p.append('categoria', f.categoria);
  if (f.subCategoria) p.append('subCategoria', f.subCategoria);
  if (f.rubro) p.append('rubro', f.rubro);
  if (f.subRubro) p.append('subRubro', f.subRubro);
  if (typeof f.realizaEnvios === 'boolean') {
    p.append('realizaEnvios', String(f.realizaEnvios));
  }
  return p.toString();
};

const parseQueryParamsToFiltros = (
  sp: URLSearchParams | null,
): PaginaAmarillaFiltros => {
  if (!sp) return {};
  const f: PaginaAmarillaFiltros = {};

  const provincia = sp.get('provincia');
  if (provincia) f.provincia = provincia;

  const localidad = sp.get('localidad');
  if (localidad) f.localidad = localidad;

  const rol = sp.get('rol') as RolPaginaAmarilla | null;
  if (rol && (rol === 'prestador' || rol === 'comercio')) f.rol = rol;

  const categoria = sp.get('categoria');
  if (categoria) f.categoria = categoria;

  const subCategoria = sp.get('subCategoria');
  if (subCategoria) f.subCategoria = subCategoria;

  const rubro = sp.get('rubro');
  if (rubro) f.rubro = rubro;

  const subRubro = sp.get('subRubro');
  if (subRubro) f.subRubro = subRubro;

  const realizaEnvios = sp.get('realizaEnvios');
  if (realizaEnvios === 'true') f.realizaEnvios = true;
  else if (realizaEnvios === 'false') f.realizaEnvios = false;

  return f;
};

/* -------------------------------------------------------------------- */
/* Client-side logic                                                    */
/* -------------------------------------------------------------------- */
const BusquedaPaginasAmarillasClientLogic: React.FC = () => {
  const router       = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  /* filtros que llegan por URL al cargar la página */
  const [filtrosActivos, setFiltrosActivos] = useState<PaginaAmarillaFiltros>(
    () => parseQueryParamsToFiltros(searchParams),
  );

  const [publicaciones, setPublicaciones] = useState<PaginaAmarillaData[]>([]);
  const [estadoCarga,   setEstadoCarga]   = useState<EstadoCarga>('idle');
  const [mensajeError,  setMensajeError]  = useState<string | null>(null);
  const [hasSearched,   setHasSearched]   = useState(false);

  /* ref que impide duplicar petición simultánea */
  const peticionEnCurso = React.useRef<boolean>(false);

  /* ----------------------- BUSCAR ----------------------- */
  const handleBuscar = async (nuevosFiltros: PaginaAmarillaFiltros) => {
    if (peticionEnCurso.current) return;
    peticionEnCurso.current = true;

    setEstadoCarga('loading');
    setMensajeError(null);
    setHasSearched(true);
    setFiltrosActivos(nuevosFiltros);

    const qs = construirQueryString(nuevosFiltros);

    try {
      const res = await fetch(`/api/paginas-amarillas?${qs}`);
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || `Error del servidor: ${res.status}`);
      }

      const data: PaginaAmarillaData[] = await res.json();
      setPublicaciones(data);
      setEstadoCarga('success');
    } catch (err: unknown) {
      setMensajeError(
        err instanceof Error ? err.message : 'Error desconocido',
      );
      setEstadoCarga('error');
      setPublicaciones([]);
    } finally {
      peticionEnCurso.current = false;
    }
  };

  /* ----------------------- UI ----------------------- */
  return (
  <div className="container mx-auto px-2 sm:px-4 py-8 sm:py-12 space-y-6 relative">
    {/* Título movido fuera y centrado */}
    <h2 className="text-2xl font-semibold text-texto-principal text-center">
      Buscar en Páginas Amarillas
    </h2>

    <PaginasAmarillasFiltros
      onBuscar={handleBuscar}
      isLoading={estadoCarga === 'loading'}
      initialFiltros={filtrosActivos}
    />
    <PaginasAmarillasResultados
      publicaciones={publicaciones}
      isLoading={estadoCarga === 'loading'}
      error={mensajeError}
      hasSearched={hasSearched}
    />

    {/* --- BOTÓN FLOTANTE (IDÉNTICO AL DE TRABAJOS/PAGE.TSX) --- */}
    <button
      onClick={() => router.push('/bienvenida')}
      aria-label="Volver a inicio"
      className="fixed bottom-6 right-4 z-40 h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition active:scale-95 focus:outline-none focus:ring"
      style={{ backgroundColor: '#184840' }} // Verde oscuro específico
    >
      <ChevronLeftIcon className="h-6 w-6" style={{ color: '#EFC71D' }} /> {/* Amarillo específico */}
    </button>
  </div>
);
};

/* -------------------------------------------------------------------- */
/* Page wrapper                                                         */
/* -------------------------------------------------------------------- */
const BuscarPaginaAmarillaPage: React.FC = () => (
  <Suspense fallback={<div className="p-8 text-center">Cargando filtros…</div>}>
    <BusquedaPaginasAmarillasClientLogic />
  </Suspense>
);

export default BuscarPaginaAmarillaPage;