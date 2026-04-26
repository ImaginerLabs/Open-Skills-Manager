# Standardization Review Prompts

Detailed prompts for Phase 3 multi-aspect standardization review.

## Table of Contents

1. [Design System Compliance](#design-system-compliance)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [TypeScript Standards](#typescript-standards)
5. [Import Organization](#import-organization)

---

## Design System Compliance

**Files to check:** `src/renderer/**/*.css`, `src/renderer/**/*.tsx`

### Checks

| Rule | Requirement |
|------|-------------|
| Border radius | Must be 0 or omitted (no rounded corners) |
| Border width | Must be 2px solid |
| Box shadow | Must be 3px 3px 0 0 format |
| Font family | Must use monospace |
| Icons | Must use Unicode, no icon libraries |
| Colors | Must use CSS variables, no hardcoded values |
| Spacing | Must use CSS variables from design tokens |

### Subagent Prompt

```
You are a design system compliance reviewer. Check for Pure Memo design system violations.

## Files to Review
[src/renderer/**/*.css, src/renderer/**/*.tsx]

## Checks
1. Border radius: Must be 0 or omitted
2. Border width: Must be 2px solid
3. Box shadow: Must be 3px 3px 0 0 format
4. Font family: Must use monospace
5. Icons: Must use Unicode, no icon libraries
6. Colors: Must use CSS variables, no hardcoded values
7. Spacing: Must use CSS variables from design tokens

## Output Format
For each violation:
1. File path and line number
2. Rule violated
3. Current code snippet
4. Suggested fix
5. Severity (must-fix / should-fix / suggestion)
```

---

## Component Architecture

**Files to check:** `src/renderer/components/**/*`

### Checks

| Rule | Requirement |
|------|-------------|
| Folder structure | ComponentName/ComponentName.tsx |
| CSS Modules | ComponentName.module.css exists |
| Barrel export | index.ts with proper exports |
| Props interface | ComponentNameProps exported |
| Naming | PascalCase components, camelCase utilities |

### Subagent Prompt

```
You are a component architecture reviewer. Check component structure compliance.

## Files to Review
[src/renderer/components/**/*]

## Checks
1. Folder structure: ComponentName/ComponentName.tsx
2. CSS Modules: ComponentName.module.css exists
3. Barrel export: index.ts with proper exports
4. Props interface: ComponentNameProps exported
5. Naming: PascalCase components, camelCase utilities

## Output Format
For each violation:
1. File path and line number
2. Rule violated
3. Current structure
4. Suggested fix
5. Severity (must-fix / should-fix / suggestion)
```

---

## State Management

**Files to check:** `src/renderer/store/**/*`

### Checks

| Rule | Requirement |
|------|-------------|
| Store structure | State (nouns) + Actions (verbs) + Selectors (get prefix) |
| Internal actions | Underscore prefix (_setNotes) |
| Usage | Selective subscription, not entire store |
| useShallow | Used for multiple values |

### Subagent Prompt

```
You are a state management reviewer. Check Zustand store compliance.

## Files to Review
[src/renderer/store/**/*]

## Checks
1. Store structure: State (nouns) + Actions (verbs) + Selectors (get prefix)
2. Internal actions: Underscore prefix (_setNotes)
3. Usage: Selective subscription, not entire store
4. useShallow: Used for multiple values

## Output Format
For each violation:
1. File path and line number
2. Rule violated
3. Current code
4. Suggested fix
5. Severity (must-fix / should-fix / suggestion)
```

---

## TypeScript Standards

**Files to check:** `src/**/*.ts`, `src/**/*.tsx`

### Checks

| Rule | Requirement |
|------|-------------|
| Interface vs type | Prefer interface for objects |
| Exports | All types must be exported |
| Path aliases | Use @/ and @shared/ not relative paths |
| Return types | Explicit for public functions |
| Any usage | Avoid, use unknown if needed |

### Subagent Prompt

```
You are a TypeScript standards reviewer. Check TypeScript compliance.

## Files to Review
[src/**/*.ts, src/**/*.tsx]

## Checks
1. Interface vs type: Prefer interface for objects
2. Exports: All types must be exported
3. Path aliases: Use @/ and @shared/ not relative paths
4. Return types: Explicit for public functions
5. Any usage: Avoid, use unknown if needed

## Output Format
For each violation:
1. File path and line number
2. Rule violated
3. Current code
4. Suggested fix
5. Severity (must-fix / should-fix / suggestion)
```

---

## Import Organization

**Files to check:** `src/**/*.ts`, `src/**/*.tsx`

### Checks

| Rule | Requirement |
|------|-------------|
| Order | Node builtins → External → Internal (@/) → Parent → Sibling |
| Grouping | Blank line between groups |
| Aliases | Use @/ for renderer, @shared/ for shared |
| Cross-directory | No relative paths across directories |

### Subagent Prompt

```
You are an import organization reviewer. Check import order and organization.

## Files to Review
[src/**/*.ts, src/**/*.tsx]

## Checks
1. Order: Node builtins → External → Internal (@/) → Parent → Sibling
2. Grouping: Blank line between groups
3. Aliases: Use @/ for renderer, @shared/ for shared
4. Cross-directory: No relative paths across directories

## Output Format
For each violation:
1. File path and line number
2. Rule violated
3. Current imports
4. Suggested reordering
5. Severity (must-fix / should-fix / suggestion)
```
