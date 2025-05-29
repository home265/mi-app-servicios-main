'use client';

import React from 'react';

interface BlurLoaderProps {
  loading: boolean;
}

/**
 * Overlay con efecto de desenfoque y spinner mientras el canvas procesa la captura.
 */
export default function BlurLoader({ loading }: BlurLoaderProps) {
  if (!loading) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Capa de desenfoque */}
      <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm"></div>
      {/* Spinner centrado */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-primario rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
