// src/app/layout.tsx
import './globals.css';
import { Providers } from './providers';
import NotificationWatcher from '@/app/components/notificaciones/NotificationWatcher'; // <-- AQUÍ SE IMPORTA
import {
  Barlow,
  Roboto,
  Lato,
  Oswald,
  Open_Sans,
  Montserrat,
  Raleway,
  Poppins,
  Nunito,
  Merriweather,
  Anton,
  Cinzel,
  MedievalSharp,
  UnifrakturCook,
  Pacifico,
  Dancing_Script,
  Playfair_Display,
  Indie_Flower,
  Bebas_Neue,
  Fredoka,
  Abril_Fatface,
  Luckiest_Guy,
  Creepster,
  Spicy_Rice,
  Faster_One,
  Chewy,
  Rock_Salt,
  Covered_By_Your_Grace,
  Gloria_Hallelujah,
  Boogaloo,
  Julius_Sans_One,
  Wallpoet,
} from 'next/font/google';

// --- Se asigna cada fuente a una constante, como lo requiere Next.js ---

// 1. La fuente principal de la UI (Barlow) se mantiene con la precarga por defecto.
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-barlow' });

// 2. A TODAS las demás fuentes (para el editor) se les añade "preload: false" para evitar la carga innecesaria en cada página.
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-roboto', preload: false });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-lato', preload: false });
const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-oswald', preload: false });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-open-sans', preload: false });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-montserrat', preload: false });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-raleway', preload: false });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-poppins', preload: false });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-nunito', preload: false });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-merriweather', preload: false });
const anton = Anton({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-anton', preload: false });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-cinzel', preload: false });
const medievalSharp = MedievalSharp({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-medievalsharp', preload: false });
const unifrakturCook = UnifrakturCook({ subsets: ['latin'], weight: '700', display: 'swap', variable: '--font-unifrakturcook', preload: false });
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pacifico', preload: false });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-dancing-script', preload: false });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-playfair-display', preload: false });
const indieFlower = Indie_Flower({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-indie-flower', preload: false });
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-bebas-neue', preload: false });
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-fredoka', preload: false });
const abrilFatface = Abril_Fatface({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-abril-fatface', preload: false });
const luckiestGuy = Luckiest_Guy({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-luckiest-guy', preload: false });
const creepster = Creepster({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-creepster', preload: false });
const spicyRice = Spicy_Rice({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-spicy-rice', preload: false });
const fasterOne = Faster_One({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-faster-one', preload: false });
const chewy = Chewy({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-chewy', preload: false });
const rockSalt = Rock_Salt({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-rock-salt', preload: false });
const coveredByYourGrace = Covered_By_Your_Grace({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-covered-by-your-grace', preload: false });
const gloriaHallelujah = Gloria_Hallelujah({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-gloria-hallelujah', preload: false });
const boogaloo = Boogaloo({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-boogaloo', preload: false });
const juliusSansOne = Julius_Sans_One({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-julius-sans-one', preload: false });
const wallpoet = Wallpoet({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-wallpoet', preload: false });


export const metadata = {
  title: 'CODYS | Tu red de confianza',
  description: 'Conectamos necesidades con soluciones.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      // Se combinan tanto la clase principal de la UI como las variables de las fuentes del editor.
      // Esto asegura que la fuente por defecto se aplique correctamente y que las demás estén disponibles como variables CSS.
      className={`
        ${barlow.className} ${roboto.variable} ${lato.variable} ${oswald.variable}
        ${openSans.variable} ${montserrat.variable} ${raleway.variable} ${poppins.variable}
        ${nunito.variable} ${merriweather.variable} ${anton.variable} ${cinzel.variable}
        ${medievalSharp.variable} ${unifrakturCook.variable} ${pacifico.variable}
        ${dancingScript.variable} ${playfairDisplay.variable} ${indieFlower.variable}
        ${bebasNeue.variable} ${fredoka.variable} ${abrilFatface.variable}
        ${luckiestGuy.variable} ${creepster.variable} ${spicyRice.variable}
        ${fasterOne.variable} ${chewy.variable} ${rockSalt.variable}
        ${coveredByYourGrace.variable} ${gloriaHallelujah.variable} ${boogaloo.variable}
        ${juliusSansOne.variable} ${wallpoet.variable}
      `}
    >
      <head />
      {/* El body ya no necesita la clase porque la hereda del html, lo que mantiene el código más limpio. */}
      <body>
        <NotificationWatcher /> {/* <-- AQUÍ SE INTEGRA */}
        <Providers>
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}