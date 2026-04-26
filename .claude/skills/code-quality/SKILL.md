---
name: code-quality
description: |
  Comprehensive code quality and standardization checker. Runs Prettier formatting, ESLint analysis with intelligent parallel fixes, and multi-aspect standardization review.

  TRIGGER when: user says "code quality", "check quality", "lint and fix", "format and lint", "standardize code", "代码质量", "规范化检查", "格式化检查"; user wants to ensure code follows project standards; user wants to fix all linting issues; before committing code.

  Use this skill proactively when the user wants to ensure their code meets all project quality standards.

compatibility:
  tools: [Agent, Bash, Read, Edit, Write]
  dependencies: [npm run format, npm run lint, npm run typecheck]
---

# Code Quality & Standardization

Three-phase comprehensive code quality check with parallel subagent fixes.

## Quick Reference

| Phase | Purpose | Duration |
|-------|---------|----------|
| 1. Prettier | Auto-format all code | ~10s |
| 2. ESLint | Analyze & fix via parallel subagents | ~30s |
| 3. Standardization | Multi-aspect compliance review | ~60s |

## Execution Modes

| Command | Phases | Description |
|---------|--------|-------------|
| `/code-quality` | 1, 2, 3 | Full quality check |
| `quick check` / `快速检查` | 1, 2 (no fix) | Report issues only |
| `fix lint` / `修复lint` | 2 only | ESLint fix only |
| `check standards` / `检查规范` | 3 only | Standardization only |

## Phase 1: Prettier Formatting

```bash
npm run format
npm run format -- --check  # Verify
```

Report files changed.

## Phase 2: ESLint Analysis & Fix

### Step 2.1: Run ESLint

```bash
npm run lint -- --format json 2>/dev/null || true
```

### Step 2.2: Analyze & Categorize

Group issues by:
- **Severity**: Error (must fix) vs Warning (should fix)
- **Rule Type**: TypeScript, React, Hooks, Best Practices
- **Complexity**: Simple fixes vs complex refactoring

### Step 2.3: Spawn Parallel Fix Subagents

Spawn subagents for each category. See `references/eslint-fix-prompts.md` for templates.

### Step 2.4: Review Fixes

```bash
npm run lint           # Verify fixes
npm run typecheck      # Check compilation
npm run test           # Verify tests pass
```

## Phase 3: Standardization Review

Load standards from:
- `docs/development/frontend-standards.md`
- `CLAUDE.md`

Spawn 5 parallel review subagents:
1. **Design System** - CSS variables, no hardcoded values
2. **Component Architecture** - Folder structure, barrel exports
3. **State Management** - Zustand patterns
4. **TypeScript** - Interfaces, path aliases
5. **Imports** - Order and organization

See `references/standardization-prompts.md` for detailed checks.

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║              CODE QUALITY REPORT                              ║
╠══════════════════════════════════════════════════════════════╣
║ Phase 1: Prettier Formatting                                 ║
║   ✓ 15 files formatted                                       ║
║                                                              ║
║ Phase 2: ESLint Analysis & Fix                               ║
║   ✓ 28 issues fixed by 4 parallel subagents                  ║
║                                                              ║
║ Phase 3: Standardization Review                              ║
║   ⚠ 22 violations found (8 must-fix)                         ║
╠══════════════════════════════════════════════════════════════╣
║ Summary: 29 files modified, 28 issues fixed                  ║
╚══════════════════════════════════════════════════════════════╝
```

## Error Handling

| Error | Action |
|-------|--------|
| ESLint fails to run | Check config, verify dependencies |
| Subagent fix failure | Report unfixable issues, manual intervention |
| Type check fails after fix | Rollback changes, report error |

## Configuration

Create `.claude/skills/code-quality/config.yaml`:

```yaml
skipPrettier: false
skipESLint: false
skipStandardization: false
autoFix: true
maxWarnings: 0
enabledChecks:
  designSystem: true
  componentArchitecture: true
  stateManagement: true
  typescript: true
  imports: true
failOnMustFix: true
```
