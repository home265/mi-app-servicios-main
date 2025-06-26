// src/app/layout.tsx
import './globals.css';
import { Providers } from './providers';
import {
  // --- 1. AQUÍ AGREGAMOS BARLOW A TU LISTA DE FUENTES ---
  Barlow,
  Roboto,
  Lato,
  Oswald,
  Open_Sans, // Nota el guion bajo para nombres con espacios
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
} from 'next/font/google';

// --- Mantenemos la configuración de todas tus fuentes para el editor ---
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

// --- 2. AQUÍ AÑADIMOS LA CONFIGURACIÓN PARA BARLOW ---
const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '700'], // Cargamos el grosor normal y el "bold" o negrita
  display: 'swap',
  variable: '--font-barlow', // Esta es la variable que conectamos en tailwind.config.ts
});


export const metadata = {
  // Actualizado para coincidir con la nueva marca "CODYS | Tu red de confianza"
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
      // --- 3. AÑADIMOS LA VARIABLE DE BARLOW A LA LISTA, SIN QUITAR NINGUNA OTRA ---
      className={`
        ${barlow.variable}
        ${roboto.variable}
        ${lato.variable}
        ${oswald.variable}
        ${openSans.variable}
        ${montserrat.variable}
        ${raleway.variable}
        ${poppins.variable}
        ${nunito.variable}
        ${merriweather.variable}
        ${anton.variable}
        ${cinzel.variable}
        ${medievalSharp.variable}
        ${unifrakturCook.variable}
        ${pacifico.variable}
        ${dancingScript.variable}
        ${playfairDisplay.variable}
        ${indieFlower.variable}
        ${bebasNeue.variable}
        ${fredoka.variable}
        ${abrilFatface.variable}
        ${luckiestGuy.variable}
        ${creepster.variable}
        ${spicyRice.variable}
        ${fasterOne.variable}
        ${chewy.variable}
        ${rockSalt.variable}
        ${coveredByYourGrace.variable}
      `}
    >
      <head>
        {/* next/font se encarga de inyectar los estilos de fuente necesarios aquí.
            No se necesitan las etiquetas <link> manuales a Google Fonts. */}
      </head>
      {/* Aplicamos Barlow como clase principal al BODY para que sea la fuente por defecto.
          Las otras fuentes siguen estando disponibles para tu editor, como querías. */}
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