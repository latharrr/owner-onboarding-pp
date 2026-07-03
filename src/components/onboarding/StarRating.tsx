'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (rating: 1 | 2 | 3 | 4 | 5) => void;
  size?: 'sm' | 'md' | 'lg';
  labels?: Record<number, string>;
}

const DEFAULT_LABELS: Record<number, string> = {
  1: 'Very poor',
  2: 'Below average',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export function StarRating({
  value,
  onChange,
  size = 'lg',
  labels = DEFAULT_LABELS,
}: StarRatingProps) {
  const starSize = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-10 h-10' };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            id={`star-${star}`}
            type="button"
            onClick={() => onChange(star as 1 | 2 | 3 | 4 | 5)}
            className="transition-transform active:scale-90 hover:scale-110"
          >
            <Star
              className={cn(
                starSize[size],
                'transition-colors',
                star <= value
                  ? 'fill-brand text-brand'
                  : 'fill-transparent text-gray-300'
              )}
            />
          </button>
        ))}
      </div>
      {labels[value] && (
        <p className="text-sm font-medium text-brand">{labels[value]}</p>
      )}
    </div>
  );
}
