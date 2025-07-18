// next.config.mjs

// ========================================================================
// 1. LÍNEA AÑADIDA: Importa el paquete del analizador
// ========================================================================
import withBundleAnalyzer from '@next/bundle-analyzer';


// ========================================================================
// TU CONFIGURACIÓN ORIGINAL (PERMANECE 100% INTACTA)
// ========================================================================
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

  /* ───────────────  WEBPACK  ─────────────── */
  // Excluye el paquete nativo `canvas` sólo en el build de producción del servidor
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      config.externals = [...(config.externals || []), 'canvas'];
    }
    return config;
  },

  /* ──────────────  TURBOPACK  ────────────── */
  // 1) Evita empaquetar módulos nativos en Server Components
  serverExternalPackages: ['canvas'],

  // 2) Si alguna dependencia cliente intenta importar `canvas`,
  //    usará el stub `empty-module.ts` (un archivo de una línea: `export default {};`)
  turbopack: {
    resolveAlias: {
      canvas: './empty-module.ts',
    },
  },
};


// ========================================================================
// 2. LÓGICA AÑADIDA: Prepara la función del analizador
// ========================================================================
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});


// ========================================================================
// 3. EXPORTACIÓN MODIFICADA: Exporta tu configuración envuelta en el analizador
// ========================================================================
export default bundleAnalyzer(nextConfig);