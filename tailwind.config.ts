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
        'borde-tarjeta': 'var(--color-borde-tarjeta)', // NUEVO MAPEADO
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', /* ... resto de fuentes ... */],
        mono: ['ui-monospace', 'SFMono-Regular', /* ... resto de fuentes ... */],
      },
    },
  },
  plugins: [],
};

export default config;