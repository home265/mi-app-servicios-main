'use client';

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

export default function SeleccionRolCard({ rol }: SeleccionRolCardProps) {
  const Icon = iconMap[rol];

  return (
    <div
      className={clsx(
        'card bg-tarjeta text-texto-principal',
        'flex items-center gap-4 transition-all duration-150 p-4',
        'hover:shadow-lg hover:scale-[1.02]'
      )}
    >
      <Icon size={24} className="text-primario" />
      <span className="text-lg font-medium">{labelMap[rol]}</span>
    </div>
  );
}