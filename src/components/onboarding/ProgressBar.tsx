'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0–100
  label?: string;
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col gap-1 px-6 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">Progress</span>
        <span className="text-xs font-semibold text-brand">{clamped}%</span>
      </div>
      <div className="h-1.5 bg-brand-light rounded-full overflow-hidden">
        <div
          className="h-full bg-brand rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {label && <p className="text-xs text-gray-400">{label}</p>}
    </div>
  );
}
