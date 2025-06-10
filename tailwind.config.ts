// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // --- ESTA SECCIÓN DE COLORES ESTÁ PERFECTA Y NO SE TOCA ---
      colors: {
        'fondo': 'var(--color-fondo)',
        'primario': 'var(--color-primario)',
        'secundario': 'var(--color-secundario)',
        'texto': {
          DEFAULT: 'var(--color-texto-principal)',
          'principal': 'var(--color-texto-principal)',
          'secundario': 'var(--color-texto-secundario)',
        },
        'tarjeta': 'var(--color-tarjeta)',
        'error': 'var(--color-error)',
        'borde-tarjeta': 'var(--color-borde-tarjeta)',
      },
      // --- AQUÍ ESTÁ EL ÚNICO CAMBIO ---
      fontFamily: {
        // Le decimos a la aplicación que la fuente por defecto ('sans')
        // ahora es 'Barlow', a través de una variable que pondremos en el archivo layout.tsx.
        sans: ['var(--font-barlow)', 'ui-sans-serif', 'system-ui'],

        // La fuente 'mono' se mantiene exactamente igual por si se usa para algo.
        mono: ['ui-monospace', 'SFMono-Regular', /* ... resto de fuentes ... */],
      },
    },
  },
  // --- LA SECCIÓN DE PLUGINS SE QUEDA VACÍA, TAL COMO LA TENÍAS ---
  plugins: [],
};

export default config;