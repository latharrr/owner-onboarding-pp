// ============================================================
// AI PG Discovery — NL intent parsing + JS filtering engine
// ============================================================
// No embeddings, no vector DBs. Natural language queries are turned
// into structured filters with plain regex/keyword rules, then those
// filters run as ordinary JS array operations over the joined
// property list. Only the properties that survive filtering are ever
// sent to Groq.

import { NORTH_CAMPUS_LOCALITIES } from '@/lib/constants/localities';
import type { JoinedProperty, ParsedFilters, SortIntent } from '@/types/discovery';

// ── Locality / landmark knowledge ─────────────────────────────
// This deployment only covers DU North Campus, so "North Campus" /
// "DU" match every listing rather than narrowing anything. Named
// colleges are mapped to their nearest covered localities — a
// best-effort heuristic that only ever affects which candidates get
// *considered*; the actual locality shown to the user always comes
// straight from the sheet, so nothing is ever fabricated.
const KNOWN_LOCALITIES = NORTH_CAMPUS_LOCALITIES.map((l) => l.label.toLowerCase());

const WILDCARD_LOCALITY_TERMS = new Set(['north campus', 'du', 'delhi university']);

const LANDMARK_ALIASES: Record<string, string[]> = {
  'hindu college': ['malkaganj', 'bungalow road', 'kamla nagar'],
  'kirori mal': ['bungalow road', 'malkaganj'],
  'kirori mal college': ['bungalow road', 'malkaganj'],
  hansraj: ['malkaganj', 'bungalow road'],
  'hansraj college': ['malkaganj', 'bungalow road'],
  ramjas: ['mukherjee nagar', 'malkaganj', 'north campus'],
  'ramjas college': ['mukherjee nagar', 'malkaganj'],
  'miranda house': ['bungalow road', 'roop nagar'],
  stephens: ['kamla nagar', 'roop nagar'],
  "st stephen's": ['kamla nagar', 'roop nagar'],
  metro: ['gtb nagar', 'vijay nagar'],
  'gtb nagar metro': ['gtb nagar'],
  'vishwavidyalaya metro': ['kamla nagar', 'malkaganj'],
};

// ── Amenity keyword -> canonical amenity id (see lib/constants/amenities.ts) ─
const AMENITY_KEYWORDS: { id: string; keywords: string[] }[] = [
  { id: 'wifi', keywords: ['wifi', 'wi-fi', 'internet'] },
  { id: 'power_backup', keywords: ['power backup', 'inverter backup', 'backup power'] },
  { id: 'geyser', keywords: ['geyser', 'hot water'] },
  { id: 'attached_bathroom', keywords: ['attached washroom', 'attached bathroom', 'attached toilet', 'private washroom'] },
  { id: 'laundry', keywords: ['laundry'] },
  { id: 'washing_machine', keywords: ['washing machine'] },
  { id: 'cctv', keywords: ['cctv', 'camera surveillance'] },
  { id: 'security_guard', keywords: ['security guard', '24x7 security', 'security'] },
  { id: 'biometric', keywords: ['biometric'] },
  { id: 'lockers', keywords: ['locker'] },
  { id: 'ro_water', keywords: ['ro water', 'purified water'] },
  { id: 'cooking_allowed', keywords: ['cooking allowed', 'kitchen'] },
  { id: 'gym', keywords: ['gym', 'fitness'] },
  { id: 'housekeeping', keywords: ['housekeeping'] },
  { id: 'study_room', keywords: ['study room', 'study friendly'] },
  { id: 'elevator', keywords: ['elevator', 'lift'] },
  { id: 'terrace', keywords: ['terrace'] },
  { id: 'parking', keywords: ['parking'] }, // matches either parking_two_wheeler or parking_four_wheeler
];

function amountFromMatch(raw: string, kSuffix: string | undefined): number {
  const n = Number(raw.replace(/,/g, ''));
  if (!Number.isFinite(n)) return 0;
  return kSuffix ? n * 1000 : n;
}

