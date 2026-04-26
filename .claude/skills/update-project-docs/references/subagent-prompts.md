# Subagent Prompts

Detailed prompts for each subagent launched during documentation update.

## Table of Contents

1. [Codebase Scanner](#codebase-scanner)
2. [Dependency Analyzer](#dependency-analyzer)
3. [Config Analyzer](#config-analyzer)

---

## Codebase Scanner

**Agent Type:** `Explore`
**Purpose:** Scan source code for new patterns, components, and structures

### Prompt

```
Scan the codebase and report:

1. New components in src/renderer/components/ - list all with their props interfaces
2. New stores in src/renderer/store/ - list all with their state/actions/selectors structure
3. New hooks in src/renderer/hooks/ - list all with their signatures
4. New CSS variables in src/renderer/styles/ - list all defined tokens
5. New IPC channels in src/main/ - list all handlers
6. New shared types in src/shared/types/ - list all exported types

Focus on files added or significantly modified since last documentation update.
Output a structured report for each category.

Report format:
## Components
- ComponentName: brief description, key props

## Stores
- storeName: state shape, main actions

## Hooks
- useHookName: signature, purpose

## CSS Variables
- --token-name: value/purpose

## IPC Channels
- channel-name: request/response types

## Types
- TypeName: brief description
```

### Output Format

Return findings in markdown format with clear sections. If no new items found in a category, note "No changes detected."

---

## Dependency Analyzer

**Agent Type:** `general-purpose`
**Purpose:** Analyze package.json for version changes and new dependencies

### Prompt

```
Analyze package.json and report:

1. All dependencies with current versions
2. New dependencies added (not in docs)
3. Version changes from documented versions
4. Dev dependencies status
5. Scripts available

Compare against docs/development/tech-stack.md and README.md for discrepancies.

Report format:
## Dependencies Status
| Package | Current | Documented | Status |
|---------|---------|------------|--------|
| react | 19.2.0 | 19.0.0 | ⚠️ outdated docs |

## New Dependencies
- package-name: version, purpose

## Scripts
- script-name: command
```

### Output Format

Return a markdown table showing version comparisons. Highlight any discrepancies that need documentation updates.

---

## Config Analyzer

**Agent Type:** `Explore`
**Purpose:** Scan configuration files for undocumented settings

### Prompt

```
Scan configuration files and report:

1. eslint.config.js - rules and plugins
2. vitest.config.ts - test setup and coverage
3. playwright.config.ts - E2E config
4. electron.vite.config.ts - build config
5. tsconfig.json - TypeScript settings
6. .prettierrc - formatting rules

Highlight any new settings not documented in docs/development/*.md

Report format:
## Config File: eslint.config.js
- Setting: value (✓ documented / ⚠️ undocumented)

## Config File: vitest.config.ts
- Setting: value (✓ documented / ⚠️ undocumented)
```

### Output Format

Return findings grouped by config file. Mark each setting as documented or undocumented.
