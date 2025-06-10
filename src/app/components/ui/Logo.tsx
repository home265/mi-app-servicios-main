'use client';
import Image from 'next/image';

export default function Logo() {
  return (
    // Duplicamos los valores de ancho para que el logo se vea más grande.
    <div className="relative w-80 h-48 md:w-96 md:h-56">
      <Image
        src="/logo1.png"
        alt="Logo de CODYS"
        fill
        sizes="(max-width: 768px) 320px, 384px"
        className="object-contain"
        priority
      />
    </div>
  );
}