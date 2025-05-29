// src/app/components/ui/Input.tsx
'use client'; // Si tiene interactividad o refs, aunque para un input simple podría no ser necesario

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  // Podríamos añadir más props como 'error', 'helperText', etc. más adelante
}

const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-texto-secundario mb-1">
        {label}
      </label>
      <input
        id={id}
        className="block w-full px-3 py-2 bg-fondo border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-primario focus:border-primario sm:text-sm text-texto dark:text-texto-dark"
        {...props} // Pasa todas las demás props (type, placeholder, value, onChange, etc.)
      />
    </div>
  );
};

export default Input;