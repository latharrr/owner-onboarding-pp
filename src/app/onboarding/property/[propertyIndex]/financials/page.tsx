'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useOnboardingStore } from '@/lib/store/onboarding-store';
import { useStepAnalytics } from '@/lib/hooks/useStepAnalytics';
import { StepWrapper } from '@/components/onboarding/StepWrapper';
import { BottomNav } from '@/components/onboarding/BottomNav';
import { ToggleGroup } from '@/components/onboarding/ToggleGroup';
import { Stepper } from '@/components/onboarding/Stepper';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { ElectricityBilling } from '@/types/onboarding';

const ELECTRICITY_OPTIONS = [
  { id: 'included', label: 'Included in Rent', icon: '✅' },
  { id: 'fixed', label: 'Fixed Amount', icon: '📋', description: 'Per person per month' },
  { id: 'metered', label: 'Metered Units', icon: '⚡', description: 'Based on actual usage' },
];

export default function FinancialsPage() {
  const router = useRouter();
  const { propertyIndex } = useParams();
  const idx = Number(propertyIndex);

  const { properties, updateProperty } = useOnboardingStore();
  const property = properties[idx];
  const analytics = useStepAnalytics('financials', 'Financials');

  useEffect(() => { analytics.onStepStart(); }, []); // eslint-disable-line

  const handleNext = () => {
    analytics.onStepComplete();
    router.push(`/onboarding/property/${idx}/availability`);
  };

  return (
    <>
      <StepWrapper title="Financials" subtitle="Deposits, electricity and maintenance">
        {/* Maintenance */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
          <div>
            <p className="font-semibold text-gray-800">Maintenance Included</p>
            <p className="text-xs text-gray-500">Water, cleaning, common area</p>
          </div>
          <Switch
            id="maintenance-included"
            checked={property?.maintenanceIncluded ?? true}
            onCheckedChange={(v) => updateProperty(idx, { maintenanceIncluded: v })}
          />
        </div>

        {/* Electricity */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-gray-700">Electricity Billing</Label>
          <ToggleGroup
            options={ELECTRICITY_OPTIONS}
            value={property?.electricityBilling ?? null}
            onChange={(v) => updateProperty(idx, { electricityBilling: v as ElectricityBilling })}
            layout="column"
            size="md"
          />
          {property?.electricityBilling === 'fixed' && (
            <Stepper
              label="Fixed Electricity Amount"
              value={property?.fixedElectricityAmount ?? 0}
              onChange={(v) => updateProperty(idx, { fixedElectricityAmount: v })}
              min={0}
              max={5000}
              step={50}
              prefix="₹"
              size="sm"
            />
          )}
        </div>

        {/* Security Deposit */}
        <Stepper
          label="Security Deposit"
          value={property?.securityDeposit ?? 0}
          onChange={(v) => updateProperty(idx, { securityDeposit: v })}
          min={0}
          max={200000}
          step={1000}
          prefix="₹"
          size="md"
        />

        {/* Token Amount */}
        <Stepper
          label="Token Amount (optional)"
          value={property?.tokenAmount ?? 0}
          onChange={(v) => updateProperty(idx, { tokenAmount: v })}
          min={0}
          max={50000}
          step={500}
          prefix="₹"
          size="sm"
        />
      </StepWrapper>

      <BottomNav
        backHref={`/onboarding/property/${idx}/rules`}
        onNext={handleNext}
      />
    </>
  );
}