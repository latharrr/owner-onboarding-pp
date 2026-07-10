// ============================================================
// AI PG Discovery — shared formatting helpers (client + server safe)
// ============================================================

export function formatINR(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function rentRangeLabel(min: number, max: number): string {
  if (!min && !max) return 'Price not available';
  if (min === max || !max) return formatINR(min);
  return `${formatINR(min)} - ${formatINR(max)}`;
}

export function labelize(s: string): string {
  if (!s) return s;
  const spaced = s.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function genderLabel(pgType: string): string {
  if (pgType === 'female') return 'Girls PG';
  if (pgType === 'male') return 'Boys PG';
  return 'Co-living';
}
