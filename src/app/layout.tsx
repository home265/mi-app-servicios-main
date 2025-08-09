// src/app/layout.tsx
import './globals.css';
import { Providers } from './providers';
import NotificationWatcher from '@/app/components/notificaciones/NotificationWatcher';
import type { Metadata, Viewport } from 'next';
import { Barlow } from 'next/font/google';

// --- ÚNICA FUENTE NECESARIA PARA LA APP ---
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '700'], // Ajustado a los pesos que probablemente uses
  display: 'swap',
  variable: '--font-barlow',
});

export const metadata: Metadata = {
  title: 'CODYS | Tu red de confianza',
  description: 'Conectamos necesidades con soluciones.',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'CODYS',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#0F2623', // Corresponde a --color-fondo oscuro
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Aplicamos únicamente la variable de Barlow
    <html lang="es" className={barlow.variable}>
      <body>
        <NotificationWatcher />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}