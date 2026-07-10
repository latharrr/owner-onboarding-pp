'use client';

import { useCallback, useState } from 'react';
import type { JoinedProperty, ParsedFilters } from '@/types/discovery';

interface PropertiesEventPayload {
  properties: JoinedProperty[];
  totalMatches: number;
  relaxed: boolean;
  filters: ParsedFilters;
}

type StreamEvent =
  | { type: 'properties'; payload: PropertiesEventPayload }
  | { type: 'token'; payload: string }
  | { type: 'error'; payload: string }
  | { type: 'done' };

export function useDiscoverySearch() {
  const [query, setQuery] = useState('');
  const [properties, setProperties] = useState<JoinedProperty[]>([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [relaxed, setRelaxed] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<ParsedFilters | null>(null);
  const [answer, setAnswer] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setQuery(trimmed);
    setIsSearching(true);
    setHasSearched(true);
    setAnswer('');
    setAiError(null);
    setDataError(null);

    try {
      const res = await fetch('/api/discover/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setDataError(body?.error || `Search failed (${res.status})`);
        return;
      }
      if (!res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (!jsonStr) continue;

          let evt: StreamEvent;
          try {
            evt = JSON.parse(jsonStr) as StreamEvent;
          } catch {
            continue;
          }

          if (evt.type === 'properties') {
            setProperties(evt.payload.properties);
            setTotalMatches(evt.payload.totalMatches);
            setRelaxed(evt.payload.relaxed);
            setAppliedFilters(evt.payload.filters);
          } else if (evt.type === 'token') {
            setAnswer((prev) => prev + evt.payload);
          } else if (evt.type === 'error') {
            setAiError(evt.payload);
          }
        }
      }
    } catch (err) {
      setDataError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  return {
    query,
    setQuery,
    properties,
    totalMatches,
    relaxed,
    appliedFilters,
    answer,
    aiError,
    dataError,
    isSearching,
    hasSearched,
    search,
  };
}
