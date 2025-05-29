'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation'; //
import Card from '@/app/components/ui/Card'; //
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { campanias, Campania, planes, CampaniaId } from '@/lib/constants/anuncios'; //
import { useAnuncioStore } from '@/store/anuncioStore'; //

export default function CampaniasPage() {
  const router = useRouter(); //
  const searchParams = useSearchParams(); //

  const borradorId = searchParams.get('borradorId'); //

  const planIdFromStore = useAnuncioStore((state) => state.planId); //
  const setCampaniaInStore = useAnuncioStore((state) => state.setCampania); //
  const currentCampaniaIdFromStore = useAnuncioStore((state) => state.campaniaId); //
  const setScreensCountInStore = useAnuncioStore((state) => state.setScreensCount); // Asumo que necesitas setear esto

  if (planIdFromStore === null) { //
    console.log("CampaniasPage: Falta planId, redirigiendo a /planes..."); //
    if (typeof window !== 'undefined') { //
      router.replace(borradorId ? `/planes?borradorId=${borradorId}` : '/planes'); // Mantener borradorId si existe
    }
    return ( //
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Redirigiendo...</p>
      </div>
    );
  }

  const plan = planes.find((p) => p.id === planIdFromStore); //

  if (!plan) { //
    console.error("CampaniasPage: No se encontró el plan con ID:", planIdFromStore, "a pesar de que no es null."); //
    if (typeof window !== 'undefined') { //
      router.replace(borradorId ? `/planes?borradorId=${borradorId}&error=plan_no_encontrado` : '/planes?error=plan_no_encontrado');
    }
    return ( //
      <div className="min-h-screen bg-fondo text-texto p-4 flex items-center justify-center">
        <p>Error: Plan no encontrado. Redirigiendo...</p>
      </div>
    );
  }

  const handleSelectCampania = (selectedCampaniaId: CampaniaId) => { //
    setCampaniaInStore(selectedCampaniaId); //
    
    // El número de pantallas (maxImages) viene del plan seleccionado.
    // Es importante que se guarde en el anuncioStore para que NuevoAnuncioPage lo use.
    setScreensCountInStore(plan.maxImages); // Guardar el número de pantallas del plan.

    // Lógica de redirección ajustada:
    // Si hay un borradorId, se asume que se está editando, ir a /editor/[borradorId] (pasando por resumen si es necesario)
    // Si no hay borradorId, es un anuncio nuevo, ir a /editor/nuevo (pasando por resumen si es necesario)
    // Asumiendo que después de campañas siempre vas a 'resumen' y 'resumen' redirige a '/editor/nuevo' o '/editor/[id]'
    
    // La lógica actual te lleva a /resumen. La página /resumen deberá decidir si ir a /editor/nuevo o /editor/[borradorId]
    // Para simplificar y seguir la ruta, si el siguiente paso es ir directamente al flujo del editor:
    if (borradorId) { //
      // Editando un borrador existente, el ID ya existe.
      // Si /resumen es un paso obligatorio:
      router.push(`/resumen?borradorId=${borradorId}`); //
      // Si puedes ir directo al editor y /editor/[anuncioId] carga los datos:
      // router.push(`/editor/${borradorId}`);
    } else { //
      // Creando un anuncio nuevo.
      // Si /resumen es un paso obligatorio:
      router.push('/resumen'); //
      // Si /resumen no es necesario y /editor/nuevo crea el draft:
      // router.push('/editor/nuevo');
    }
  };

  return ( //
    <div className="min-h-screen bg-fondo text-texto p-4">
      <h1 className="text-3xl font-bold text-primario mb-8 text-center">
        {borradorId ? 'Modifica tu Campaña' : 'Elige tu Campaña'} {/* */}
      </h1>
      {borradorId && ( //
         <p className="text-center text-texto-secundario mb-8">
           Estás modificando la configuración de tu borrador existente.
         </p>
       )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanias.map((campania) => { //
          const baseTotal = plan.priceARS * campania.months; //
          const totalWithDiscount = Math.round(baseTotal * (1 - campania.discount)); //
          const isSelected = campania.id === currentCampaniaIdFromStore; //

          return ( //
            <Card //
              key={campania.id} //
              onClick={() => handleSelectCampania(campania.id)} //
              className={`cursor-pointer hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between p-6
                           ${isSelected ? 'ring-2 ring-primario shadow-xl border-primario' : 'border-transparent'}`} //
              role="button" //
              tabIndex={0} //
              aria-pressed={isSelected} //
            >
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-center">
                  {campania.name} {/* */}
                </h2>
                <p className="mb-2">
                  <span className="font-medium">Duración:</span> {campania.months} {campania.months > 1 ? 'meses' : 'mes'} {/* */}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Descuento:</span> {campania.discount * 100}% {/* */}
                </p>
                <p className="mb-2">
                  <span className="font-medium">Precio total:</span> ${totalWithDiscount.toLocaleString('es-AR')} ARS {/* */}
                </p>
              </div>
              {isSelected && ( //
                <div className="mt-4 pt-2 border-t border-primario/30 text-center">
                  <span className="text-sm font-semibold text-primario">Campaña Actual</span>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      <div className="text-center mt-12">
        <button
          onClick={() => { //
            if (borradorId) { //
              router.push(`/planes?borradorId=${borradorId}`); //
            } else { //
              router.push('/planes'); //
            }
          }}
          className="text-texto-secundario hover:text-primario underline"
        >
          Volver a Planes
        </button>
      </div>
    </div>
  );
}