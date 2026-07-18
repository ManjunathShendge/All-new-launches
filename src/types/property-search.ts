export interface PropertySuggestion {
  id: number;
  slug: string;
  title: string;
  city: string | null;
  locality: string | null;
}

export interface SearchSuggestions {
  properties: PropertySuggestion[];
  localities: string[];
  cities: string[];
}

export const EMPTY_SUGGESTIONS: SearchSuggestions = {
  properties: [],
  localities: [],
  cities: [],
};
