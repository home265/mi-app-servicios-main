// src/app/components/auth/SeleccionRolCard.tsx
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
        // Estilos base y de layout (mantenemos los tuyos y aseguramos consistencia)
        'flex items-center gap-4 p-4 rounded-xl',
        'bg-tarjeta text-texto-principal',
        'transition-all duration-150 ease-in-out',

        // ---- NUEVO: Efecto de Relieve 3D ----
        'shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]',

        // ---- NUEVO: Efectos de Hover y Active controlados por el Link padre ----
        'group-hover:brightness-110 group-hover:shadow-[6px_6px_12px_rgba(0,0,0,0.4),-6px_-6px_12px_rgba(255,255,255,0.05)]',
        'group-active:scale-[0.98] group-active:brightness-90 group-active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.4)]'
      )}
    >
      <Icon size={28} className="text-primario" />
      <span className="text-lg font-medium">{labelMap[rol]}</span>
    </div>
  );
}