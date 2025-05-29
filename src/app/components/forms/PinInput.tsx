// src/app/components/forms/PinInput.tsx
'use client';

import React, { useState, useRef, ChangeEvent, KeyboardEvent, useEffect } from 'react';

interface PinInputProps {
  id?: string;
  length: number;
  onComplete?: (pin: string) => void;
  onChange?: (pin: string) => void; // Para uso como componente controlado si se desea
  value?: string; // Para uso como componente controlado
  disabled?: boolean;
  ariaLabel?: string;
}

const PinInput: React.FC<PinInputProps> = ({
  id = 'pin-input',
  length,
  onComplete,
  onChange,
  value = '',
  disabled = false,
  ariaLabel = 'PIN input',
}) => {
  // Inicializa el estado de los dígitos del PIN. Si se proporciona un valor, se usa.
  const initialPin = value && value.length === length ? value.split('') : Array(length).fill('');
  const [pin, setPin] = useState<string[]>(initialPin);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sincronizar con el prop 'value' si se usa como componente controlado
  useEffect(() => {
    if (value && value.length === length) {
      setPin(value.split(''));
    } else if (value === '') { // Permitir resetear desde fuera
        setPin(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newPin = [...pin];
    const inputValue = e.target.value;

    if (disabled || !/^[0-9]?$/.test(inputValue)) { // Solo permitir un dígito numérico o vacío
      return;
    }

    newPin[index] = inputValue;
    setPin(newPin);

    const currentPinString = newPin.join('');
    if (onChange) {
      onChange(currentPinString);
    }

    // Mover foco al siguiente input si se ingresó un dígito y no es el último
    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Verificar si todos los inputs están llenos
    if (newPin.every(digit => digit !== '')) {
      if (onComplete) {
        onComplete(newPin.join(''));
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (disabled) return;

    if (e.key === 'Backspace') {
      const newPin = [...pin];
      // Si el input actual está vacío y no es el primero, mover foco y borrar el anterior
      if (!newPin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        newPin[index - 1] = ''; // Opcional: borrar el anterior al hacer backspace en uno vacío
      } else {
        newPin[index] = ''; // Borrar el input actual
      }
      setPin(newPin);
      const currentPinString = newPin.join('');
      if (onChange) {
        onChange(currentPinString);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Podrías añadir manejo para pegar (paste) aquí si lo deseas
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select(); // Seleccionar el contenido del input al enfocar
  };

  return (
    <div className="flex justify-center space-x-2" aria-label={ariaLabel}>
      {Array(length)
        .fill('')
        .map((_, index) => (
          <input
            key={`${id}-${index}`}
            id={`${id}-${index}`}
            ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
              }}
            type="tel" // Usar 'tel' para sugerir teclado numérico en móviles
            maxLength={1}
            pattern="[0-9]" // Solo números
            inputMode="numeric" // Mejor para móviles
            value={pin[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={handleFocus}
            disabled={disabled}
            className={`
                w-12 h-14 md:w-14 md:h-16 
                text-center text-2xl md:text-3xl font-semibold 
                bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm
                focus:outline-none focus:ring-primario focus:border-primario 
                text-texto 
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            aria-label={`Dígito ${index + 1} del PIN`}
          />
        ))}
    </div>
  );
};

export default PinInput;