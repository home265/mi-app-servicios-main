// src/app/(main)/paginas-amarillas/crear/page.tsx
import React from 'react';
import PaginaAmarillaCrearForm from './components/PaginaAmarillaCrearForm';

// --- Componente de Página (Server Component por defecto en App Router) ---
const CrearPaginaAmarillaPage = async () => {
  // --- Renderizado del Formulario ---
  return (
    <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8 bg-fondo">
      <PaginaAmarillaCrearForm />
    </div>
  );
};

export default CrearPaginaAmarillaPage;