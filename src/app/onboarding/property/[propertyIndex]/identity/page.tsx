'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { propertyIdentitySchema, type PropertyIdentityFormData } from '@/lib/validations/property.schema';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Link } from 'lucide-react';

export default function PropertyIdentityPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty, currentPropertyIndex, setCurrentPropertyIndex } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('identity', 'Property Identity');

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<PropertyIdentityFormData>({
    resolver: zodResolver(propertyIdentitySchema),
    defaultValues: {
      name: property?.name ?? '',
      address: property?.address ?? '',
      locality: property?.locality ?? '',
      city: property?.city ?? '',
      pincode: property?.pincode ?? '',
      googleMapsLink: property?.googleMapsLink ?? '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    setCurrentPropertyIndex(idx);
    analytics.onStepStart();
  }, [idx]); // eslint-disable-line

  const onSubmit = (data: PropertyIdentityFormData) => {
    updateProperty(idx, data);
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/audience`);
  };

  return (
    <>
      <StepWrapper
        title={`Property ${idx + 1} Details`}
        subtitle="Name, address and how to find it"
      >
        <form id="identity-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pg-name" className="text-sm font-semibold text-gray-700">
              PG Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="pg-name"
              {...register('name')}
              placeholder="e.g. Sunrise PG for Girls"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pg-address" className="text-sm font-semibold text-gray-700">
              Full Address <span className="text-red-400">*</span>
            </Label>
            <Input
              id="pg-address"
              {...register('address')}
              placeholder="Building, Street, Landmark"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pg-locality" className="text-sm font-semibold text-gray-700">
                Area / Locality <span className="text-red-400">*</span>
              </Label>
              <Input
                id="pg-locality"
                {...register('locality')}
                placeholder="e.g. Koramangala"
                className="h-14 text-base rounded-2xl border-gray-200 px-4"
              />
              {errors.locality && <p className="text-xs text-red-500">{errors.locality.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pg-city" className="text-sm font-semibold text-gray-700">
                City <span className="text-red-400">*</span>
              </Label>
              <Input
                id="pg-city"
                {...register('city')}
                placeholder="e.g. Bengaluru"
                className="h-14 text-base rounded-2xl border-gray-200 px-4"
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pg-pincode" className="text-sm font-semibold text-gray-700">
              Pincode <span className="text-red-400">*</span>
            </Label>
            <Input
              id="pg-pincode"
              {...register('pincode')}
              placeholder="6-digit pincode"
              className="h-14 text-base rounded-2xl border-gray-200 px-4"
              maxLength={6}
              inputMode="numeric"
            />
            {errors.pincode && <p className="text-xs text-red-500">{errors.pincode.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pg-maps" className="text-sm font-semibold text-gray-700">
              Google Maps Link <span className="text-gray-400 font-normal">(optional but highly recommended)</span>
            </Label>
            <div className="relative">
              <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="pg-maps"
                {...register('googleMapsLink')}
                placeholder="maps.google.com/..."
                className="h-14 text-base rounded-2xl border-gray-200 pl-11 pr-4"
                type="url"
                inputMode="url"
              />
            </div>
            {errors.googleMapsLink && <p className="text-xs text-red-500">{errors.googleMapsLink.message}</p>}
          </div>
        </form>
      </StepWrapper>

      <BottomNav
        backHref="/onboarding/owner-summary"
        onNext={handleSubmit(onSubmit)}
        isNextDisabled={!isValid}
        nextLabel="Continue"
      />
    </>
  );
}
