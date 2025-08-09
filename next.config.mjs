// next.config.mjs

import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build standalone (SSR/API dinámicas)
  output: 'standalone',

  reactStrictMode: true,

  // Permitir cargar imágenes desde Firebase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        // pathname: '/v0/b/tu-proyecto-id.appspot.com/o/**',
      },
    ],
  },

  // Las configuraciones de Webpack y Turbopack para 'canvas' han sido eliminadas
  // ya que las librerías que las necesitaban (konva) fueron desinstaladas.
};

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);