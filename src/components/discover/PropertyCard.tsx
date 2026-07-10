'use client';

import Link from 'next/link';
import { MapPin, Star, Phone, MessageCircle, Navigation, Bookmark, Check } from 'lucide-react';
import type { JoinedProperty } from '@/types/discovery';
import { rentRangeLabel, genderLabel } from '@/lib/discover/format';

interface PropertyCardProps {
  property: JoinedProperty;
  compareChecked: boolean;
  onToggleCompare: () => void;
  saved: boolean;
  onToggleSave: () => void;
}

const GENDER_BADGE_STYLE: Record<string, string> = {
  female: 'bg-pink-50 text-pink-600',
  male: 'bg-blue-50 text-blue-600',
  unisex: 'bg-purple-50 text-purple-600',
};

export function PropertyCard({ property, compareChecked, onToggleCompare, saved, onToggleSave }: PropertyCardProps) {
  const roomTypeLabels = Array.from(new Set(property.roomConfigs.map((r) => r.type)));
  const waMessage = encodeURIComponent(
    `Hi, I found ${property.name} (${property.displayId}) on Picapool and I'm interested.`
  );

  return (
    <div className="rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 hover:border-brand/40 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-gray-900 truncate">{property.name}</h3>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${GENDER_BADGE_STYLE[property.pgType] ?? 'bg-gray-100 text-gray-600'}`}>
              {genderLabel(property.pgType)}
            </span>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {[property.locality, property.city].filter(Boolean).join(', ') || 'Location not available'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleSave}
          aria-label={saved ? 'Unsave' : 'Save'}
          className={`p-2 rounded-xl shrink-0 ${saved ? 'bg-brand-light text-brand' : 'bg-gray-50 text-gray-400'}`}
        >
          <Bookmark className="w-4 h-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-gray-900">
          {rentRangeLabel(property.minRent, property.maxRent)}
          <span className="text-xs font-medium text-gray-400"> /bed/mo</span>
        </p>
        {property.internRating > 0 && (
          <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
            <Star className="w-3.5 h-3.5" fill="currentColor" />
            {property.internRating}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {roomTypeLabels.slice(0, 3).map((t) => (
          <span key={t} className="text-[11px] font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-600 capitalize">
            {t}
          </span>
        ))}
        {property.foodProvided && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-green-50 text-green-700">Food</span>
        )}
        {property.immediateJoining && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-brand-light text-brand">Immediate joining</span>
        )}
        {property.lockInPeriod === 0 && (
          <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-gray-50 text-gray-600">No lock-in</span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{property.currentVacancies > 0 ? `${property.currentVacancies} vacancies` : 'Contact for vacancy'}</span>
        <span>{property.displayId}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <a
          href={`tel:${property.ownerPhone}`}
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gray-900 text-white text-xs font-semibold"
        >
          <Phone className="w-3.5 h-3.5" /> Call
        </a>
        <a
          href={`https://wa.me/91${property.ownerPhone.replace(/\D/g, '').slice(-10)}?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-green-50 text-green-700 text-xs font-semibold"
        >
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </a>
        {property.googleMapsLink && (
          <a
            href={property.googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-500 shrink-0"
            aria-label="Open in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onToggleCompare}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            compareChecked ? 'border-brand bg-brand-light text-brand' : 'border-gray-200 text-gray-500'
          }`}
        >
          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${compareChecked ? 'bg-brand border-brand' : 'border-gray-300'}`}>
            {compareChecked && <Check className="w-2.5 h-2.5 text-white" />}
          </span>
          Compare
        </button>
        <Link href={`/discover/property/${property.displayId}`} className="text-xs font-semibold text-brand">
          View details →
        </Link>
      </div>
    </div>
  );
}