const RUPEE = '(?:₹|rs\\.?|inr)?';
const NUMBER = '([\\d,]+(?:\\.\\d+)?)\\s*(k)?';

/**
 * Parses a free-text query into structured filters. Pure rule-based —
 * regex + keyword lookups, no ML/embeddings.
 */
export function parseQuery(query: string): ParsedFilters {
  const lower = query.toLowerCase();

  const filters: ParsedFilters = {
    localityTerms: [],
    amenityTerms: [],
    sort: 'relevance',
    compareIntent: false,
    nameHints: [],
  };

  // Gender / audience
  if (/\b(girls?|female|ladies|women)\b/.test(lower)) filters.gender = 'female';
  else if (/\b(boys?|male|gents|men)\b/.test(lower)) filters.gender = 'male';
  else if (/\b(co-?living|unisex)\b/.test(lower)) filters.gender = 'unisex';

  // Budget: "under 12000", "below ₹15k", "within 10000", "upto 12k"
  const maxMatch = lower.match(new RegExp(`(?:under|below|less than|within|up ?to|max(?:imum)?)\\s*${RUPEE}\\s*${NUMBER}`));
  if (maxMatch) filters.maxRent = amountFromMatch(maxMatch[1], maxMatch[2]);

  const minMatch = lower.match(new RegExp(`(?:above|over|more than|starting from|min(?:imum)?)\\s*${RUPEE}\\s*${NUMBER}`));
  if (minMatch) filters.minRent = amountFromMatch(minMatch[1], minMatch[2]);

  const betweenMatch = lower.match(new RegExp(`between\\s*${RUPEE}\\s*${NUMBER}\\s*(?:and|-|to)\\s*${RUPEE}\\s*${NUMBER}`));
  if (betweenMatch) {
    filters.minRent = amountFromMatch(betweenMatch[1], betweenMatch[2]);
    filters.maxRent = amountFromMatch(betweenMatch[3], betweenMatch[4]);
  }

  // Locality / landmarks
  for (const locality of KNOWN_LOCALITIES) {
    if (lower.includes(locality)) filters.localityTerms.push(locality);
  }
  for (const landmark of Object.keys(LANDMARK_ALIASES)) {
    if (lower.includes(landmark)) filters.localityTerms.push(landmark);
  }
  for (const wildcard of WILDCARD_LOCALITY_TERMS) {
    if (lower.includes(wildcard)) filters.localityTerms.push(wildcard);
  }
  const nearMatch = lower.match(/(?:near|close to|around|next to)\s+([a-z0-9 ]{3,30})/);
  if (nearMatch) {
    const phrase = nearMatch[1].split(/\b(pg|with|under|above|and|having|that|which)\b/)[0].trim();
    if (phrase && !filters.localityTerms.includes(phrase)) filters.localityTerms.push(phrase);
  }

  // Room type / sharing
  if (/\b(single sharing|single room|private room|single occupancy)\b/.test(lower)) filters.roomType = 'single';
  else if (/\bdouble\b/.test(lower)) filters.roomType = 'double';
  else if (/\btriple\b/.test(lower)) filters.roomType = 'triple';
  else if (/\bquad\b/.test(lower)) filters.roomType = 'quad';
  else if (/\bsingle\b/.test(lower)) filters.roomType = 'single';

  // AC — check "non ac" before bare "ac"
  if (/\bnon[\s-]?ac\b|\bwithout ac\b/.test(lower)) filters.acType = 'non_ac';
  else if (/\bac\b/.test(lower)) filters.acType = 'ac';

  // Furnishing
  if (/\b(fully|full)\s*furnished\b/.test(lower)) filters.furnishing = 'fully_furnished';
  else if (/\bsemi\s*furnished\b/.test(lower)) filters.furnishing = 'semi_furnished';
  else if (/\bunfurnished\b/.test(lower)) filters.furnishing = 'unfurnished';

  // Food
  if (/\b(food included|with food|food provided|meals? included|mess included)\b/.test(lower)) filters.foodRequired = true;
  if (/\b(veg only|vegetarian only|pure veg)\b/.test(lower)) filters.vegOnly = true;
  const meals: ('breakfast' | 'lunch' | 'dinner')[] = [];
  if (/\bbreakfast\b/.test(lower)) meals.push('breakfast');
  if (/\blunch\b/.test(lower)) meals.push('lunch');
  if (/\bdinner\b/.test(lower)) meals.push('dinner');
  if (meals.length) filters.mealsRequired = meals;

  // Policies
  if (/\b(immediate joining|join immediately|available now|move in now|available immediately)\b/.test(lower)) {
    filters.immediateJoining = true;
  }
  if (/\bno lock-?in\b|\bwithout lock-?in\b/.test(lower)) filters.noLockIn = true;
  if (/\bno smoking\b|\bsmoke[\s-]?free\b/.test(lower)) filters.noSmoking = true;
  if (/\bguests? allowed\b/.test(lower)) filters.guestAllowed = true;
  if (/\b(low|no) deposit\b/.test(lower)) filters.lowDeposit = true;
  if (/\blow token\b/.test(lower)) filters.lowToken = true;
  if (/\b(high rating|top rated|best rated|highly rated)\b/.test(lower)) filters.highRating = true;

  // Amenities
  for (const { id, keywords } of AMENITY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) filters.amenityTerms.push(id);
  }

  // Sort / ranking intent
  filters.sort = detectSortIntent(lower);

  // Compare intent + candidate property-name fragments (from the ORIGINAL,
  // case-preserved query — names are usually capitalized).
  filters.compareIntent = /\bcompare\b|\bvs\.?\b|\bversus\b/.test(lower);
  const nameMatches = query.match(/\b([A-Z][a-zA-Z']*(?:\s+[A-Z][a-zA-Z']*)+)\b/g);
  if (nameMatches) filters.nameHints = Array.from(new Set(nameMatches.map((s) => s.trim())));

  return filters;
}

