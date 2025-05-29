'use client';
import Image from 'next/image';

export default function Logo() {
  return (
    <div className="relative w-40 h-24 md:w-48 md:h-28">
      <Image
        src="/logo.png"
        alt="Logo Mi App Servicios"
        fill
        sizes="(max-width: 768px) 160px, 192px"
        className="object-contain"
      />
    </div>
  );
}
