import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./src/pages//*.{js,ts,jsx,tsx,mdx}",
    "./src/components//.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fondo: 'var(--color-fondo)',
        primario: 'var(--color-primario)',
        secundario: 'var(--color-secundario)',
        texto: {
          DEFAULT: 'var(--color-texto-principal)',
          principal: 'var(--color-texto-principal)',
          secundario: 'var(--color-texto-secundario)',
        },
        tarjeta: 'var(--color-tarjeta)',
        error: 'var(--color-error)',
        'borde-tarjeta': 'var(--color-borde-tarjeta)',
      },
      fontFamily: {
        sans: ['var(--font-barlow)', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/forms'), // ← inputs coherentes
  ],
};

export default config;