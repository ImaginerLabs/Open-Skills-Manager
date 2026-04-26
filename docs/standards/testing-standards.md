# 测试规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 测试框架

- **单元测试**: Vitest 3.1.1
- **测试位置**: `tests/unit/` 和 `tests/e2e/`
- **命名规范**: `<源文件名>.test.ts(x)`

---

## 测试文件结构

```
tests/
├── unit/
│   ├── components/
│   │   └── SkillCard.test.tsx
│   ├── hooks/
│   │   └── useSkills.test.ts
│   └── utils/
│       └── formatters.test.ts
└── e2e/
    └── install-flow.test.ts
```

---

## 单元测试示例

```tsx
// tests/unit/components/SkillCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkillCard } from '@/components/features/SkillCard';

describe('SkillCard', () => {
  const mockSkill: Skill = {
    id: '1',
    name: 'Test Skill',
    version: '1.0.0',
    description: 'A test skill',
    path: '/path/to/skill',
    scope: 'global',
    status: 'enabled',
    source: 'official',
    installedAt: new Date(),
    metadata: {},
  };

  it('renders skill name', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('Test Skill')).toBeInTheDocument();
  });

  it('calls onInstall when install button clicked', async () => {
    const onInstall = vi.fn();
    render(<SkillCard skill={mockSkill} onInstall={onInstall} />);

    await userEvent.click(screen.getByText('Install'));
    expect(onInstall).toHaveBeenCalledWith('1');
  });
});
```

---

## Hook 测试示例

```tsx
// tests/unit/hooks/useSkills.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSkills } from '@/hooks/useSkills';

describe('useSkills', () => {
  it('returns skills after loading', async () => {
    const { result } = renderHook(() => useSkills());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.skills.length).toBeGreaterThan(0);
    });
  });
});
```

---

## 测试命令

```bash
# 运行所有测试
npm run test

# 运行特定测试文件
npm run test SkillCard.test.tsx

# 生成覆盖率报告
npm run test:coverage
```

---

## 测试原则

1. **测试行为，而非实现** - 关注组件做什么，而非怎么做
2. **使用语义化查询** - 优先使用 `getByRole`, `getByText`
3. **避免测试实现细节** - 不测试组件内部状态
4. **保持测试独立** - 每个测试应该独立运行

---

## 调试集成

测试失败时的调试方法，参考 [调试规范](./debugging-standards.md)：

- **Rust 端**: 使用 `RUST_BACKTRACE=1` 获取堆栈追踪
- **WebView 端**: 程序化打开 DevTools 检查 DOM/JS
- **性能分析**: 使用 CrabNebula DevTools 追踪命令执行