function detectSortIntent(lower: string): SortIntent {
  if (/\bcheapest\b|\blowest price\b|\bcheap\b/.test(lower)) return 'cheapest';
  if (/\bbest value\b|\bvalue for money\b/.test(lower)) return 'value';
  if (/\bpremium\b|\bmost expensive\b|\bluxury\b|\btop end\b/.test(lower)) return 'premium';
  if (/\bhigh rating\b|\btop rated\b|\bbest rated\b/.test(lower)) return 'rating';
  return 'relevance';
}

// ── Amenity / locality matching helpers ───────────────────────
function hasAmenity(property: JoinedProperty, token: string): boolean {
  if (token === 'parking') return property.amenities.some((a) => a.startsWith('parking'));
  return property.amenities.includes(token);
}

function matchesLocality(property: JoinedProperty, terms: string[]): boolean {
  const haystack = `${property.locality} ${property.address} ${property.city}`.toLowerCase();
  return terms.some((term) => {
    if (WILDCARD_LOCALITY_TERMS.has(term)) return true;
    if (haystack.includes(term)) return true;
    const aliases = LANDMARK_ALIASES[term];
    return aliases ? aliases.some((a) => haystack.includes(a)) : false;
  });
}

const LOW_DEPOSIT_THRESHOLD = 10000;
const LOW_TOKEN_THRESHOLD = 2000;
const HIGH_RATING_THRESHOLD = 4;

interface MatchOptions {
  locality: boolean;
  amenities: boolean;
  rent: boolean;
}

