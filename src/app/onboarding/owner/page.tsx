'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { ownerSchema, type OwnerFormData } from '@/lib/validations/owner.schema';
import { VISIT_STATUS_OPTIONS } from '@/lib/constants/visitStatus';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ToggleGroup } from '@/components/onboarding/ToggleGroup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DuplicateInfo {
  displayId: string;
  name: string;
  phone: string;
  createdAt: string;
}

export default function OwnerPage() {
  const router = useRouter();
  const { owner, updateOwner, setVisitStatus } = useOnboardingStore();
  const analytics = useStepAnalytics('owner', 'Owner Details');

  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicate, setDuplicate] = useState<DuplicateInfo | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OwnerFormData>({
    resolver: zodResolver(ownerSchema),
    defaultValues: {
      name: owner.name ?? '',
      phone: owner.phone ?? '',
      altPhone: owner.altPhone ?? '',
      email: owner.email ?? '',
      address: owner.address ?? '',
      visitStatus: owner.visitStatus ?? 'visited',
    },
    mode: 'onBlur',
  });

  const watchedPhone = watch('phone');
  const watchedVisitStatus = watch('visitStatus');

  useEffect(() => {
    analytics.onStepStart();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Duplicate check on valid phone
  useEffect(() => {
    if (!/^[6-9]\d{9}$/.test(watchedPhone)) {
      setDuplicate(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCheckingDuplicate(true);
      try {
        const res = await fetch('/api/check-duplicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: watchedPhone }),
        });
        const data = await res.json();
        if (data.success && data.data.isDuplicate) {
          setDuplicate(data.data.existingOwner);
        } else {
          setDuplicate(null);
        }
      } catch {
        // Silently swallow — never block the flow
      } finally {
        setIsCheckingDuplicate(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [watchedPhone]);

  const onSubmit = (data: OwnerFormData) => {
    updateOwner({
      name: data.name,
      phone: data.phone,
      altPhone: data.altPhone || undefined,
      email: data.email || undefined,
      address: data.address,
      visitStatus: data.visitStatus,
    });
    analytics.onStepComplete();
    router.push('/onboarding/owner-summary');
  };

  const visitStatusOptions = VISIT_STATUS_OPTIONS.map((v) => ({
    id: v.id,
    label: v.label,
    icon: v.icon,
    description: v.description,
  }));

  return (
    <>
      <StepWrapper
        title="Owner Details"
        subtitle="Basic information about the PG owner"
      >
        <form id="owner-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner-name" className="text-sm font-semibold text-gray-700">
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="owner-name"
              {...register('name')}
              placeholder="e.g. Rajesh Kumar"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner-phone" className="text-sm font-semibold text-gray-700">
              Mobile Number <span className="text-red-400">*</span>
            </Label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                +91
              </div>
              <Input
                id="owner-phone"
                {...register('phone')}
                type="tel"
                placeholder="10-digit mobile number"
                className="h-14 text-base rounded-2xl border-gray-200 pl-12 pr-4"
                maxLength={10}
                inputMode="numeric"
              />
              {isCheckingDuplicate && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
              )}
            </div>
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}

            {/* Duplicate warning */}
            {duplicate && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Owner already exists</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {duplicate.name} · {duplicate.displayId} · Added on{' '}
                    {new Date(duplicate.createdAt).toLocaleDateString('en-IN')}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      id="btn-continue-anyway"
                      type="button"
                      className="text-xs font-semibold text-amber-700 underline"
                      onClick={() => setDuplicate(null)}
                    >
                      Continue anyway
                    </button>
                    <span className="text-amber-400">·</span>
                    <button
                      id="btn-set-duplicate"
                      type="button"
                      className="text-xs font-semibold text-amber-700 underline"
                      onClick={() => {
                        setValue('visitStatus', 'duplicate');
                        setDuplicate(null);
                      }}
                    >
                      Mark as duplicate
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Alt Phone */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner-alt-phone" className="text-sm font-semibold text-gray-700">
              Alt. Number <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="owner-alt-phone"
              {...register('altPhone')}
              type="tel"
              placeholder="Alternate mobile number"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
              maxLength={10}
              inputMode="numeric"
            />
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner-email" className="text-sm font-semibold text-gray-700">
              Email <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="owner-email"
              {...register('email')}
              type="email"
              placeholder="owner@example.com"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
              inputMode="email"
            />
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="owner-address" className="text-sm font-semibold text-gray-700">
              Owner's Home Address <span className="text-red-400">*</span>
            </Label>
            <Input
              id="owner-address"
              {...register('address')}
              placeholder="Full address"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          {/* Visit Status */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-gray-700">
              Visit Status <span className="text-red-400">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {visitStatusOptions.map((opt) => (
                <button
                  key={opt.id}
                  id={`visit-status-${opt.id}`}
                  type="button"
                  onClick={() => setValue('visitStatus', opt.id as OwnerFormData['visitStatus'])}
                  className={`flex items-start gap-2 px-3 py-3 rounded-2xl border text-left text-sm font-medium transition-all ${
                    watchedVisitStatus === opt.id
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-brand/30'
                  }`}
                >
                  <span className="text-lg leading-none">{opt.icon}</span>
                  <div>
                    <div className="font-semibold text-xs">{opt.label}</div>
                    <div className={`text-xs mt-0.5 ${watchedVisitStatus === opt.id ? 'text-white/70' : 'text-gray-400'}`}>
                      {opt.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </form>
      </StepWrapper>

      <BottomNav
        backHref="/"
        onNext={handleSubmit(onSubmit)}
        isNextDisabled={!isValid}
        nextLabel="Save & Continue"
      />
    </>
  );
}
