'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface ChipOption {
  id: string;
  label: string;
  icon?: string;
}

interface ChipSelectProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiSelect?: boolean;
  columns?: 2 | 3;
  size?: 'sm' | 'md' | 'lg';
}

export function ChipSelect({
  options,
  selected,
  onChange,
  multiSelect = true,
  columns = 2,
  size = 'md',
}: ChipSelectProps) {
  const toggle = (id: string) => {
    if (multiSelect) {
      onChange(
        selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]
      );
    } else {
      onChange(selected.includes(id) ? [] : [id]);
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs min-h-[40px]',
    md: 'px-4 py-3 text-sm min-h-[48px]',
    lg: 'px-4 py-4 text-sm min-h-[56px]',
  };

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
  };

  return (
    <div className={cn('grid gap-2.5', gridCols[columns])}>
      {options.map((option) => {
        const isSelected = selected.includes(option.id);
        return (
          <button
            key={option.id}
            id={`chip-${option.id}`}
            type="button"
            onClick={() => toggle(option.id)}
            className={cn(
              'flex items-center gap-2 rounded-2xl border font-medium transition-all active:scale-[0.97]',
              sizeClasses[size],
              isSelected
                ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand/40 hover:bg-brand-light/30'
            )}
          >
            {option.icon && (
              <span className="text-base leading-none flex-shrink-0">{option.icon}</span>
            )}
            <span className="text-left leading-snug">{option.label}</span>
            {isSelected && multiSelect && (
              <Check className="w-3.5 h-3.5 ml-auto flex-shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
}
