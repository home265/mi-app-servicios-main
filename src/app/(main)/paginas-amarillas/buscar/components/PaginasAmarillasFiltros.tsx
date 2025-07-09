// src/app/(main)/paginas-amarillas/buscar/components/PaginasAmarillasFiltros.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import SelectorLocalidad, { LocalidadSeleccionada } from '@/app/components/forms/SelectorLocalidad';
import SelectorCategoria, { CategoriaSeleccionada } from '@/app/components/forms/SelectorCategoria';
import SelectorRubro, { RubroSeleccionado } from '@/app/components/forms/SelectorRubro';
import Button   from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';

interface Props {
  onBuscar: (f: PaginaAmarillaFiltros) => void;
  isLoading?: boolean;
  initialFiltros?: PaginaAmarillaFiltros;
}

const PaginasAmarillasFiltros: React.FC<Props> = ({
  onBuscar,
  isLoading = false,
  initialFiltros = {},
}) => {
  /* ------------- estado inicial (memorizado) ------------- */
  const initialLocalidad = useMemo<LocalidadSeleccionada | null>(() => {
    return initialFiltros.provincia && initialFiltros.localidad
      ? {
          id: '',
          nombre: initialFiltros.localidad,
          provinciaNombre: initialFiltros.provincia,
        }
      : null;
  }, [initialFiltros.localidad, initialFiltros.provincia]);

  const initialCat = useMemo<CategoriaSeleccionada | null>(() => {
    return initialFiltros.categoria
      ? {
          categoria: initialFiltros.categoria,
          subcategoria: initialFiltros.subCategoria || null,
        }
      : null;
  }, [initialFiltros.categoria, initialFiltros.subCategoria]);

  const initialRub = useMemo<RubroSeleccionado | null>(() => {
    return initialFiltros.rubro
      ? {
          rubro: initialFiltros.rubro,
          subrubro: initialFiltros.subRubro || null,
        }
      : null;
  }, [initialFiltros.rubro, initialFiltros.subRubro]);

  /* ---------------- estado controlado ---------------- */
  const [localidadSel, setLocalidadSel] = useState<LocalidadSeleccionada | null>(initialLocalidad);
  const [rolSel,       setRolSel]       = useState<RolPaginaAmarilla | ''>(initialFiltros.rol || '');
  const [catSel,       setCatSel]       = useState<CategoriaSeleccionada | null>(null);
  const [rubSel,       setRubSel]       = useState<RubroSeleccionado | null>(null);
  const [realizaEnvios, setRealizaEnvios] = useState<boolean | undefined>(
    initialFiltros.realizaEnvios,
  );
  const [localidadKey, setLocalidadKey] = useState(Date.now());


  /* ---------------- handlers ---------------- */
  const handleRolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoRol = e.target.value as RolPaginaAmarilla | '';
    setRolSel(nuevoRol);
    setCatSel(null);
    setRubSel(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtros: PaginaAmarillaFiltros = {
      provincia   : localidadSel?.provinciaNombre,
      localidad   : localidadSel?.nombre,
      rol         : rolSel || undefined,
      categoria   : rolSel === 'prestador' ? catSel?.categoria : undefined,
      subCategoria: rolSel === 'prestador' ? catSel?.subcategoria || undefined : undefined,
      rubro       : rolSel === 'comercio'  ? rubSel?.rubro : undefined,
      subRubro    : rolSel === 'comercio'  ? rubSel?.subrubro || undefined : undefined,
      realizaEnvios,
    };
    console.log('[Filtros] submit →', filtros);
    onBuscar(filtros);

    // --- LÓGICA DE LIMPIEZA CORREGIDA ---
    // Limpia la localidad y el tipo de publicación.
    setLocalidadSel(null);
    setRolSel(''); // <--- CAMBIO AÑADIDO
    setLocalidadKey(Date.now());
  };

  /* ---------------- UI ---------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6 bg-card border border-borde-tarjeta rounded-lg shadow-md space-y-6"
    >
      

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SelectorLocalidad
          key={localidadKey}
          id="busqLoc"
          label="Selecciona una Localidad*"
          onLocalidadSeleccionada={setLocalidadSel}
        />

        <div>
          <label
            htmlFor="rolBusq"
            className="block text-sm font-medium text-texto-secundario mb-1"
          >
            Tipo de Publicación*
          </label>
          <select
            id="rolBusq"
            value={rolSel}
            onChange={handleRolChange}
            className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md
                       shadow-sm focus:outline-none focus:ring-primario focus:border-primario sm:text-sm
                       text-texto dark:text-texto-dark"
          >
            <option value="">Todos (Prestadores y Comercios)</option>
            <option value="prestador">Prestadores / Profesionales</option>
            <option value="comercio">Comercios</option>
          </select>
        </div>
      </div>

      {rolSel === 'prestador' && (
        <SelectorCategoria
          idCategoria="busqCat"
          idSubcategoria="busqSubCat"
          initialValue={initialCat}
          onCategoriaChange={setCatSel}
        />
      )}

      {rolSel === 'comercio' && (
        <SelectorRubro
          idRubro="busqRub"
          idSubrubro="busqSubRub"
          initialValue={initialRub}
          onRubroChange={setRubSel}
        />
      )}

      <div className="pt-4">
        <Checkbox
          id="fEnvios"
          label="Mostrar solo los que realizan envíos"
          checked={realizaEnvios === true}
          onCheckedChange={(c) => setRealizaEnvios(c ? true : undefined)}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
          className="flex-grow w-full border-2 border-white"
        >
          {isLoading ? 'Buscando…' : 'Buscar'}
        </Button>
      </div>
    </form>
  );
};

export default PaginasAmarillasFiltros;