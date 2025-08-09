'use client';

import React from 'react';
// --- INICIO: CAMBIOS DE TIPO E IMPORTS ---
import { SerializablePaginaAmarillaData } from '@/types/paginaAmarilla';
import PaginaAmarillaDisplayCard from '@/app/components/paginas-amarillas/PaginaAmarillaDisplayCard';

// 1. Importar Swiper y sus componentes/módulos
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Navigation } from 'swiper/modules';

// 2. Importar los estilos de Swiper
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
// --- FIN: CAMBIOS DE TIPO E IMPORTS ---


interface Props {
  // --- CAMBIO: Se usa el tipo de dato correcto que viene de la API ---
  publicaciones: SerializablePaginaAmarillaData[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
}

const PaginasAmarillasResultados: React.FC<Props> = ({
  publicaciones,
  isLoading,
  error,
  hasSearched,
}) => {
  // Los estados de carga, error y "sin resultados" se mantienen igual
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-tarjeta border border-borde-tarjeta rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-20 bg-borde-tarjeta rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-borde-tarjeta rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-borde-tarjeta rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-borde-tarjeta rounded w-full mb-2"></div>
            <div className="h-8 bg-borde-tarjeta rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 text-center p-6 bg-error/10 border border-error/30 rounded-md">
        <h3 className="text-lg font-semibold text-error">
          Error al realizar la búsqueda
        </h3>
        <p className="text-error/90 mt-1">{error}</p>
      </div>
    );
  }

  if (hasSearched && publicaciones.length === 0) {
    return (
      <div className="mt-8 text-center p-6 bg-tarjeta border border-borde-tarjeta rounded-md">
        <h3 className="text-lg font-semibold text-texto-principal">
          No se encontraron publicaciones
        </h3>
        <p className="text-texto-secundario mt-1">
          Intenta ajustar tus filtros de búsqueda o explora otras opciones.
        </p>
      </div>
    );
  }

  // --- INICIO: RENDERIZADO DEL CARRUSEL 3D ---
  return (
    <div className="mt-8">
      <Swiper
        effect={'coverflow'}
        grabCursor={true}
        centeredSlides={true}
        loop={publicaciones.length > 2} // El loop funciona mejor con 3 o más slides
        slidesPerView={'auto'}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true}
        modules={[EffectCoverflow, Pagination, Navigation]}
        className="mySwiper" // Clase para estilos personalizados
        breakpoints={{
          // En pantallas de 640px o más, muestra 3 slides
          640: {
            slidesPerView: 2,
          },
          // En pantallas de 1024px o más, muestra 3 slides
          1024: {
            slidesPerView: 3,
          },
        }}
      >
        {publicaciones.map((p) => (
          <SwiperSlide key={p.creatorId} style={{ width: '384px' }}>
            <PaginaAmarillaDisplayCard publicacion={p} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
  // --- FIN: RENDERIZADO DEL CARRUSEL 3D ---
};

export default PaginasAmarillasResultados;