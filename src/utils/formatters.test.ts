import { describe, it, expect } from 'vitest';
import {
  formatSize,
  formatDate,
  normalizeSkillDate,
  formatVersion,
} from '@/utils/formatters';

describe('formatters', () => {
  describe('formatSize', () => {
    it('should format 0 bytes', () => {
      expect(formatSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1 KB');
      expect(formatSize(2048)).toBe('2 KB');
      expect(formatSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatSize(1048576)).toBe('1 MB');
      expect(formatSize(5242880)).toBe('5 MB');
      expect(formatSize(1572864)).toBe('1.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatSize(1073741824)).toBe('1 GB');
      expect(formatSize(2147483648)).toBe('2 GB');
    });

    it('should handle fractional values', () => {
      expect(formatSize(1126)).toBe('1.1 KB');
      expect(formatSize(1234567)).toBe('1.2 MB');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15');
      const result = formatDate(date);
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should format date string', () => {
      const result = formatDate('2024-03-20');
      expect(result).toContain('Mar');
      expect(result).toContain('2024');
    });

    it('should return Unknown for undefined', () => {
      expect(formatDate(undefined)).toBe('Unknown');
    });

    it('should return Unknown for null', () => {
      expect(formatDate(null)).toBe('Unknown');
    });

    it('should return Unknown for invalid date string', () => {
      expect(formatDate('invalid')).toBe('Unknown');
    });

    it('should return Unknown for invalid Date object', () => {
      expect(formatDate(new Date('invalid'))).toBe('Unknown');
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2024-12-25T10:30:00Z');
      expect(result).toContain('Dec');
      expect(result).toContain('2024');
    });
  });

  describe('normalizeSkillDate', () => {
    it('should return updatedAt as string if provided', () => {
      const result = normalizeSkillDate('2024-01-15', '2023-01-01');
      expect(result).toBe('2024-01-15');
    });

    it('should convert updatedAt Date to string', () => {
      const date = new Date('2024-01-15');
      const result = normalizeSkillDate(date, undefined);
      expect(result).toContain('2024');
    });

    it('should return importedAt if updatedAt is undefined', () => {
      const result = normalizeSkillDate(undefined, '2023-06-20');
      expect(result).toBe('2023-06-20');
    });

    it('should return undefined if both are undefined', () => {
      expect(normalizeSkillDate(undefined, undefined)).toBeUndefined();
    });

    it('should prefer updatedAt over importedAt', () => {
      const result = normalizeSkillDate('2024-01-15', '2020-01-01');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatVersion', () => {
    it('should return empty for undefined', () => {
      const result = formatVersion(undefined);
      expect(result.display).toBe('');
      expect(result.stability).toBe('unknown');
    });

    it('should return empty for null', () => {
      const result = formatVersion(null);
      expect(result.display).toBe('');
      expect(result.stability).toBe('unknown');
    });

    it('should return empty for empty string', () => {
      const result = formatVersion('');
      expect(result.display).toBe('');
      expect(result.stability).toBe('unknown');
    });

    it('should return empty for 0.0.0', () => {
      const result = formatVersion('0.0.0');
      expect(result.display).toBe('');
      expect(result.stability).toBe('unknown');
    });

    it('should format stable version', () => {
      const result = formatVersion('1.0.0');
      expect(result.display).toBe('v1.0');
      expect(result.stability).toBe('stable');
    });

    it('should format version with patch', () => {
      const result = formatVersion('1.2.3');
      expect(result.display).toBe('v1.2.3');
      expect(result.stability).toBe('stable');
    });

    it('should remove v prefix from input', () => {
      const result = formatVersion('v1.0.0');
      expect(result.display).toBe('v1.0');
      expect(result.stability).toBe('stable');
    });

    it('should remove quotes from input', () => {
      const result = formatVersion('"1.0.0"');
      expect(result.display).toBe('v1.0');
      expect(result.stability).toBe('stable');
    });

    it('should detect alpha from 0.x version', () => {
      const result = formatVersion('0.1.0');
      expect(result.stability).toBe('alpha');
    });

    it('should detect alpha from suffix', () => {
      const result = formatVersion('1.0.0-alpha');
      expect(result.stability).toBe('alpha');
      expect(result.display).toBe('v1.0-alpha');
    });

    it('should detect beta from suffix', () => {
      const result = formatVersion('1.0.0-beta');
      expect(result.stability).toBe('beta');
      expect(result.display).toBe('v1.0-beta');
    });

    it('should detect beta from rc suffix', () => {
      const result = formatVersion('1.0.0-rc.1');
      expect(result.stability).toBe('beta');
    });

    it('should detect dev from suffix', () => {
      const result = formatVersion('1.0.0-dev');
      expect(result.stability).toBe('dev');
      expect(result.display).toBe('v1.0-dev');
    });

    it('should detect dev from snapshot suffix', () => {
      const result = formatVersion('1.0.0-snapshot');
      expect(result.stability).toBe('dev');
    });

    it('should handle alpha with number', () => {
      const result = formatVersion('0.1.0-alpha.1');
      expect(result.stability).toBe('alpha');
    });

    it('should handle complex prerelease', () => {
      const result = formatVersion('2.0.0-beta.2');
      expect(result.stability).toBe('beta');
      expect(result.display).toBe('v2.0-beta.2');
    });

    it('should not include prerelease for stable versions', () => {
      // Stable version with prerelease suffix should still be stable
      // but the suffix is kept in display
      const result = formatVersion('1.0.0-something');
      // Actually, based on the code, if it has a prerelease suffix
      // and stability is stable, it won't add the suffix
      expect(result.stability).toBe('stable');
      expect(result.display).toBe('v1.0');
    });

    it('should handle version with multiple dashes', () => {
      const result = formatVersion('1.0.0-alpha-beta-test');
      expect(result.stability).toBe('alpha');
      expect(result.display).toContain('alpha-beta-test');
    });
  });
});