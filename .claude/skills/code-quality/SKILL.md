---
name: code-quality
description: |
  Comprehensive code quality and standardization checker. Runs Prettier formatting, ESLint analysis with intelligent parallel fixes, and multi-aspect standardization review.

  TRIGGER when: user says "code quality", "check quality", "lint and fix", "format and lint", "standardize code", "代码质量", "规范化检查", "格式化检查"; user wants to ensure code follows project standards; user wants to fix all linting issues; before committing code.

  Use this skill proactively when the user wants to ensure their code meets all project quality standards.
---

# Code Quality & Standardization Skill

## Overview

This skill performs comprehensive code quality checks in three phases:

1. **Prettier Formatting** - Auto-format all code
2. **ESLint Analysis & Fix** - Analyze issues, plan parallel fixes via subagents, review fixes
3. **Standardization Review** - Multi-aspect compliance check via parallel subagents

## Phase 1: Prettier Formatting

### Execution

```bash
npm run format
```

### Verification

```bash
npm run format -- --check
```

If check fails, run format again and report files changed.

### Output Format

```
=== Phase 1: Prettier Formatting ===

Running Prettier...

✓ Formatted 15 files
✓ All files pass format check

Files formatted:
  - src/renderer/components/Sidebar.tsx
  - src/renderer/store/note.store.ts
  ...
```

---

## Phase 2: ESLint Analysis & Intelligent Fix

### Step 2.1: Run ESLint

```bash
npm run lint -- --format json 2>/dev/null || true
```

Capture output for analysis.

### Step 2.2: Analyze Issues

Parse ESLint output and categorize issues by:

1. **Severity**: Error (must fix) vs Warning (should fix)
2. **Rule Type**: TypeScript, React, Hooks, Best Practices
3. **File Grouping**: Group related files for batch fixing
4. **Complexity**: Simple fixes vs complex refactoring needed

### Step 2.3: Spawn Parallel Fix Subagents

Based on issue analysis, spawn multiple subagents to fix issues in parallel:

```
Issue Categories for Parallel Fix:
├── TypeScript Issues (subagent-1)
│   ├── @typescript-eslint/no-unused-vars
│   ├── @typescript-eslint/no-explicit-any
│   └── @typescript-eslint/explicit-module-boundary-types
├── React/Hooks Issues (subagent-2)
│   ├── react-hooks/exhaustive-deps
│   └── react/display-name
├── Import/Export Issues (subagent-3)
│   ├── import/order
│   └── no-duplicate-imports
└── Best Practices (subagent-4)
    ├── no-console
    ├── prefer-const
    └── eqeqeq
```

### Subagent Prompt Template

For each fix subagent:

```
You are a code fix specialist. Fix the following ESLint issues in the specified files.

## Issues to Fix
[List specific issues with file paths and line numbers]

## Fix Guidelines
1. Make minimal, targeted changes
2. Preserve existing functionality
3. Follow project coding standards
4. Do not add new dependencies

## Files to Modify
[List file paths]

## Expected Output
Report each fix with:
- File path
- Line number
- Rule fixed
- Change summary
```

### Step 2.4: Main Agent Review

After all subagents complete, the main agent must:

1. **Verify All Fixes**
   ```bash
   npm run lint
   ```

2. **Review Changed Files**
   ```bash
   git diff --stat
   ```

3. **Quality Check**
   - Ensure no new issues introduced
   - Verify code still compiles: `npm run typecheck`
   - Check tests still pass: `npm run test`

4. **Report Summary**
   ```
   === Phase 2: ESLint Fix Review ===

   Subagent Results:
   - TypeScript Fixer: Fixed 12 issues in 5 files
   - React/Hooks Fixer: Fixed 3 issues in 2 files
   - Import Fixer: Fixed 8 issues in 4 files
   - Best Practices: Fixed 5 issues in 3 files

   Verification:
   ✓ ESLint passes with 0 errors
   ✓ TypeScript compiles successfully
   ✓ All tests pass

   Files modified: 14
   Total issues fixed: 28
   ```

---

## Phase 3: Multi-Aspect Standardization Review

### Load Standards Documentation

Read the following specification files:

1. `docs/development/frontend-standards.md` - Frontend development standards
2. `docs/development/eslint-config.md` - ESLint configuration
3. `CLAUDE.md` - Project conventions and design system

### Standardization Categories

Spawn parallel subagents for each aspect:

#### 3.1 Design System Compliance (subagent-design)

Check for Pure Memo design system violations:

