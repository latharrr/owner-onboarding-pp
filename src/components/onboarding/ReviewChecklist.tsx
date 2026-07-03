'use client';

import { CheckCircle, AlertCircle, Circle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { ReviewItem } from '@/types/onboarding';

interface ReviewChecklistProps {
  items: ReviewItem[];
  propertyName?: string;
}

export function ReviewChecklist({ items, propertyName }: ReviewChecklistProps) {
  const router = useRouter();
  const complete = items.filter((i) => i.status === 'complete');
  const missing = items.filter((i) => i.status === 'missing');
  const optional = items.filter((i) => i.status === 'optional');

  return (
    <div className="flex flex-col gap-4">
      {propertyName && (
        <h3 className="font-semibold text-gray-800 text-base">{propertyName}</h3>
      )}

      {missing.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-red-500 uppercase tracking-wide">
            ⚠ Missing — Fix before submitting
          </p>
          <div className="rounded-2xl border border-red-100 overflow-hidden">
            {missing.map((item, i) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 bg-red-50/50',
                  i > 0 && 'border-t border-red-100'
                )}
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.label}</p>
                  {item.value && <p className="text-xs text-gray-500">{item.value}</p>}
                </div>
                {item.stepPath && (
                  <button
                    id={`fix-${item.id}`}
                    type="button"
                    onClick={() => router.push(item.stepPath!)}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Fix
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold text-green-600 uppercase tracking-wide">
          ✓ Complete
        </p>
        <div className="rounded-2xl border border-green-100 overflow-hidden">
          {complete.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                i > 0 && 'border-t border-green-50'
              )}
            >
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.label}</p>
                {item.value && <p className="text-xs text-gray-500">{item.value}</p>}
              </div>
            </div>
          ))}
          {optional.map((item, i) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                (complete.length + i) > 0 && 'border-t border-green-50'
              )}
            >
              <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">{item.label} <span className="text-xs">(optional)</span></p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
