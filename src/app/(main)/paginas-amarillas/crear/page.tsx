// src/app/(main)/paginas-amarillas/crear/page.tsx
import React from 'react';
import PaginaAmarillaCrearForm from './components/PaginaAmarillaCrearForm'; // El formulario que creamos
// import { checkUserEligibilityForPaginaAmarilla } from '@/lib/actions/paginasAmarillasActions'; // Ejemplo si tuviéramos Server Actions
// import { redirect } from 'next/navigation';
// import { getCurrentUserServer } from '@/lib/firebase/serverApp'; // Ejemplo para obtener usuario en RSC

// --- Metadatos de la Página (Opcional pero recomendado) ---
// import type { Metadata } from 'next';
// export const metadata: Metadata = {
//   title: 'Crear Publicación en Páginas Amarillas | Mi App Servicios',
//   description: 'Crea tu tarjeta de presentación digital en nuestras Páginas Amarillas.',
// };


// --- Componente de Página (Server Component por defecto en App Router) ---
const CrearPaginaAmarillaPage = async () => { // Puede ser async si necesitas data fetching aquí
  // --- Verificación de Elegibilidad (Ejemplo con Server-Side Logic) ---
  // Idealmente, si un usuario no es elegible (ej. no tiene anuncios activos),
  // no debería ni ver el formulario. Esta lógica podría ir aquí si es server-rendered
  // o dentro de PaginaAmarillaCrearForm si es un client component y maneja su propia data fetching/redirect.

  // Ejemplo (requeriría implementar estas funciones y posiblemente Firebase Admin en el servidor):
  // const user = await getCurrentUserServer(); // Función para obtener el usuario autenticado en el servidor
  // if (!user) {
  //   redirect('/login?callbackUrl=/paginas-amarillas/crear'); // Redirigir si no está logueado
  // }

  // const esElegible = await checkUserEligibilityForPaginaAmarilla(user.uid);
  // if (!esElegible) {
  //   return (
  //     <div className="container mx-auto px-4 py-8 text-center">
  //       <h1 className="text-2xl font-bold text-red-600 mb-4">No eres elegible</h1>
  //       <p className="text-texto-secundario">
  //         Para crear una publicación en Páginas Amarillas, necesitas tener al menos un anuncio activo.
  //         Crea un anuncio y vuelve a intentarlo.
  //       </p>
  //       {/* Podrías añadir un botón para ir a crear anuncios */}
  //     </div>
  //   );
  // }

  // --- Renderizado del Formulario ---
  // PaginaAmarillaCrearForm es un Client Component que manejará su propio estado y lógica de cliente.
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
      {/* Podrías tener un título o un componente de encabezado de página aquí si es necesario */}
      {/* <h1 className="text-3xl font-bold text-texto-principal mb-6">
        Tu Espacio en Nuestras Páginas Amarillas
      </h1> */}
      <PaginaAmarillaCrearForm />
    </div>
  );
};

export default CrearPaginaAmarillaPage;