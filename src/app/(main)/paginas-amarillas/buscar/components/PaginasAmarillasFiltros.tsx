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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Button from '@/app/components/ui/Button';
import Checkbox from '@/app/components/ui/Checkbox';
import categoriasData from '@/data/categorias.json';
import rubrosData from '@/data/rubro.json';
import BotonDeSeleccion from '@/app/components/common/BotonDeSeleccion';


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
  // Lógica de estado y handlers (sin cambios)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [localidadKey, setLocalidadKey] = useState(Date.now());
  const [isRolOpen, setIsRolOpen] = useState(false);
  const rolDropdownRef = useRef<HTMLDivElement>(null);

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
  };

  const rolOptions = [
    { value: '', label: 'Todos (Profesionales,Prestadores y Comercios)' },
    { value: 'prestador', label: 'Prestadores / Profesionales' },
    { value: 'comercio', label: 'Comercios' },
  ];
  const selectedRolLabel =
    rolOptions.find((opt) => opt.value === rolSel)?.label ||
    'Todos (Profesionales,Prestadores y Comercios)';

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
          strict={false}
        />

        <div>
          <label
            htmlFor="rolBusq"
            className="block text-sm font-medium text-texto-secundario mb-2"
          >
            Tipo de Publicación*
          </label>
          <div className="relative" ref={rolDropdownRef}>
            {/* --- BOTÓN DESPLEGABLE CON ESTILO 3D --- */}
            <button
              type="button"
              id="rolBusq"
              onClick={() => setIsRolOpen(!isRolOpen)}
              className="flex w-full items-center justify-between rounded-xl bg-tarjeta px-4 py-3 text-left text-base text-texto-principal
           shadow-[2px_2px_5px_rgba(0,0,0,0.4),-2px_-2px_5px_rgba(249,243,217,0.08)]
           transition-all duration-150 ease-in-out
           hover:brightness-110 active:scale-95 active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]"
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
              // --- OPCIONES DEL MENÚ AHORA SON BOTONES 3D ---
              <div
                className="absolute z-20 mt-2 w-full max-h-60 overflow-y-auto rounded-2xl border border-borde-tarjeta bg-tarjeta shadow-xl p-2 space-y-2"
              >
                {rolOptions.map((option) => (
                  <BotonDeSeleccion
                    key={option.value}
                    label={option.label}
                    onClick={() =>
                      handleRolChange(option.value as RolPaginaAmarilla | '')
                    }
                    isSelected={option.value === rolSel}
                  />
                ))}
              </div>
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

      {/* --- BOTÓN DE BÚSQUEDA CENTRADO Y CON ESTILO GLOBAL --- */}
      <div className="flex justify-center mt-10 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary"
        >
          {isLoading ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
    </form>
  );
};

export default PaginasAmarillasFiltros;
