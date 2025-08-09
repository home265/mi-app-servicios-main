'use client';

import React, { useState, Suspense } from 'react';
import {
  useSearchParams,
  useRouter,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  usePathname,
} from 'next/navigation';

// --- INICIO: CAMBIOS DE TIPO ---
import {
  SerializablePaginaAmarillaData, // Se importa el tipo serializado
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
// --- FIN: CAMBIOS DE TIPO ---

import PaginasAmarillasFiltros from './components/PaginasAmarillasFiltros';
import PaginasAmarillasResultados from './components/PaginasAmarillasResultados';
import AyudaPaginasAmarillas from '@/app/components/ayuda-contenido/AyudaPaginasAmarillas';
import BotonVolver from '@/app/components/common/BotonVolver';
import useHelpContent from '@/lib/hooks/useHelpContent';

type EstadoCarga = 'idle' | 'loading' | 'success' | 'error';

/* -------------------------------------------------------------------- */
/* Helpers (sin cambios)                                                */
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
/* Lógica del Componente Cliente                                        */
/* -------------------------------------------------------------------- */
const BusquedaPaginasAmarillasClientLogic: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const router       = useRouter();
  const searchParams = useSearchParams();
  useHelpContent(<AyudaPaginasAmarillas />);
  const [filtrosActivos, setFiltrosActivos] = useState<PaginaAmarillaFiltros>(
    () => parseQueryParamsToFiltros(searchParams),
  );

  // --- CAMBIO: El estado ahora usa el tipo de dato serializado ---
  const [publicaciones, setPublicaciones] = useState<SerializablePaginaAmarillaData[]>([]);
  const [estadoCarga,   setEstadoCarga]   = useState<EstadoCarga>('idle');
  const [mensajeError,  setMensajeError]  = useState<string | null>(null);
  const [hasSearched,   setHasSearched]   = useState(false);

  const peticionEnCurso = React.useRef<boolean>(false);

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

      // --- CAMBIO: La respuesta JSON se interpreta como el tipo serializado ---
      const data: SerializablePaginaAmarillaData[] = await res.json();
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

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-5 py-8 sm:py-12 space-y-8 flex-grow">
        
        <div className="flex items-center justify-center gap-4">
          <h2 className="text-2xl font-semibold text-texto-principal">
            Buscar en Guía Local
          </h2>
        </div>

        <div className="max-w-md mx-auto bg-tarjeta rounded-2xl p-6 sm:p-8 
                       shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]">
          <PaginasAmarillasFiltros
            onBuscar={handleBuscar}
            isLoading={estadoCarga === 'loading'}
            initialFiltros={filtrosActivos}
          />
        </div>

        <PaginasAmarillasResultados
          publicaciones={publicaciones}
          isLoading={estadoCarga === 'loading'}
          error={mensajeError}
          hasSearched={hasSearched}
        />
      </div>

      <BotonVolver />
    </>
  );
};

/* -------------------------------------------------------------------- */
/* Componente de Página Principal                                       */
/* -------------------------------------------------------------------- */
const BuscarPaginaAmarillaPage: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-fondo">
    <Suspense fallback={<div className="p-8 text-center text-texto-secundario animate-pulse">Cargando filtros…</div>}>
      <BusquedaPaginasAmarillasClientLogic />
    </Suspense>
  </div>
);

export default BuscarPaginaAmarillaPage;