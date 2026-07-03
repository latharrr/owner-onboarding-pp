'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  prefix?: string;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  label,
  unit,
  prefix,
  size = 'md',
  disabled = false,
}: StepperProps) {
  const decrement = () => {
    const next = value - step;
    if (next >= min) onChange(next);
  };

  const increment = () => {
    const next = value + step;
    if (next <= max) onChange(next);
  };

  const btnSize = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  const valueSize = {
    sm: 'text-lg min-w-[3rem]',
    md: 'text-2xl min-w-[4.5rem]',
    lg: 'text-3xl min-w-[6rem]',
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      )}
      <div className="flex items-center gap-3">
        <button
          id={`stepper-dec-${label ?? 'val'}`}
          type="button"
          onClick={decrement}
          disabled={disabled || value <= min}
          className={cn(
            'rounded-2xl border border-gray-200 flex items-center justify-center font-medium transition-all active:scale-95',
            btnSize[size],
            value <= min || disabled
              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 bg-white hover:bg-brand-light hover:border-brand/30 hover:text-brand'
          )}
        >
          <Minus className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>

        <div className={cn('text-center font-bold text-gray-900', valueSize[size])}>
          <span>
            {prefix}
            {value.toLocaleString('en-IN')}
          </span>
          {unit && (
            <span className="text-xs font-medium text-gray-400 ml-1">{unit}</span>
          )}
        </div>

        <button
          id={`stepper-inc-${label ?? 'val'}`}
          type="button"
          onClick={increment}
          disabled={disabled || value >= max}
          className={cn(
            'rounded-2xl border border-gray-200 flex items-center justify-center font-medium transition-all active:scale-95',
            btnSize[size],
            value >= max || disabled
              ? 'text-gray-300 cursor-not-allowed bg-gray-50'
              : 'text-gray-700 bg-white hover:bg-brand-light hover:border-brand/30 hover:text-brand'
          )}
        >
          <Plus className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        </button>
      </div>
    </div>
  );
}
