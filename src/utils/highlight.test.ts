import { describe, it, expect } from 'vitest';
import { escapeRegExp, highlightMatch, extractSnippet } from '@/utils/highlight';

describe('highlight', () => {
  describe('escapeRegExp', () => {
    it('should escape special regex characters', () => {
      expect(escapeRegExp('.')).toBe('\\.');
      expect(escapeRegExp('*')).toBe('\\*');
      expect(escapeRegExp('+')).toBe('\\+');
      expect(escapeRegExp('?')).toBe('\\?');
    });

    it('should escape multiple special characters', () => {
      expect(escapeRegExp('a.b*c')).toBe('a\\.b\\*c');
      expect(escapeRegExp('^$()')).toBe('\\^\\$\\(\\)');
    });

    it('should handle empty string', () => {
      expect(escapeRegExp('')).toBe('');
    });

    it('should not modify non-special characters', () => {
      expect(escapeRegExp('hello')).toBe('hello');
      expect(escapeRegExp('abc123')).toBe('abc123');
    });

    it('should escape brackets and braces', () => {
      expect(escapeRegExp('[test]')).toBe('\\[test\\]');
      expect(escapeRegExp('{n}')).toBe('\\{n\\}');
    });

    it('should escape pipe and backslash', () => {
      expect(escapeRegExp('a|b')).toBe('a\\|b');
      expect(escapeRegExp('a\\b')).toBe('a\\\\b');
    });
  });

  describe('highlightMatch', () => {
    it('should return original text for empty search term', () => {
      const result = highlightMatch('hello world', '');
      expect(result).toBe('hello world');
    });

    it('should return original text for single character search', () => {
      const result = highlightMatch('hello world', 'h');
      expect(result).toBe('hello world');
    });

    it('should highlight matching text', () => {
      const result = highlightMatch('hello world', 'world');
      // Result should be an array with highlighted part
      expect(Array.isArray(result)).toBe(true);
    });

    it('should be case insensitive', () => {
      const result = highlightMatch('HELLO WORLD', 'hello');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple matches', () => {
      const result = highlightMatch('hello hello hello', 'hello');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle no match', () => {
      const result = highlightMatch('hello world', 'xyz');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle search term longer than text', () => {
      const result = highlightMatch('hi', 'hello');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle exact match', () => {
      const result = highlightMatch('hello', 'hello');
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle special regex characters in search', () => {
      const result = highlightMatch('test.value', 'test.');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('extractSnippet', () => {
    it('should return empty for empty text', () => {
      const result = extractSnippet('', 'test');
      expect(result.snippet).toBe('');
      expect(result.matchFound).toBe(false);
    });

    it('should return empty for empty search term', () => {
      const result = extractSnippet('hello world', '');
      expect(result.snippet).toBe('');
      expect(result.matchFound).toBe(false);
    });

    it('should return empty for single character search', () => {
      const result = extractSnippet('hello world', 'h');
      expect(result.snippet).toBe('');
      expect(result.matchFound).toBe(false);
    });

    it('should extract snippet around match', () => {
      const text = 'This is a long text with the target word somewhere in the middle';
      const result = extractSnippet(text, 'target');
      expect(result.matchFound).toBe(true);
      expect(result.snippet).toContain('target');
    });

    it('should be case insensitive', () => {
      const result = extractSnippet('HELLO WORLD', 'hello');
      expect(result.matchFound).toBe(true);
    });

    it('should return no match for missing term', () => {
      const result = extractSnippet('hello world', 'xyz');
      expect(result.matchFound).toBe(false);
      expect(result.snippet).toBe('');
    });

    it('should add ellipsis for truncated text', () => {
      const longText = 'a'.repeat(100) + 'target' + 'b'.repeat(100);
      const result = extractSnippet(longText, 'target', 10);
      expect(result.matchFound).toBe(true);
      expect(result.snippet.startsWith('...')).toBe(true);
      expect(result.snippet.endsWith('...')).toBe(true);
    });

    it('should not add leading ellipsis for match at start', () => {
      const result = extractSnippet('target word at start', 'target', 5);
      expect(result.matchFound).toBe(true);
      expect(result.snippet.startsWith('...')).toBe(false);
    });

    it('should not add trailing ellipsis for match at end', () => {
      const result = extractSnippet('word at end target', 'target', 5);
      expect(result.matchFound).toBe(true);
      expect(result.snippet.endsWith('...')).toBe(false);
    });

    it('should use custom context length', () => {
      const text = 'a'.repeat(100) + 'target' + 'b'.repeat(100);
      const result1 = extractSnippet(text, 'target', 10);
      const result2 = extractSnippet(text, 'target', 30);
      expect(result1.snippet.length).toBeLessThan(result2.snippet.length);
    });

    it('should handle match at exact start', () => {
      const result = extractSnippet('target is here', 'target');
      expect(result.matchFound).toBe(true);
      expect(result.snippet).toContain('target');
    });

    it('should handle match at exact end', () => {
      const result = extractSnippet('here is target', 'target');
      expect(result.matchFound).toBe(true);
      expect(result.snippet).toContain('target');
    });
  });
});