'use client';

import { useState, useEffect } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export function PhoneInput({ value, onChange, placeholder, className = '', required }: PhoneInputProps) {
  const PREFIX = '+998';
  
  // Strip prefix for display in the input
  const getDigitsOnly = (val: string) => {
    return val.replace(/\D/g, '').replace(/^998/, '');
  };

  const [digits, setDigits] = useState(getDigitsOnly(value));

  useEffect(() => {
    setDigits(getDigitsOnly(value));
  }, [value]);

  const formatDisplay = (raw: string) => {
    const d = raw.replace(/\D/g, '').slice(0, 9);
    if (d.length === 0) return '';
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
    if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
    return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
    setDigits(raw);
    onChange(raw ? `+998${raw}` : '');
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-mono select-none pointer-events-none">
        {PREFIX}
      </span>
      <input
        type="tel"
        value={formatDisplay(digits)}
        onChange={handleChange}
        placeholder={placeholder || '90 123 45 67'}
        required={required}
        className={`pl-16 ${className || 'w-full pr-4 py-2.5 bg-slate-800/60 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono'}`}
      />
    </div>
  );
}
