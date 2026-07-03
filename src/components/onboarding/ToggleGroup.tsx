'use client';

import { cn } from '@/lib/utils';

interface ToggleOption {
  id: string;
  label: string;
  icon?: string;
  description?: string;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value: string | null;
  onChange: (value: string) => void;
  layout?: 'row' | 'grid' | 'column';
  size?: 'sm' | 'md' | 'lg';
}

export function ToggleGroup({
  options,
  value,
  onChange,
  layout = 'row',
  size = 'md',
}: ToggleGroupProps) {
  const layoutClasses = {
    row: 'flex flex-row gap-3 flex-wrap',
    grid: 'grid grid-cols-2 gap-3',
    column: 'flex flex-col gap-2',
  };

  const sizeClasses = {
    sm: 'px-4 py-2.5 text-sm min-h-[44px]',
    md: 'px-5 py-4 text-sm min-h-[56px]',
    lg: 'px-6 py-5 text-base min-h-[64px]',
  };

  return (
    <div className={layoutClasses[layout]}>
      {options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            id={`toggle-${option.id}`}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border font-medium transition-all active:scale-[0.97] flex-1',
              sizeClasses[size],
              layout === 'column' && 'flex-1 w-full',
              isSelected
                ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                : 'bg-white text-gray-700 border-gray-200 hover:border-brand/40 hover:bg-brand-light/20'
            )}
          >
            {option.icon && (
              <span className="text-xl leading-none flex-shrink-0">{option.icon}</span>
            )}
            <div className="text-left">
              <div className="font-semibold">{option.label}</div>
              {option.description && (
                <div
                  className={cn(
                    'text-xs mt-0.5 font-normal',
                    isSelected ? 'text-white/70' : 'text-gray-400'
                  )}
                >
                  {option.description}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
