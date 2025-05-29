// src/app/(ads)/editor/components/previews/MiniPreview.tsx
'use client';

import React from 'react';
import Image from 'next/image';
// --- MODIFICADO ---
// Se elimina EffectElement de las importaciones de tipos.
import type {
  EditorElement,
  ColorBackgroundElement,
  ImageBackgroundElement,
  SubimageElement,
  TextElement,
  CurvedTextElement,
  // EffectElement, // --- ELIMINADO ---
} from '../../hooks/useEditorStore';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ImageIcon, Sparkles } from 'lucide-react'; // Sparkles ya no se usará aquí

interface MiniPreviewProps {
  elemento: Partial<EditorElement>; // EditorElement ya no incluye EffectElement
  className?: string;
}

/**
 * MiniPreview muestra un vistazo rápido de un elemento (color, imagen, texto, logo)
 * en la esquina inferior izquierda del canvas.
 */
const MiniPreview: React.FC<MiniPreviewProps> = ({ elemento, className }) => {
  // Si no hay tipo, mostramos placeholder
  if (!elemento || !elemento.tipo) {
    return (
      <div className={`absolute bottom-4 left-4 bg-black text-white p-2 rounded-lg shadow-lg w-24 h-[135px] flex items-center justify-center ${className || ''}`}>
        <span className="text-xs">Sin datos</span>
      </div>
    );
  }

  // Clase base para el contenedor
  const containerClass = `absolute bottom-4 left-4 bg-black text-white p-2 rounded-lg shadow-lg w-24 h-[135px] relative overflow-hidden ${className || ''}`;

  // --- ELIMINADO ---
  // La lógica para 'efectosIndicator' se elimina porque 'EffectElement' (el antiguo) ya no existe.
  // Los nuevos efectos de animación del reel no se previsualizan de esta manera en un 'EditorElement'.
  // let efectosIndicator: React.ReactNode = null;
  // if (elemento.tipo === 'efecto') { // 'efecto' ya no es un tipo válido en EditorElement
  //   const filters = (elemento as EffectElement).filters || []; // EffectElement ya no existe
  //   if (filters.length > 0) {
  //     efectosIndicator = (
  //       <div
  //         title={filters.join(', ')}
  //         className="absolute top-1 right-1 bg-purple-500 text-white rounded-full p-1 flex items-center justify-center shadow z-10"
  //         style={{ width: '20px', height: '20px', fontSize: '10px' }}
  //       >
  //         <Sparkles size={12} />
  //       </div>
  //     );
  //   }
  // }

  // Renderizar contenido según tipo
  const renderContent = () => {
    switch (elemento.tipo) {
      case 'fondoColor': {
        const color = (elemento as ColorBackgroundElement).color;
        return <div className="w-full h-full" style={{ backgroundColor: color }} />;
      }
      case 'fondoImagen': {
        const src = (elemento as ImageBackgroundElement).src;
        if (!src) {
          return <ImageIcon size={24} className="text-gray-400 m-auto" />;
        }
        return (
          <div className="relative w-full h-full rounded overflow-hidden">
            <Image
              src={src}
              alt="Preview fondo"
              fill
              style={{ objectFit: 'cover' }}
              unoptimized={typeof src === 'string' && src.startsWith('data:')}
            />
          </div>
        );
      }
      case 'texto': {
        const el = elemento as TextElement;
        const fontSize = Math.max(8, Math.min((el.fontSizePct / 100) * 135, 16));
        return (
          <div className="w-full h-full p-1 flex items-center justify-center">
            <p
              className="truncate text-center"
              style={{
                color: el.color,
                fontFamily: el.fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: 1.2,
              }}
            >
              {el.text}
            </p>
          </div>
        );
      }
      case 'textoCurvo': {
        const el = elemento as CurvedTextElement;
        const fontSize = Math.max(8, Math.min((el.fontSizePct / 100) * 135, 16));
        return (
          <div className="w-full h-full p-1 flex items-center justify-center">
            <p
              className="truncate text-center"
              style={{
                color: el.color,
                fontFamily: el.fontFamily,
                fontSize: `${fontSize}px`,
                lineHeight: 1.2,
              }}
            >
              {el.text}
            </p>
          </div>
        );
      }
      case 'subimagen': {
        const src = (elemento as SubimageElement).src;
        if (!src) {
          return <ImageIcon size={24} className="text-gray-400 m-auto" />;
        }
        return (
          <div className="relative w-full h-full p-1">
            <Image
              src={src}
              alt="Preview logo"
              fill
              style={{ objectFit: 'contain' }}
              unoptimized={typeof src === 'string' && src.startsWith('data:')}
            />
          </div>
        );
      }
      // --- MODIFICADO ---
      // El case 'default' o cualquier case que manejara 'efecto' ya no es necesario
      // porque 'efecto' no es un tipo válido en EditorElement.
      // Si elemento.tipo fuera de un tipo inesperado (que no debería pasar si los tipos son correctos),
      // el default se activaría.
      default:
        // Para ayudar a la depuración si un tipo inesperado llega aquí
        console.warn("MiniPreview: Tipo de elemento desconocido o no manejado:", elemento.tipo);
        return <span className="text-xs m-auto">Tipo: {elemento.tipo || 'desconocido'}</span>;
    }
  };

  return (
    <div className={containerClass}>
      {renderContent()}
      {/* --- MODIFICADO --- Se elimina efectosIndicator de aquí */}
      {/* {efectosIndicator} */}
    </div>
  );
};

export default MiniPreview;