// src/app/components/ui/Logo.tsx
'use client';
import Image from 'next/image';

export default function Logo() {
  return (
    // Contenedor responsivo para el logo.
    // El 'fill' de next/image hace que la imagen ocupe el 100% de este div.
    // Las clases 'w-full h-full' aquí aseguran que este div, a su vez,
    // ocupe todo el espacio disponible dentro de su propio contenedor padre.
    // Esto es lo que permite que el tamaño se controle desde la página que lo usa
    // (login/page.tsx, seleccionar-registro/page.tsx, registro/[rol]/page.tsx).
    <div className="relative w-full h-full">
      <Image
        src="/logo1.png" // Asegúrate de que esta imagen (logo1.png) exista en tu carpeta public.
        alt="Logo de CODYS" // Texto alternativo para accesibilidad.
        fill // La propiedad 'fill' hace que la imagen se expanda para llenar el contenedor 'div'.
        sizes="(max-width: 768px) 100vw, 100vw" // La imagen intentará ocupar el 100% del ancho de su contenedor.
        className="object-contain" // Asegura que la imagen se ajuste dentro del contenedor sin distorsión o recorte,
                                  // manteniendo sus proporciones.
        priority // Indica a Next.js que esta imagen es importante y debe precargarse para mejorar el rendimiento.
      />
    </div>
  );
}