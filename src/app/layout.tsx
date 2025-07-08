// src/app/layout.tsx
import './globals.css';
import { Providers } from './providers';
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
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-barlow' });
const roboto = Roboto({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-roboto' });
const lato = Lato({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-lato' });
const oswald = Oswald({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-oswald' });
const openSans = Open_Sans({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-open-sans' });
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-montserrat' });
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-raleway' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-poppins' });
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-nunito' });
const merriweather = Merriweather({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-merriweather' });
const anton = Anton({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-anton' });
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-cinzel' });
const medievalSharp = MedievalSharp({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-medievalsharp' });
const unifrakturCook = UnifrakturCook({ subsets: ['latin'], weight: '700', display: 'swap', variable: '--font-unifrakturcook' });
const pacifico = Pacifico({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-pacifico' });
const dancingScript = Dancing_Script({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-dancing-script' });
const playfairDisplay = Playfair_Display({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-playfair-display' });
const indieFlower = Indie_Flower({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-indie-flower' });
const bebasNeue = Bebas_Neue({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-bebas-neue' });
const fredoka = Fredoka({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-fredoka' });
const abrilFatface = Abril_Fatface({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-abril-fatface' });
const luckiestGuy = Luckiest_Guy({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-luckiest-guy' });
const creepster = Creepster({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-creepster' });
const spicyRice = Spicy_Rice({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-spicy-rice' });
const fasterOne = Faster_One({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-faster-one' });
const chewy = Chewy({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-chewy' });
const rockSalt = Rock_Salt({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-rock-salt' });
const coveredByYourGrace = Covered_By_Your_Grace({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-covered-by-your-grace' });
const gloriaHallelujah = Gloria_Hallelujah({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-gloria-hallelujah' });
const boogaloo = Boogaloo({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-boogaloo' });
const juliusSansOne = Julius_Sans_One({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-julius-sans-one' });
const wallpoet = Wallpoet({ subsets: ['latin'], weight: '400', display: 'swap', variable: '--font-wallpoet' });

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
      // Se usan todas las variables para que Next.js las precargue correctamente.
      // Esto genera los warnings en páginas que no usan las fuentes, pero asegura que el editor funcione.
      className={`
        ${barlow.variable} ${roboto.variable} ${lato.variable} ${oswald.variable}
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
      <body className={barlow.className}>
        <Providers>
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}