'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Home, Plus, Clock, Hash } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { formatDuration } from '@/lib/utils/ids';

export default function SuccessPage() {
  const router = useRouter();
  const {
    ownerDisplayId,
    propertyDisplayIds,
    submissionDisplayId,
    session,
    owner,
    properties,
    reset,
  } = useOnboardingStore();

  const duration = session.duration ? formatDuration(session.duration) : null;

  const handleNewOnboarding = () => {
    reset();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto">
      {/* Success animation */}
      <div
        className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6"
      >
        <CheckCircle className="w-12 h-12 text-green-500" />
      </div>

      <div
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          Submitted Successfully! 🎉
        </h1>
        <p className="text-gray-500 text-sm">
          {owner.name}&apos;s PG data has been saved to Picapool.
        </p>
      </div>

      {/* IDs card */}
      <div
        className="w-full bg-brand-light/40 border border-brand/10 rounded-2xl p-5 flex flex-col gap-4 mb-6"
      >
        {submissionDisplayId && (
          <div className="flex items-center gap-3">
            <Hash className="w-4 h-4 text-brand flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Submission ID</p>
              <p className="font-bold text-gray-900 font-mono">{submissionDisplayId}</p>
            </div>
          </div>
        )}

        {ownerDisplayId && (
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-brand rounded flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[8px] font-bold">O</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Owner ID</p>
              <p className="font-bold text-gray-900 font-mono">{ownerDisplayId}</p>
            </div>
          </div>
        )}

        {propertyDisplayIds.map((id, i) => (
          <div key={id} className="flex items-center gap-3">
            <div className="w-4 h-4 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 text-[8px] font-bold">P</span>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {properties[i]?.name || `Property ${i + 1}`}
              </p>
              <p className="font-bold text-gray-900 font-mono">{id}</p>
            </div>
          </div>
        ))}

        {duration && (
          <div className="flex items-center gap-3 pt-2 border-t border-brand/10">
            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-500">Time taken</p>
              <p className="font-semibold text-gray-700">{duration}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        className="w-full flex flex-col gap-3"
      >
        <button
          id="btn-new-onboarding"
          type="button"
          onClick={handleNewOnboarding}
          className="w-full flex items-center justify-center gap-2 h-14 bg-brand text-white rounded-2xl font-bold text-base transition-all hover:bg-brand/90 active:scale-[0.98] shadow-lg shadow-brand/25"
        >
          <Plus className="w-5 h-5" />
          Onboard Another Owner
        </button>

        <button
          id="btn-go-home"
          type="button"
          onClick={() => router.push('/')}
          className="w-full flex items-center justify-center gap-2 h-14 border border-gray-200 text-gray-600 rounded-2xl font-semibold text-base hover:bg-gray-50 active:scale-[0.98] transition-all"
        >
          <Home className="w-5 h-5" />
          Go to Home
        </button>

        <button
          id="btn-dashboard"
          type="button"
          onClick={() => router.push('/dashboard')}
          className="w-full text-center text-sm text-gray-400 hover:text-brand py-2 transition-colors"
        >
          View Today&apos;s Activity →
        </button>
      </div>
    </div>
  );
}
