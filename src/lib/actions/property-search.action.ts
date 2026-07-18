"use server";

import { propertyRepository } from "@/lib/supabase/property.repository";
import {
  EMPTY_SUGGESTIONS,
  type SearchSuggestions,
} from "@/types/property-search";

/**
 * Autocomplete suggestions for the property listing search bar.
 * Public + read-only; degrades to empty on any error so the UI never breaks.
 */
export async function getSearchSuggestions(
  query: string,
  scope?: string
): Promise<SearchSuggestions> {
  const q = (query ?? "").slice(0, 80);
  if (q.trim().length < 2) return EMPTY_SUGGESTIONS;
  try {
    return await propertyRepository.searchSuggestions(q, scope || undefined);
  } catch {
    return EMPTY_SUGGESTIONS;
  }
}
