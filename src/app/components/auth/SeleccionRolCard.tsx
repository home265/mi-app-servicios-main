// src/app/components/auth/SeleccionRolCard.tsx
'use client';

import Link from 'next/link';

interface SeleccionRolCardProps {
  titulo: string;
  descripcion?: string;
  href: string;
}

export default function SeleccionRolCard({ titulo, descripcion, href }: SeleccionRolCardProps) {
  return (
    <Link
      href={href}
      className="
        block w-full max-w-sm p-6 
        bg-tarjeta 
        rounded-xl 
        shadow-lg 
        border-2 border-borde-tarjeta  // Borde violeta aplicado
        transition-all duration-300 ease-in-out 
        transform 
        hover:shadow-xl hover:-translate-y-1 hover:border-opacity-75 // Sutil cambio de opacidad del borde al hacer hover
        focus:outline-none focus:ring-2 focus:ring-primario focus:ring-opacity-50 
      "
    >
      <div className="text-center">
        <h2 className="text-xl font-bold text-primario mb-2">{titulo}</h2>
        {descripcion && (
          <p className="text-sm text-texto-secundario">{descripcion}</p>
        )}
      </div>
    </Link>
  );
}