```yaml
Checks:
  - Border radius: Must be 0 or omitted (no rounded corners)
  - Border width: Must be 2px solid
  - Box shadow: Must be 3px 3px 0 0 format
  - Font family: Must use monospace
  - Icons: Must use Unicode, no icon libraries
  - Colors: Must use CSS variables, no hardcoded values
  - Spacing: Must use CSS variables from design tokens
```

Files to check: `src/renderer/**/*.css`, `src/renderer/**/*.tsx`

#### 3.2 Component Architecture (subagent-arch)

Check component structure compliance:

```yaml
Checks:
  - Folder structure: ComponentName/ComponentName.tsx
  - CSS Modules: ComponentName.module.css exists
  - Barrel export: index.ts with proper exports
  - Props interface: ComponentNameProps exported
  - Naming: PascalCase components, camelCase utilities
```

Files to check: `src/renderer/components/**/*`

#### 3.3 State Management (subagent-state)

Check Zustand store compliance:

```yaml
Checks:
  - Store structure: State (nouns) + Actions (verbs) + Selectors (get prefix)
  - Internal actions: Underscore prefix (_setNotes)
  - Usage: Selective subscription, not entire store
  - useShallow: Used for multiple values
```

Files to check: `src/renderer/store/**/*`

#### 3.4 TypeScript Standards (subagent-types)

Check TypeScript compliance:

```yaml
Checks:
  - Interface vs type: Prefer interface for objects
  - Exports: All types must be exported
  - Path aliases: Use @/ and @shared/ not relative paths
  - Return types: Explicit for public functions
  - Any usage: Avoid, use unknown if needed
```

Files to check: `src/**/*.ts`, `src/**/*.tsx`

#### 3.5 Import Organization (subagent-imports)

Check import order and organization:

```yaml
Checks:
  - Order: Node builtins → External → Internal (@/) → Parent → Sibling
  - Grouping: Blank line between groups
  - Aliases: Use @/ for renderer, @shared/ for shared
  - No relative paths across directories
```

Files to check: `src/**/*.ts`, `src/**/*.tsx`

### Subagent Standardization Prompt Template

```
You are a code standardization reviewer. Check the following files for compliance with project standards.

## Standard to Check
[Specific standard category and rules]

## Files to Review
[List of file paths]

## Standards Reference
[Relevant sections from docs/development/frontend-standards.md]

## Output Format
For each violation found:
1. File path and line number
2. Rule violated
3. Current code snippet
4. Suggested fix
5. Severity (must-fix / should-fix / suggestion)

Group findings by severity and file.
```

### Step 3.6: Aggregate Results

Main agent collects all subagent reports and creates unified summary:

```
=== Phase 3: Standardization Review ===

Design System Compliance:
  ⚠ Found 5 violations
    - 3 hardcoded colors in NoteCard.module.css
    - 1 rounded corner in Button.tsx
    - 1 missing CSS variable in Sidebar.tsx

Component Architecture:
  ✓ All components follow folder structure
  ⚠ 2 missing barrel exports
  ✓ All props interfaces exported

State Management:
  ✓ Store structure correct
  ⚠ 1 store subscribing to entire state
  ✓ All selectors properly prefixed

TypeScript Standards:
  ✓ Interfaces used correctly
  ⚠ 3 files using relative paths instead of aliases
  ✓ All types exported

Import Organization:
  ⚠ 8 files need import reordering
  ✓ All using correct aliases

---
Total violations: 22
  - Must fix: 8
  - Should fix: 10
  - Suggestions: 4
```

---

## Execution Flow

### Full Execution

When user runs `/code-quality`:

1. **Phase 1**: Run Prettier, report formatted files
2. **Phase 2**: Run ESLint, analyze, spawn fix subagents, review fixes
3. **Phase 3**: Load standards, spawn review subagents, aggregate results
4. **Final Report**: Summary of all changes and violations

### Quick Execution

When user says "quick check" or "快速检查":

1. Run Prettier check (no auto-fix)
2. Run ESLint (no auto-fix)
3. Report issues without fixing

### Fix Only

When user says "fix lint" or "修复lint":

1. Skip Phase 1 (Prettier)
2. Run Phase 2 (ESLint fix)
3. Skip Phase 3 (Standardization)

### Standardization Only

When user says "check standards" or "检查规范":

1. Skip Phase 1 and 2
2. Run Phase 3 only

---

## Output Templates

### Final Report

