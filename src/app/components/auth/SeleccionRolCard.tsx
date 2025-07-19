'use client';

// Se elimina la importación de 'Link' porque este componente ya no es un enlace.
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

// Se elimina 'pathMap' ya que la navegación la maneja el componente padre.

export default function SeleccionRolCard({ rol }: SeleccionRolCardProps) {
  const Icon = iconMap[rol];

  // Se reemplaza el componente <Link> por un <div>.
  // Se mantienen todas las clases para que el estilo visual sea idéntico.
  // Se eliminan las props que son exclusivas de un enlace, como 'href' y los estilos de focus.
  return (
    <div
      className={clsx(
        'card !bg-primario !text-white dark:bg-tarjeta dark:text-texto',
        'flex items-center gap-4 transition-all duration-150 p-4', // Se añade padding para mantener la apariencia
        'hover:shadow-lg hover:scale-[1.02]' // Se mantienen los efectos visuales
      )}
    >
      <Icon size={24} className="!text-white dark:text-primario" />
      <span className="text-lg font-medium">{labelMap[rol]}</span>
    </div>
  );
}