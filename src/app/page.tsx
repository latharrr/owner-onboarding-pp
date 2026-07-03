'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Zap, Shield } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useGPS } from '@/lib/hooks/useGPS';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const INTERN_NAME_KEY = 'picapool-intern-name';

export default function WelcomePage() {
  const router = useRouter();
  const { initSession, reset, isSubmitted } = useOnboardingStore();
  const { capture: captureGPS } = useGPS();

  const [internName, setInternName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Load saved intern name
  useEffect(() => {
    const stored = localStorage.getItem(INTERN_NAME_KEY);
    if (stored) {
      setSavedName(stored);
      setInternName(stored);
    }
  }, []);

  const handleStart = async () => {
    if (!internName.trim()) return;

    setIsStarting(true);

    // Save intern name for next session
    localStorage.setItem(INTERN_NAME_KEY, internName.trim());

    // Reset any prior draft + init session
    reset();
    initSession(internName.trim());

    // Silently capture GPS (never blocks)
    captureGPS();

    router.push('/onboarding');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-6 pt-10 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 bg-brand rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-sm">P</span>
          </div>
          <span className="font-black text-xl text-gray-900">Picapool</span>
        </div>
        <p className="text-xs text-brand font-medium">PG Owner Onboarding</p>
      </div>

      {/* Hero */}
      <div
        className="flex-1 flex flex-col px-6 pt-8"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 leading-tight mb-3">
            Onboard a PG owner in{' '}
            <span className="text-brand">under 2 minutes.</span>
          </h1>
          <p className="text-base text-gray-500 leading-relaxed">
            One question at a time. Auto-saves as you go. Works offline.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-10">
          {[
            { icon: <Zap className="w-3.5 h-3.5" />, label: 'Under 2 min' },
            { icon: <Shield className="w-3.5 h-3.5" />, label: 'Auto-saves' },
            { icon: <MapPin className="w-3.5 h-3.5" />, label: 'GPS capture' },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1.5 bg-brand-light text-brand px-3 py-1.5 rounded-full text-xs font-semibold"
            >
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-2 mb-6">
          <Label htmlFor="intern-name" className="text-sm font-semibold text-gray-700">
            Your Name
          </Label>
          <Input
            id="intern-name"
            type="text"
            placeholder="e.g. Rahul Sharma"
            value={internName}
            onChange={(e) => setInternName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-14 text-base rounded-2xl border-gray-200 focus:border-brand focus:ring-brand/20 px-4"
            autoFocus={!savedName}
            autoComplete="name"
          />
          {savedName && internName === savedName && (
            <p className="text-xs text-gray-400">Welcome back, {savedName}! 👋</p>
          )}
        </div>

        {/* CTA */}
        <button
          id="btn-start"
          type="button"
          onClick={handleStart}
          disabled={!internName.trim() || isStarting}
          className="w-full flex items-center justify-center gap-2 h-14 bg-brand text-white rounded-2xl font-bold text-base transition-all hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/25 mb-4"
        >
          {isStarting ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Start Onboarding
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {/* Resume draft */}
        {!isSubmitted && (
          <button
            id="btn-resume"
            type="button"
            onClick={() => router.push('/onboarding')}
            className="w-full text-center text-sm text-gray-400 hover:text-brand py-2 transition-colors"
          >
            Resume unfinished session →
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        <p className="text-xs text-gray-300">
          Internal tool · Picapool Operations © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