```
╔══════════════════════════════════════════════════════════════╗
║              CODE QUALITY REPORT                              ║
╠══════════════════════════════════════════════════════════════╣
║ Phase 1: Prettier Formatting                                 ║
║   ✓ 15 files formatted                                       ║
║                                                              ║
║ Phase 2: ESLint Analysis & Fix                               ║
║   ✓ 28 issues fixed by 4 parallel subagents                  ║
║   ✓ All checks passing                                       ║
║                                                              ║
║ Phase 3: Standardization Review                              ║
║   ⚠ 22 violations found (8 must-fix)                         ║
║   See detailed report above                                  ║
╠══════════════════════════════════════════════════════════════╣
║ Summary                                                      ║
║   Files modified: 29                                         ║
║   Issues fixed: 28                                           ║
║   Standards violations: 22                                   ║
║   Next steps: Review must-fix violations                     ║
╚══════════════════════════════════════════════════════════════╝
```

### Violation Detail Format

```
┌─────────────────────────────────────────────────────────────┐
│ MUST FIX: Hardcoded color in CSS                            │
├─────────────────────────────────────────────────────────────┤
│ File: src/renderer/components/NoteCard.module.css:23       │
│ Rule: design-system/colors                                   │
│                                                              │
│ Current:                                                     │
│   color: #333;                                               │
│                                                              │
│ Should be:                                                   │
│   color: var(--text-primary);                                │
│                                                              │
│ Why: All colors must use CSS variables for consistency      │
└─────────────────────────────────────────────────────────────┘
```

---

## Error Handling

### ESLint Fails to Run

```
⚠ ESLint encountered an error:
  [error message]

Attempting to fix:
1. Check eslint.config.js exists
2. Verify dependencies installed
3. Run npm install if needed
```

### Subagent Fix Failure

```
⚠ Subagent 'TypeScript Fixer' failed to fix some issues:
  - src/renderer/store/note.store.ts:45 - Complex type inference

Manual intervention required for these issues.
```

### Type Check Fails After Fix

```
⚠ TypeScript compilation failed after fixes:
  [error messages]

Rolling back changes...
Please review manual fix needed.
```

---

## Configuration

### Customization

Users can customize behavior via `.claude/skills/code-quality/config.yaml`:

```yaml
# Skip phases
skipPrettier: false
skipESLint: false
skipStandardization: false

# ESLint behavior
autoFix: true
maxWarnings: 0

# Standardization checks
enabledChecks:
  designSystem: true
  componentArchitecture: true
  stateManagement: true
  typescript: true
  imports: true

# Severity thresholds
failOnMustFix: true
failOnShouldFix: false
```

---

## Integration with Git Hooks

This skill can be used with pre-commit hooks:

```bash
# .husky/pre-commit
npm run format
npm run lint:fix
# Or invoke this skill: /code-quality
```

---

## Examples

### Example 1: Full Quality Check

```
User: /code-quality

Assistant:
=== Phase 1: Prettier Formatting ===
Running Prettier...
✓ All 47 files pass format check

=== Phase 2: ESLint Analysis ===
Found 15 issues across 8 files
Spawning 3 fix subagents...

[Subagent TypeScript Fixer] Fixed 8 issues in 4 files
[Subagent React Fixer] Fixed 4 issues in 2 files
[Subagent Imports Fixer] Fixed 3 issues in 2 files

Reviewing fixes...
✓ ESLint passes with 0 errors
✓ TypeScript compiles
✓ Tests pass

=== Phase 3: Standardization Review ===
Spawning 5 review subagents...

[Design System] 5 violations found
[Architecture] 2 violations found
[State] 1 violation found
[TypeScript] 3 violations found
[Imports] 8 violations found

See detailed report above for fixes.
```

### Example 2: Quick Check

```
User: quick check

Assistant:
=== Quick Quality Check ===

Prettier: ✓ All files formatted
ESLint: ⚠ 15 issues found (3 errors, 12 warnings)
TypeScript: ✓ Compiles successfully

Run '/code-quality' to auto-fix issues.
```

### Example 3: Fix Only

```
User: fix lint issues

Assistant:
=== ESLint Fix Mode ===

Analyzing issues...
Found 15 issues in 8 files

Spawning parallel fix subagents...
- TypeScript Fixer: Processing 8 issues
- React Fixer: Processing 4 issues
- Best Practices: Processing 3 issues

Fixes applied:
✓ src/renderer/store/note.store.ts - 5 fixes
✓ src/renderer/components/Sidebar.tsx - 3 fixes
✓ src/renderer/hooks/useAutoSave.ts - 2 fixes
...

Verification:
✓ ESLint passes
✓ TypeScript compiles
✓ Tests pass

Total issues fixed: 15
```
