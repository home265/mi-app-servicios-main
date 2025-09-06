// src/app/(main)/bienvenida/components/BotonInsumos.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useUserStore } from '@/store/userStore';
import mappingsData from '@/data/insumos-mapping.json';
import BotonDeAccion from '@/components/bienvenida/BotonDeAccion';


// Definimos un tipo para el mapeo para mayor seguridad
type Mapping = {
  categoria: string;
  rubros_insumos: string[];
};

const mappings: Mapping[] = mappingsData.mappings;

export default function BotonInsumos() {
  const router = useRouter();
  const currentUser = useUserStore((s) => s.currentUser);

  // El botón solo se muestra si el usuario es un prestador
  if (!currentUser || currentUser.rol !== 'prestador') {
    return null;
  }

  const categoriaUsuario = currentUser.categoria?.categoria;
  if (!categoriaUsuario) {
    return null; // No tiene categoría, no se muestra
  }

  // Buscamos si la categoría del usuario tiene un mapeo de insumos definido
  const mappingCorrespondiente = mappings.find(
    (m) => m.categoria === categoriaUsuario
  );

  // Si no hay mapeo para su categoría, el botón no se renderiza
  if (!mappingCorrespondiente) {
    return null;
  }

  const handleClick = () => {
    const provincia = currentUser.localidad?.provinciaNombre;
    const localidad = currentUser.localidad?.nombre;
    
    if (!provincia || !localidad) {
      // Manejar el caso en que la ubicación no esté definida
      alert("Tu ubicación no está configurada, no se puede buscar insumos.");
      return;
    }

    // Convertimos la lista de rubros en una cadena separada por comas para la URL
    const rubrosQuery = mappingCorrespondiente.rubros_insumos.join(',');

    // Construimos la URL y navegamos a la nueva página
    const url = `/insumos?provincia=${encodeURIComponent(provincia)}&localidad=${encodeURIComponent(localidad)}&rubros=${encodeURIComponent(rubrosQuery)}`;
    
    router.push(url);
  };

  return (
    <BotonDeAccion
      label="Buscar Insumos"
      Icon={ShoppingCartIcon}
      onClick={handleClick}
    />
  );
}