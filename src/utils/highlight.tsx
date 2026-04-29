/**
 * Text highlighting utilities for search results
 */
import React from 'react';

/**
 * Escapes special regex characters in a string
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlights matching text with a search term
 * @param text - The text to search in
 * @param searchTerm - The term to highlight (must be at least 2 characters)
 * @returns React node with highlighted matches wrapped in <mark> elements
 */
export function highlightMatch(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm || searchTerm.length < 2) return text;

  const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <mark key={index} className="highlight">
          {part}
        </mark>
      );
    }
    return part;
  });
}

/**
 * Extracts a snippet of text around a search match
 * @param text - The full text to search in
 * @param searchTerm - The term to find
 * @param contextLength - Number of characters to show around the match (default: 50)
 * @returns Object with snippet text and whether a match was found
 */
export function extractSnippet(
  text: string,
  searchTerm: string,
  contextLength = 50
): { snippet: string; matchFound: boolean } {
  if (!text || !searchTerm || searchTerm.length < 2) {
    return { snippet: '', matchFound: false };
  }

  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerTerm);

  if (matchIndex === -1) {
    return { snippet: '', matchFound: false };
  }

  const start = Math.max(0, matchIndex - contextLength);
  const end = Math.min(text.length, matchIndex + searchTerm.length + contextLength);
  const snippet = text.slice(start, end);
  const displaySnippet = (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');

  return { snippet: displaySnippet, matchFound: true };
}
