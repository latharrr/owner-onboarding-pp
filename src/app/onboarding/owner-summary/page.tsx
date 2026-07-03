'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Edit2, Plus, Phone, Mail, MapPin, CheckCircle } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { VISIT_STATUS_OPTIONS } from '@/lib/constants/visitStatus';

export default function OwnerSummaryPage() {
  const router = useRouter();
  const { owner, addProperty, properties } = useOnboardingStore();

  const visitStatus = VISIT_STATUS_OPTIONS.find((v) => v.id === owner.visitStatus);

  const handleAddProperty = () => {
    addProperty();
    const propIdx = properties.length; // will be the new property index
    router.push(`/onboarding/property/${propIdx}/identity`);
  };

  return (
    <>
      <StepWrapper
        title="Owner Saved ✓"
        subtitle="Review the owner details before adding their properties."
      >
        {/* Owner card */}
        <div
          className="rounded-2xl border border-gray-200 overflow-hidden"
        >
          {/* Status header */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-light/40">
            <div className="flex items-center gap-2">
              <span className="text-base">{visitStatus?.icon}</span>
              <span className="text-sm font-semibold text-gray-800">{visitStatus?.label}</span>
            </div>
            <button
              id="btn-edit-owner"
              type="button"
              onClick={() => router.push('/onboarding/owner')}
              className="flex items-center gap-1 text-xs text-brand font-medium hover:underline"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>

          {/* Details */}
          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand/10 rounded-xl flex items-center justify-center">
                <span className="text-brand font-bold text-base">
                  {(owner.name ?? 'O').charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{owner.name}</p>
                <p className="text-xs text-gray-500">Owner</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                +91 {owner.phone}
                {owner.altPhone && <span className="text-gray-400">· +91 {owner.altPhone}</span>}
              </div>
              {owner.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {owner.email}
                </div>
              )}
              {owner.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                  {owner.address}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Existing properties */}
        {properties.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Properties Added
            </p>
            {properties.map((prop, i) => (
              <button
                key={prop.propertyId}
                id={`btn-property-${i}`}
                type="button"
                onClick={() => router.push(`/onboarding/property/${i}/identity`)}
                className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-100 rounded-2xl text-left"
              >
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">
                    {prop.name || `Property ${i + 1}`}
                  </p>
                  {prop.locality && (
                    <p className="text-xs text-gray-500">{prop.locality}, {prop.city}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Add property CTA */}
        <button
          id="btn-add-property"
          type="button"
          onClick={handleAddProperty}
          className="flex items-center justify-center gap-2 w-full h-14 bg-brand text-white rounded-2xl font-bold text-base transition-all hover:bg-brand/90 active:scale-[0.98] shadow-sm shadow-brand/25"
        >
          <Plus className="w-5 h-5" />
          Add a Property
        </button>

        {properties.length > 0 && (
          <button
            id="btn-go-to-review"
            type="button"
            onClick={() => router.push('/review')}
            className="w-full text-center text-sm text-gray-500 hover:text-brand py-2"
          >
            Review & Submit →
          </button>
        )}
      </StepWrapper>

      <BottomNav
        backHref="/onboarding/owner"
        showBack
        onNext={handleAddProperty}
        nextLabel="Add Property"
        showSkip={properties.length > 0}
        onSkip={() => router.push('/review')}
        skipLabel="Go to Review"
      />
    </>
  );
}
