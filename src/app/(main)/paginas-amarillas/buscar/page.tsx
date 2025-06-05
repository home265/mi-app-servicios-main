// src/app/(main)/paginas-amarillas/buscar/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import {
  useSearchParams,
  useRouter,
  usePathname,
} from 'next/navigation';

import {
  PaginaAmarillaData,
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import PaginasAmarillasFiltros from './components/PaginasAmarillasFiltros';
import PaginasAmarillasResultados from './components/PaginasAmarillasResultados';

type EstadoCarga = 'idle' | 'loading' | 'success' | 'error';

/* -------------------------------------------------------------------- */
/*  Helpers                                                             */
/* -------------------------------------------------------------------- */
const construirQueryString = (f: PaginaAmarillaFiltros): string => {
  const p = new URLSearchParams();
  if (f.provincia)     p.append('provincia',     f.provincia);
  if (f.localidad)     p.append('localidad',     f.localidad);
  if (f.rol)           p.append('rol',           f.rol);
  if (f.categoria)     p.append('categoria',     f.categoria);
  if (f.subCategoria)  p.append('subCategoria',  f.subCategoria);
  if (f.rubro)         p.append('rubro',         f.rubro);
  if (f.subRubro)      p.append('subRubro',      f.subRubro);
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
/*  Client-side logic                                                   */
/* -------------------------------------------------------------------- */
const BusquedaPaginasAmarillasClientLogic: React.FC = () => {
  const router       = useRouter();
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

  /* ----------------------- BUSCAR ----------------------- */
  const handleBuscar = async (nuevosFiltros: PaginaAmarillaFiltros) => {
    console.log('[handleBuscar] filtros recibidos', nuevosFiltros);
    setEstadoCarga('loading');
    setMensajeError(null);
    setHasSearched(true);
    setFiltrosActivos(nuevosFiltros);

    const qs = construirQueryString(nuevosFiltros);
    console.log('[handleBuscar] queryString generado', qs);

    router.push(
      qs ? `${pathname}?${qs}` : pathname,
      { scroll: false },      // ← evita un segundo render completo
    );

    try {
      const res = await fetch(`/api/paginas-amarillas?${qs}`);
      console.log('[handleBuscar] response status', res.status);

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || `Error ${res.status}`);
      }

      const data: PaginaAmarillaData[] = await res.json();
      console.log('[handleBuscar] publicaciones recibidas', data.length);
      setPublicaciones(data);
      setEstadoCarga('success');
    } catch (err: unknown) {
      console.error('[handleBuscar] fallo', err);
      setMensajeError(
        err instanceof Error ? err.message : 'Error desconocido',
      );
      setEstadoCarga('error');
      setPublicaciones([]);
    }
  };

  /* ----------------------- UI ----------------------- */
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 space-y-8">
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
    </div>
  );
};

/* -------------------------------------------------------------------- */
/*  Page wrapper                                                         */
/* -------------------------------------------------------------------- */
const BuscarPaginaAmarillaPage: React.FC = () => (
  <Suspense fallback={<div className="p-8 text-center">Cargando filtros…</div>}>
    <BusquedaPaginasAmarillasClientLogic />
  </Suspense>
);

export default BuscarPaginaAmarillaPage;
