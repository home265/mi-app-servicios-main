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
  // La lógica del componente, incluyendo estado y refs, no se altera.
  const initialPin = value && value.length === length ? value.split('') : Array(length).fill('');
  const [pin, setPin] = useState<string[]>(initialPin);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Los efectos y manejadores de eventos se mantienen sin cambios.
  useEffect(() => {
    if (value && value.length === length) {
      setPin(value.split(''));
    } else if (value === '') {
        setPin(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const newPin = [...pin];
    const inputValue = e.target.value;

    if (disabled || !/^[0-9]?$/.test(inputValue)) {
      return;
    }

    newPin[index] = inputValue;
    setPin(newPin);

    const currentPinString = newPin.join('');
    if (onChange) {
      onChange(currentPinString);
    }

    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

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
      if (!newPin[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        newPin[index - 1] = '';
      } else {
        newPin[index] = '';
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
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
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
            type="tel"
            maxLength={1}
            pattern="[0-9]"
            inputMode="numeric"
            value={pin[index]}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={handleFocus}
            disabled={disabled}
            className={`
                w-12 h-14 md:w-14 md:h-16 
                text-center text-2xl md:text-3xl font-semibold 
                bg-fondo border border-borde-tarjeta rounded-md shadow-sm
                focus:outline-none focus:ring-primario focus:border-primario 
                text-texto-principal 
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            aria-label={`Dígito ${index + 1} del PIN`}
          />
        ))}
    </div>
  );
};

export default PinInput;