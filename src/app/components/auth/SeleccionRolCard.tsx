'use client';

import Link from 'next/link';
import { User, Briefcase, Store } from 'lucide-react';
import clsx from 'clsx';

export type Rol = 'usuario' | 'prestador' | 'comercio';


export interface SeleccionRolCardProps {
  rol: Rol;
}

const iconMap = {
  usuario: User,
  prestador: Briefcase,
  comercio: Store,
} as const;

const labelMap = {
  usuario: 'Usuario',
  prestador: 'Prestador',
  comercio: 'Comercio',
} as const;

const pathMap = {
  usuario: '/registro/usuario',
  prestador: '/registro/prestador',
  comercio: '/registro/comercio',
} as const;

export default function SeleccionRolCard({ rol }: SeleccionRolCardProps) {
  const Icon = iconMap[rol];

  return (
    <Link
  href={pathMap[rol]}
  className={clsx(
    'card !bg-primario !text-white dark:bg-tarjeta dark:text-texto', // ← ¡ojo al !  (important)
    'flex items-center gap-4 transition-all duration-150',
    'hover:shadow-lg hover:scale-[1.02]',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primario/30'
  )}
>
  <Icon size={24} className="!text-white dark:text-primario" />
  <span className="text-lg font-medium">{labelMap[rol]}</span>
</Link>
  );
}