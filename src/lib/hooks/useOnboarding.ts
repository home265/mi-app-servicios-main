// src/lib/hooks/useOnboarding.ts

"use client";

import { useState, useEffect } from 'react';

// El tipo ahora incluye las categorías de escritorio más específicas
export type OnboardingPlatform = 'ios' | 'android' | 'desktop-chrome' | 'desktop-edge' | 'desktop-safari' | 'unknown';

export const useOnboarding = () => {
    const [shouldShow, setShouldShow] = useState(false);
    const [platform, setPlatform] = useState<OnboardingPlatform>('unknown');

    useEffect(() => {
        // Esta lógica solo se ejecuta en el lado del cliente
        const onboardingComplete = localStorage.getItem('onboardingComplete');

        // Solo proceder si el onboarding no se ha completado antes
        if (!onboardingComplete) {
            const userAgent = navigator.userAgent || navigator.vendor;
            
            // 1. Detección de Móvil (Máxima Prioridad)
            if (/android/i.test(userAgent)) {
                setPlatform('android');
                setShouldShow(true);
            } 
            else if (/iPad|iPhone|iPod/.test(userAgent) && !('MSStream'in window)) {
                setPlatform('ios');
                setShouldShow(true);
            }
            // 2. Detección de Escritorio (Solo si no es móvil)
            else {
                // Se comprueba Edge ANTES que Chrome, porque el userAgent de Edge también contiene "Chrome".
                if (/edg/i.test(userAgent)) {
                    setPlatform('desktop-edge');
                    setShouldShow(true);
                }
                // Si no es Edge, se comprueba si es Chrome.
                else if (/chrome/i.test(userAgent)) {
                    setPlatform('desktop-chrome');
                    setShouldShow(true);
                }
                // Si no es ninguno de los anteriores, se comprueba si es Safari.
                else if (/safari/i.test(userAgent)) {
                    setPlatform('desktop-safari');
                    setShouldShow(true);
                }
            }
        }
    }, []); // El array vacío asegura que esto se ejecute solo una vez

    const handleOnboardingComplete = () => {
        localStorage.setItem('onboardingComplete', 'true');
        setShouldShow(false);
    };

    return {
        shouldShow,
        platform,
        handleOnboardingComplete,
    };
};