import { Timestamp } from "firebase/firestore";
import type { PlanId, CampaniaId } from "@/lib/constants/anuncios"; // Importar CampaniaId

// Definimos los nombres de los efectos de animación que se podrán aplicar al reel
export type ReelAnimationEffectType =
  | 'none'
  | 'fadeIn'
  | 'zoomIn'
  | 'slideInFromLeft'
  | 'pulse';

/**
 * El elemento que forma parte de un anuncio (texto, subimagen, fondo, etc.)
 */
export interface Elemento {
  /** Texto plano, si aplica */
  text?: string;
  tipo: 'texto' | 'textoCurvo' | 'fondoColor' | 'fondoImagen' | 'subimagen';
  // Medidas y posición en porcentajes (0–100)
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;

  // Propiedades opcionales según tipo
  color?: string;            // para texto o fondo de color
  fontFamily?: string;       // para texto
  fontSizePct?: number;      // tamaño de fuente relativo (%)
  imageUrl?: string;         // URL para fondoImagen o subimagen
  curveRadius?: number;      // radio de curvatura para textoCurvo
  effects?: string[];        // lista de IDs de efectos aplicados (Este es de los elementos Konva, no del reel)
}

/**
 * Captura de pantalla de un elemento del anuncio (stage)
 */
export interface Captura {
  imageUrl: string;           // Data URL o URL en Storage
  createdAt: Timestamp;       // Fecha de la captura
  screenIndex: number;        // Orden en la secuencia de capturas

  // Metadata heredada del anuncio para facilitar consultas
  plan: PlanId;               // Usar el tipo PlanId importado
  campaignDurationDays: number;
  provincia: string;
  localidad: string;
  animationEffect?: ReelAnimationEffectType; // Efecto de animación para esta captura

  // Nuevos campos para duración individual y exposición total
  durationSeconds: number;    // Segundos que dura esta imagen
  totalExposure: number;      // Exposición total (screensCount * durationSeconds)
}

/**
 * Documento principal de un anuncio
 */
export interface Anuncio {
  id?: string;                // ID de documento (opcional cuando se crea)
  creatorId: string;          // UID del comercio/prestador

  // Datos de plan y campaña
  plan: PlanId;               // Usar el tipo PlanId importado
  campaniaId?: CampaniaId;
  campaignDurationDays: number;
  maxScreens: number;         // Esencial para saber cuántas pantallas esperar en elementosPorPantalla

  // Estado del anuncio
  status: 'draft' | 'pendingPayment' | 'active' | 'expired' | 'cancelled';

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  startDate?: Timestamp;      // Fecha de inicio post-pago
  endDate?: Timestamp;        // Fecha de finalización

  // Localización
  provincia: string;
  localidad: string;

  // Elementos del canvas, organizados por pantalla
  elementosPorPantalla?: Record<string, Elemento[]>;
}

export { Timestamp };
