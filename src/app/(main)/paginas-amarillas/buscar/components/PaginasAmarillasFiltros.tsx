'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  PaginaAmarillaFiltros,
  RolPaginaAmarilla,
} from '@/types/paginaAmarilla';
import SelectorLocalidad, {
  LocalidadSeleccionada,
} from '@/app/components/forms/SelectorLocalidad';
import SelectorCategoria, {
  CategoriaSeleccionada,
} from '@/app/components/forms/SelectorCategoria';
import SelectorRubro, {
  RubroSeleccionado,
} from '@/app/components/forms/SelectorRubro';
import Button from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';
import categoriasData from '@/data/categorias.json';
import rubrosData from '@/data/rubro.json';


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
  /* ------------- estado inicial (memorizado y corregido) ------------- */
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
    if (!initialFiltros.categoria) return null;
    const categoriaEncontrada = categoriasData.categorias.find(
      (c) => c.nombre === initialFiltros.categoria
    );
    return categoriaEncontrada
      ? {
          categoria: initialFiltros.categoria,
          subcategoria: initialFiltros.subCategoria || null,
          requiereMatricula: categoriaEncontrada.requiereMatricula,
        }
      : null;
  }, [initialFiltros.categoria, initialFiltros.subCategoria]);

  const initialRub = useMemo<RubroSeleccionado | null>(() => {
    if (!initialFiltros.rubro) return null;
    const rubroEncontrado = rubrosData.rubros.find(
      (r) => r.nombre === initialFiltros.rubro
    );
    if (!rubroEncontrado) return null;

    const subrubroEncontrado = initialFiltros.subRubro
      ? rubroEncontrado.subrubros.find(
          (s) => s.nombre === initialFiltros.subRubro
        ) || null
      : null;
      
    return {
      rubro: initialFiltros.rubro,
      subrubro: subrubroEncontrado,
    };
  }, [initialFiltros.rubro, initialFiltros.subRubro]);


  /* ---------------- estado controlado ---------------- */
  const [localidadSel, setLocalidadSel] = useState<LocalidadSeleccionada | null>(
    initialLocalidad
  );
  const [rolSel, setRolSel] = useState<RolPaginaAmarilla | ''>(
    initialFiltros.rol || ''
  );
  const [catSel, setCatSel] = useState<CategoriaSeleccionada | null>(initialCat);
  const [rubSel, setRubSel] = useState<RubroSeleccionado | null>(initialRub);
  const [realizaEnvios, setRealizaEnvios] = useState<boolean | undefined>(
    initialFiltros.realizaEnvios
  );
  const [localidadKey, setLocalidadKey] = useState(Date.now());

  const [isRolOpen, setIsRolOpen] = useState(false);
  const rolDropdownRef = useRef<HTMLDivElement>(null);

  /* ---------------- handlers ---------------- */
  const handleRolChange = (nuevoRol: RolPaginaAmarilla | '') => {
    setRolSel(nuevoRol);
    setCatSel(null);
    setRubSel(null);
    setIsRolOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtros: PaginaAmarillaFiltros = {
      provincia: localidadSel?.provinciaNombre,
      localidad: localidadSel?.nombre,
      rol: rolSel || undefined,
      categoria: rolSel === 'prestador' ? catSel?.categoria : undefined,
      subCategoria:
        rolSel === 'prestador' ? catSel?.subcategoria || undefined : undefined,
      rubro: rolSel === 'comercio' ? rubSel?.rubro : undefined,
      subRubro: rolSel === 'comercio' ? rubSel?.subrubro?.nombre || undefined : undefined,
      realizaEnvios,
    };
    console.log('[Filtros] submit →', filtros);
    onBuscar(filtros);

    setLocalidadSel(null);
    setRolSel('');
    setLocalidadKey(Date.now());
  };

  const rolOptions = [
    { value: '', label: 'Todos (Prestadores y Comercios)' },
    { value: 'prestador', label: 'Prestadores / Profesionales' },
    { value: 'comercio', label: 'Comercios' },
  ];
  const selectedRolLabel =
    rolOptions.find((opt) => opt.value === rolSel)?.label ||
    'Todos (Prestadores y Comercios)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        rolDropdownRef.current &&
        !rolDropdownRef.current.contains(event.target as Node)
      ) {
        setIsRolOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* ---------------- UI ---------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 md:p-6"
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
          <div className="relative" ref={rolDropdownRef}>
            <button
              type="button"
              id="rolBusq"
              onClick={() => setIsRolOpen(!isRolOpen)}
              className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md
                         shadow-sm focus:outline-none focus:ring-primario focus:border-primario
                         text-base text-left text-texto dark:text-texto-dark justify-between items-center"
            >
              <span>{selectedRolLabel}</span>
              <svg
                className={`w-5 h-5 text-texto-secundario transition-transform ${
                  isRolOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isRolOpen && (
              <ul
                className="absolute z-20 w-full mt-1 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-gray-600 
                           rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                {rolOptions.map((option) => (
                  <li
                    key={option.value}
                    onClick={() =>
                      handleRolChange(option.value as RolPaginaAmarilla | '')
                    }
                    className="px-3 py-2 text-base text-texto dark:text-texto-dark cursor-pointer hover:bg-primario/20"
                  >
                    {option.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {rolSel === 'prestador' && (
        <SelectorCategoria
          idCategoria="busqCat"
          idSubcategoria="busqSubCat"
          initialValue={initialCat ? { categoria: initialCat.categoria, subcategoria: initialCat.subcategoria } : undefined}
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

      <div className="flex flex-col sm:flex-row gap-3 mt-10 pt-4">
        <Button
    type="submit"
    variant="primary"
    isLoading={isLoading}
    disabled={isLoading}
    className="flex-grow w-full !bg-[var(--color-primario)] !text-[var(--color-fondo)] !focus:shadow-none hover:!brightness-90"
>
    {isLoading ? 'Buscando…' : 'Buscar'}
</Button>
      </div>
    </form>
  );
};

export default PaginasAmarillasFiltros;