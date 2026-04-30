/**
 * Format file size to human-readable string
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date to localized string
 */
export function formatDate(date: string | Date | undefined | null): string {
  if (!date) return 'Unknown';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
}

/**
 * Normalize date field to string format for SkillPreviewData
 */
export function normalizeSkillDate(
  updatedAt: string | Date | undefined,
  importedAt: string | Date | undefined
): string | undefined {
  if (updatedAt) {
    return typeof updatedAt === 'string' ? updatedAt : updatedAt.toLocaleDateString();
  }
  if (importedAt) {
    return typeof importedAt === 'string' ? importedAt : importedAt.toLocaleDateString();
  }
  return undefined;
}

/**
 * Version stability classification
 */
export type VersionStability = 'stable' | 'beta' | 'alpha' | 'dev' | 'unknown';

/**
 * Format version string and detect stability
 * Handles: "1.0.0", "v1.0.0", "1.0.0-beta", "0.1.0-alpha.1", etc.
 */
export function formatVersion(version: string | undefined | null): { display: string; stability: VersionStability } {
  if (!version) return { display: '', stability: 'unknown' };

  // Remove quotes if present (e.g., "1.0.0" → 1.0.0)
  let cleaned = version.replace(/^["']|["']$/g, '').trim();

  // Remove 'v' prefix if present (e.g., v1.0.0 → 1.0.0)
  cleaned = cleaned.replace(/^v/i, '');

  // Handle empty or default versions
  if (!cleaned || cleaned === '0.0.0') {
    return { display: '', stability: 'unknown' };
  }

  // Detect stability from prerelease suffix
  const lowerVersion = cleaned.toLowerCase();
  let stability: VersionStability = 'stable';

  if (lowerVersion.includes('dev') || lowerVersion.includes('snapshot')) {
    stability = 'dev';
  } else if (lowerVersion.includes('alpha')) {
    stability = 'alpha';
  } else if (lowerVersion.includes('beta') || lowerVersion.includes('rc')) {
    stability = 'beta';
  } else if (lowerVersion.startsWith('0.')) {
    // 0.x.x versions are considered development/alpha
    stability = 'alpha';
  }

  // Simplify display: 1.0.0 → v1.0, 1.2.3 → v1.2
  // Keep prerelease suffix for non-stable versions
  const parts = cleaned.split('-');
  const mainVersion = parts[0] || cleaned;
  const prerelease = parts.length > 1 ? parts.slice(1).join('-') : '';

  // Simplify main version (remove trailing .0)
  const [major, minor, patch] = mainVersion.split('.');
  let displayVersion = `${major}.${minor}`;
  if (patch && patch !== '0') {
    displayVersion = `${major}.${minor}.${patch}`;
  }

  // Add 'v' prefix
  let display = `v${displayVersion}`;

  // Add prerelease suffix for non-stable versions
  if (prerelease && stability !== 'stable') {
    display += `-${prerelease}`;
  }

  return { display, stability };
}
