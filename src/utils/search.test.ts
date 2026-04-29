import { describe, it, expect } from 'vitest';
import {
  MIN_SEARCH_LENGTH,
  isValidQuery,
  normalizeText,
  matchesQuery,
  itemMatchesQuery,
  filterByQuery,
  getHighlightRanges,
  type SearchableItem,
} from './search';

describe('search utilities', () => {
  describe('isValidQuery', () => {
    it('returns true for queries meeting minimum length', () => {
      expect(isValidQuery('ab')).toBe(true);
      expect(isValidQuery('abc')).toBe(true);
      expect(isValidQuery('test query')).toBe(true);
    });

    it('returns false for queries below minimum length', () => {
      expect(isValidQuery('')).toBe(false);
      expect(isValidQuery('a')).toBe(false);
      expect(isValidQuery(' ')).toBe(false);
    });

    it('trims whitespace before checking length', () => {
      expect(isValidQuery('  a  ')).toBe(false);
      expect(isValidQuery('  ab  ')).toBe(true);
    });

    it('respects custom minimum length', () => {
      expect(isValidQuery('ab', 3)).toBe(false);
      expect(isValidQuery('abc', 3)).toBe(true);
    });
  });

  describe('normalizeText', () => {
    it('converts to lowercase', () => {
      expect(normalizeText('HELLO')).toBe('hello');
      expect(normalizeText('Hello World')).toBe('hello world');
    });

    it('trims whitespace', () => {
      expect(normalizeText('  hello  ')).toBe('hello');
    });
  });

  describe('matchesQuery', () => {
    it('returns true for substring matches', () => {
      expect(matchesQuery('hello world', 'hello')).toBe(true);
      expect(matchesQuery('hello world', 'world')).toBe(true);
      expect(matchesQuery('hello world', 'o w')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(matchesQuery('Hello World', 'HELLO')).toBe(true);
      expect(matchesQuery('HELLO WORLD', 'hello')).toBe(true);
    });

    it('returns true for empty query', () => {
      expect(matchesQuery('hello', '')).toBe(true);
    });

    it('returns false for no match', () => {
      expect(matchesQuery('hello world', 'xyz')).toBe(false);
    });
  });

  describe('itemMatchesQuery', () => {
    interface TestItem extends SearchableItem {
      name: string;
      description?: string;
      folderName?: string;
    }

    const testItem: TestItem = {
      name: 'My Skill',
      description: 'A test skill description',
      folderName: 'my-skill-folder',
    };

    it('matches name', () => {
      expect(itemMatchesQuery(testItem, 'skill')).toBe(true);
      expect(itemMatchesQuery(testItem, 'my')).toBe(true);
    });

    it('matches description', () => {
      expect(itemMatchesQuery(testItem, 'test')).toBe(true);
      expect(itemMatchesQuery(testItem, 'description')).toBe(true);
    });

    it('matches folderName', () => {
      expect(itemMatchesQuery(testItem, 'folder')).toBe(true);
      expect(itemMatchesQuery(testItem, 'my-skill')).toBe(true);
    });

    it('is case insensitive', () => {
      expect(itemMatchesQuery(testItem, 'MY SKILL')).toBe(true);
      expect(itemMatchesQuery(testItem, 'TEST')).toBe(true);
    });

    it('returns true for empty query', () => {
      expect(itemMatchesQuery(testItem, '')).toBe(true);
    });

    it('returns false for no match', () => {
      expect(itemMatchesQuery(testItem, 'xyz')).toBe(false);
    });

    it('handles missing optional fields', () => {
      const minimalItem: TestItem = { name: 'Test' };
      expect(itemMatchesQuery(minimalItem, 'test')).toBe(true);
      expect(itemMatchesQuery(minimalItem, 'xyz')).toBe(false);
    });
  });

  describe('filterByQuery', () => {
    interface TestItem extends SearchableItem {
      name: string;
      description?: string;
    }

    const items: TestItem[] = [
      { name: 'React Hooks', description: 'Learn React hooks' },
      { name: 'Vue Components', description: 'Vue.js components' },
      { name: 'TypeScript Guide', description: 'TypeScript tutorial' },
    ];

    it('filters items by query', () => {
      const result = filterByQuery(items, 'react');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('React Hooks');
    });

    it('returns all items for empty query', () => {
      expect(filterByQuery(items, '')).toHaveLength(3);
    });

    it('returns empty array when no matches', () => {
      expect(filterByQuery(items, 'python')).toHaveLength(0);
    });

    it('matches in description', () => {
      const result = filterByQuery(items, 'tutorial');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('TypeScript Guide');
    });
  });

  describe('getHighlightRanges', () => {
    it('returns ranges for matches', () => {
      const ranges = getHighlightRanges('hello world', 'world');
      expect(ranges).toEqual([[6, 11]]);
    });

    it('returns multiple ranges for multiple matches', () => {
      const ranges = getHighlightRanges('hello hello hello', 'hello');
      expect(ranges).toHaveLength(3);
    });

    it('is case insensitive', () => {
      const ranges = getHighlightRanges('HELLO WORLD', 'hello');
      expect(ranges).toEqual([[0, 5]]);
    });

    it('returns empty array for short queries', () => {
      expect(getHighlightRanges('hello world', 'h')).toEqual([]);
      expect(getHighlightRanges('hello world', '')).toEqual([]);
    });

    it('returns empty array when no match', () => {
      expect(getHighlightRanges('hello world', 'xyz')).toEqual([]);
    });
  });
});
