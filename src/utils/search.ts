/**
 * Unified Search Utilities
 *
 * Provides consistent search/filter logic across:
 * - SkillListHeader filter inputs (local filtering)
 * - SearchOverlay (backend search)
 *
 * Search Rules:
 * - Minimum query length: 2 characters (configurable)
 * - Match fields: name, description, folderName
 * - Case insensitive
 * - Partial matching (substring)
 */

/** Minimum characters required to perform search */
export const MIN_SEARCH_LENGTH = 2;

/** Fields that are searched for matches */
export type SearchableField = 'name' | 'description' | 'folderName';

/** Common interface for searchable items */
export interface SearchableItem {
  name: string;
  description?: string | undefined;
  folderName?: string | undefined;
}

/**
 * Check if a query meets the minimum length requirement
 */
export function isValidQuery(query: string, minLength: number = MIN_SEARCH_LENGTH): boolean {
  return query.trim().length >= minLength;
}

/**
 * Normalize text for search comparison
 * - Lowercase
 * - Trim whitespace
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Check if text matches query (case-insensitive substring match)
 */
export function matchesQuery(text: string, query: string): boolean {
  if (!query) return true;
  return normalizeText(text).includes(normalizeText(query));
}

/**
 * Check if an item matches the search query
 * Searches in: name, description, folderName
 */
export function itemMatchesQuery<T extends SearchableItem>(
  item: T,
  query: string
): boolean {
  if (!query) return true;

  const normalizedQuery = normalizeText(query);

  // Always search name
  if (normalizeText(item.name).includes(normalizedQuery)) {
    return true;
  }

  // Search description if present
  if (item.description && normalizeText(item.description).includes(normalizedQuery)) {
    return true;
  }

  // Search folderName if present
  if (item.folderName && normalizeText(item.folderName).includes(normalizedQuery)) {
    return true;
  }

  return false;
}

/**
 * Filter an array of items by search query
 */
export function filterByQuery<T extends SearchableItem>(
  items: T[],
  query: string
): T[] {
  if (!query) return items;
  return items.filter((item) => itemMatchesQuery(item, query));
}

/**
 * Get search highlight ranges for a text
 * Returns array of [start, end] indices for highlighting
 */
export function getHighlightRanges(
  text: string,
  query: string
): Array<[number, number]> {
  if (!query || query.length < MIN_SEARCH_LENGTH) return [];

  const ranges: Array<[number, number]> = [];
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);

  let startIndex = 0;
  while (true) {
    const index = normalizedText.indexOf(normalizedQuery, startIndex);
    if (index === -1) break;

    ranges.push([index, index + normalizedQuery.length]);
    startIndex = index + 1;
  }

  return ranges;
}
