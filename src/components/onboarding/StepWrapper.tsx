// ============================================================
// Picapool — Reusable UI Components
// ============================================================

// ── Step Wrapper ─────────────────────────────────────────────
// All onboarding steps use this wrapper for consistent layout

'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StepWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  isOptional?: boolean;
}

export function StepWrapper({
  title,
  subtitle,
  children,
  className,
  isOptional = false,
}: StepWrapperProps) {
  return (
    <div
      className={cn('flex flex-col gap-6 px-6 pt-6 pb-32', className)}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-gray-900 leading-tight">{title}</h1>
          {isOptional && (
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              Optional
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 leading-relaxed">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
