// src/app/(main)/bienvenida/components/ContenedorCalculadoras.tsx
'use client';

import React, { JSX } from 'react';
import { useUserStore } from '@/store/userStore';
import BotonCalculadora from './BotonCalculadora';

// Definimos los datos de las calculadoras para tener un único lugar de gestión
const calculadoras = {
  gasista: { label: 'Calculadora Gasista', href: 'https://bob-gasista.vercel.app/proyecto' },
  electricista: { label: 'Calculadora Electricista', href: 'https://bob-electricista.vercel.app/proyecto' },
  sanitarias: { label: 'Calculadora Obras Sanitarias', href: 'https://bob-obras-sanitarias.vercel.app/proyecto' },
  seco: { label: 'Calculadora Construcción en Seco', href: 'https://construccion-en-seco.vercel.app/proyecto' },
  constructor: { label: 'Calculadora Constructor', href: 'https://bob-constructor.vercel.app/proyecto' },
  techista: { label: 'Calculadora Techista', href: 'https://bobtechista.vercel.app/proyecto' },
};

// --- Tipos para asegurar que los datos del usuario son correctos ---
type CategoriaUsuario = { categoria?: string | null };
type RubroUsuario = { rubro?: string | null, subrubro?: { nombre: string } | null };
type UserProfileConEspecialidad = {
  rol: 'prestador' | 'comercio' | 'usuario';
  categoria?: CategoriaUsuario | null;
  rubro?: RubroUsuario | null;
};

// --- Componente principal con la lógica de renderizado ---
export default function ContenedorCalculadoras() {
  const currentUser = useUserStore((s) => s.currentUser) as UserProfileConEspecialidad | null;

  if (!currentUser || (currentUser.rol !== 'prestador' && currentUser.rol !== 'comercio')) {
    return null; // No se muestra nada si no es un rol con calculadoras
  }

  const botonesParaRenderizar: JSX.Element[] = [];

  // Lógica para PRESTADORES
  if (currentUser.rol === 'prestador') {
    const categoria = currentUser.categoria?.categoria;
    switch (categoria) {
      case 'Albañil':
        botonesParaRenderizar.push(<BotonCalculadora key="constructor" {...calculadoras.constructor} />);
        botonesParaRenderizar.push(<BotonCalculadora key="seco" {...calculadoras.seco} />);
        break;
      case 'Electricista':
        botonesParaRenderizar.push(<BotonCalculadora key="electricista" {...calculadoras.electricista} />);
        break;
      case 'Gasista':
        botonesParaRenderizar.push(<BotonCalculadora key="gasista" {...calculadoras.gasista} />);
        break;
      case 'Plomero':
        botonesParaRenderizar.push(<BotonCalculadora key="sanitarias" {...calculadoras.sanitarias} />);
        break;
      case 'Carpintero':
      case 'Herrero': // Añadimos Herrero aquí
        botonesParaRenderizar.push(<BotonCalculadora key="techista" {...calculadoras.techista} />);
        break;
    }
  }

  // Lógica para COMERCIOS (Profesionales)
  if (currentUser.rol === 'comercio' && currentUser.rubro?.rubro === 'Servicios Profesionales') {
    const subrubro = currentUser.rubro?.subrubro?.nombre;
    const profesionesConTodo = ['Arquitecto', 'Maestro Mayor de Obra', 'Ingeniero Civil', 'Ingeniero Industrial'];

    if (profesionesConTodo.includes(subrubro || '')) {
      // Usamos Object.values para crear un botón por cada calculadora definida
      Object.entries(calculadoras).forEach(([key, value]) => {
        botonesParaRenderizar.push(<BotonCalculadora key={key} {...value} />);
      });
    } else if (subrubro === 'Ingeniero Eléctrico') {
      botonesParaRenderizar.push(<BotonCalculadora key="electricista" {...calculadoras.electricista} />);
    }
  }

  if (botonesParaRenderizar.length === 0) {
    return null; // No renderizar nada si no hay botones que mostrar
  }

  // Devolvemos los botones dentro de un Fragment para que se integren en el grid
  return <>{botonesParaRenderizar}</>;
}