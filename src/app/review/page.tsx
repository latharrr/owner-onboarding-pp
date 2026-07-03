'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { ReviewChecklist } from '@/components/onboarding/ReviewChecklist';
import { BottomNav } from '@/components/onboarding/BottomNav';
import type { ReviewItem } from '@/types/onboarding';

function buildReviewItems(property: ReturnType<typeof useOnboardingStore.getState>['properties'][0], idx: number): ReviewItem[] {
  const base = `/onboarding/property/${idx}`;
  return [
    {
      id: 'name',
      label: 'PG Name',
      status: property.name ? 'complete' : 'missing',
      value: property.name,
      stepPath: `${base}/identity`,
    },
    {
      id: 'address',
      label: 'Address',
      status: property.address && property.pincode ? 'complete' : 'missing',
      value: property.address ? `${property.locality}, ${property.city}` : undefined,
      stepPath: `${base}/identity`,
    },
    {
      id: 'maps',
      label: 'Google Maps Link',
      status: property.googleMapsLink ? 'complete' : 'optional',
      value: property.googleMapsLink ? 'Provided' : undefined,
      stepPath: `${base}/identity`,
    },
    {
      id: 'audience',
      label: 'PG Type',
      status: property.pgType ? 'complete' : 'missing',
      value: property.pgType,
      stepPath: `${base}/audience`,
    },
    {
      id: 'capacity',
      label: 'Capacity',
      status: property.totalRooms > 0 && property.totalBeds > 0 ? 'complete' : 'missing',
      value: property.totalRooms > 0 ? `${property.totalRooms} rooms · ${property.totalBeds} beds` : undefined,
      stepPath: `${base}/capacity`,
    },
    {
      id: 'rooms',
      label: 'Room Configurations',
      status: property.roomConfigs.length > 0 ? 'complete' : 'missing',
      value: property.roomConfigs.length > 0 ? `${property.roomConfigs.length} config(s)` : undefined,
      stepPath: `${base}/rooms`,
    },
    {
      id: 'rent',
      label: 'Rent Pricing',
      status: property.roomConfigs.some((r) => r.rentPerBed > 0) ? 'complete' : 'missing',
      value: property.roomConfigs.some((r) => r.rentPerBed > 0)
        ? `₹${Math.min(...property.roomConfigs.map((r) => r.rentPerBed))} onwards`
        : undefined,
      stepPath: `${base}/rooms`,
    },
    {
      id: 'deposit',
      label: 'Security Deposit',
      status: property.securityDeposit > 0 ? 'complete' : 'missing',
      value: property.securityDeposit > 0 ? `₹${property.securityDeposit.toLocaleString('en-IN')}` : undefined,
      stepPath: `${base}/financials`,
    },
    {
      id: 'amenities',
      label: 'Amenities',
      status: property.amenities.length > 0 ? 'complete' : 'optional',
      value: property.amenities.length > 0 ? `${property.amenities.length} selected` : undefined,
      stepPath: `${base}/amenities`,
    },
    {
      id: 'availability',
      label: 'Availability',
      status: 'complete',
      value: property.immediateJoining ? 'Immediate joining' : `From ${property.availableFrom}`,
      stepPath: `${base}/availability`,
    },
  ];
}

export default function ReviewPage() {
  const router = useRouter();
  const { owner, properties, session, endSession, setSubmitted } = useOnboardingStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allReviewItems = properties.map((p, i) => ({
    property: p,
    items: buildReviewItems(p, i),
  }));

  const hasCriticalMissing = allReviewItems.some(({ items }) =>
    items.some((item) => item.status === 'missing')
  );

  const handleSubmit = async () => {
    if (hasCriticalMissing) {
      toast.error('Please fix the missing fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    endSession();

    const payload = {
      session: useOnboardingStore.getState().session,
      owner,
      properties,
    };

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(data.data);
        toast.success('Submitted successfully!');
        router.push('/success');
      } else {
        throw new Error(data.error ?? 'Submission failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg + ' — data is saved locally, try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Review Before Submitting</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {properties.length} {properties.length === 1 ? 'property' : 'properties'} · {owner.name}
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-32 flex flex-col gap-8">
        {/* Owner summary */}
        <div
          className="p-4 bg-brand-light/40 rounded-2xl border border-brand/10"
        >
          <p className="text-sm font-bold text-gray-800">{owner.name}</p>
          <p className="text-xs text-gray-500 mt-0.5">+91 {owner.phone}</p>
          {owner.address && <p className="text-xs text-gray-400 mt-1">{owner.address}</p>}
        </div>

        {/* Warning banner */}
        {hasCriticalMissing && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Missing required fields</p>
              <p className="text-xs text-red-500 mt-0.5">
                Fix the ⚠ items below before submitting.
              </p>
            </div>
          </div>
        )}

        {/* Property checklists */}
        {allReviewItems.map(({ property, items }, i) => (
          <div
            key={property.propertyId}
          >
            <ReviewChecklist
              items={items}
              propertyName={property.name || `Property ${i + 1}`}
            />
          </div>
        ))}

        {/* All clear */}
        {!hasCriticalMissing && (
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <p className="font-semibold text-green-700 text-sm">
              All required fields are complete. Ready to submit!
            </p>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4 max-w-2xl mx-auto">
        <div className="flex gap-3">
          <button
            id="btn-back-to-summary"
            type="button"
            onClick={() => router.push('/onboarding/owner-summary')}
            className="px-5 py-3 rounded-2xl border border-gray-200 text-gray-600 font-medium text-sm min-h-[52px]"
          >
            ← Back
          </button>
          <button
            id="btn-submit"
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || hasCriticalMissing}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-2xl font-bold text-sm transition-all hover:bg-brand/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] shadow-lg shadow-brand/25"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit to Picapool
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