function matchesFilters(property: JoinedProperty, filters: ParsedFilters, opts: MatchOptions): boolean {
  if (filters.gender && property.pgType !== filters.gender && property.pgType !== 'unisex') return false;
  if (filters.roomType && !property.roomConfigs.some((r) => r.type === filters.roomType)) return false;
  if (filters.acType && !property.roomConfigs.some((r) => r.acType === filters.acType)) return false;
  if (filters.furnishing && !property.roomConfigs.some((r) => r.furnishing === filters.furnishing)) return false;
  if (filters.immediateJoining && !property.immediateJoining) return false;
  if (filters.noLockIn && property.lockInPeriod > 0) return false;
  if (filters.noSmoking && !property.noSmoking) return false;
  if (filters.guestAllowed && property.guestPolicy === 'not_allowed') return false;
  if (filters.foodRequired && !property.foodProvided) return false;
  if (filters.vegOnly && property.mealPreference && property.mealPreference !== 'veg_only') return false;
  if (filters.mealsRequired?.length) {
    const mealsHaystack = property.mealsList.join(' ').toLowerCase();
    if (!filters.mealsRequired.every((m) => mealsHaystack.includes(m))) return false;
  }
  if (filters.lowDeposit && property.securityDeposit > LOW_DEPOSIT_THRESHOLD) return false;
  if (filters.lowToken && property.tokenAmount > LOW_TOKEN_THRESHOLD) return false;
  if (filters.highRating && property.internRating < HIGH_RATING_THRESHOLD) return false;

  if (opts.rent) {
    if (filters.maxRent && property.minRent > 0 && property.minRent > filters.maxRent) return false;
    if (filters.minRent && property.maxRent > 0 && property.maxRent < filters.minRent) return false;
  }
  if (opts.locality && filters.localityTerms.length && !matchesLocality(property, filters.localityTerms)) {
    return false;
  }
  if (opts.amenities && filters.amenityTerms.length && !filters.amenityTerms.every((t) => hasAmenity(property, t))) {
    return false;
  }

  return true;
}

function sortProperties(properties: JoinedProperty[], sort: SortIntent): JoinedProperty[] {
  const withFallback = (n: number, fallback: number) => (n > 0 ? n : fallback);
  const copy = [...properties];

  switch (sort) {
    case 'cheapest':
      return copy.sort((a, b) => withFallback(a.minRent, Infinity) - withFallback(b.minRent, Infinity));
    case 'premium':
      return copy.sort((a, b) => withFallback(b.maxRent, 0) - withFallback(a.maxRent, 0));
    case 'rating':
      return copy.sort((a, b) => b.internRating - a.internRating || a.minRent - b.minRent);
    case 'value':
      return copy.sort((a, b) => {
        const valueA = (a.internRating || 3) / Math.max(a.minRent, 1);
        const valueB = (b.internRating || 3) / Math.max(b.minRent, 1);
        return valueB - valueA;
      });
    case 'relevance':
    default:
      return copy.sort(
        (a, b) => b.internRating - a.internRating || b.currentVacancies - a.currentVacancies || a.minRent - b.minRent
      );
  }
}

export interface FilterOutcome {
  properties: JoinedProperty[];
  relaxed: boolean;
}

/**
 * Filters + ranks the joined property list against parsed filters.
 * Falls back progressively (dropping the "soft" filters — locality,
 * amenities, rent — before the structural ones) rather than returning
 * a hard empty result, and always tells the caller whether it relaxed.
 */
export function filterProperties(properties: JoinedProperty[], filters: ParsedFilters): FilterOutcome {
  let matched = properties.filter((p) => matchesFilters(p, filters, { locality: true, amenities: true, rent: true }));
  let relaxed = false;

  if (matched.length === 0) {
    matched = properties.filter((p) => matchesFilters(p, filters, { locality: false, amenities: true, rent: true }));
    relaxed = true;
  }
  if (matched.length === 0) {
    matched = properties.filter((p) => matchesFilters(p, filters, { locality: false, amenities: false, rent: true }));
    relaxed = true;
  }
  if (matched.length === 0) {
    matched = properties.filter((p) => matchesFilters(p, filters, { locality: false, amenities: false, rent: false }));
    relaxed = true;
  }

  // Compare intent: pull in named properties even if they fell outside the filters.
  if (filters.compareIntent && filters.nameHints.length) {
    const alreadyIn = new Set(matched.map((p) => p.propertyId));
    const named = properties.filter(
      (p) =>
        !alreadyIn.has(p.propertyId) &&
        filters.nameHints.some((hint) => p.name.toLowerCase().includes(hint.toLowerCase()))
    );
    matched = [...named, ...matched];
  }

  return { properties: sortProperties(matched, filters.sort), relaxed };
}
