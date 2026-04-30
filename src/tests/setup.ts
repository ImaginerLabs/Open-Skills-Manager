import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock @lobehub/icons components to avoid ESM resolution issues in tests
vi.mock('@lobehub/icons/es/ClaudeCode/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Gemini/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/OpenCode/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Cursor/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Windsurf/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Replit/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Copilot/components/Avatar', () => ({
  default: () => null,
}));
vi.mock('@lobehub/icons/es/Trae/components/Avatar', () => ({
  default: () => null,
}));
