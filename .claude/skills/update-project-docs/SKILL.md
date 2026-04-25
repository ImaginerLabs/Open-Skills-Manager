---
name: update-project-docs
description: |
  Multi-agent documentation updater that scans project state and updates all documentation files.

  TRIGGER when: user says "update docs", "sync documentation", "refresh docs", "更新文档", "同步文档"; user wants to keep documentation current with codebase changes; after completing significant implementation work; before release or PR.

  Use this skill proactively when major code changes have been made and documentation may be stale.
---

# Update Project Docs - Multi-Agent Documentation Sync

## Overview

This skill orchestrates multiple subagents to collect project state and update all documentation files, ensuring docs stay synchronized with the codebase. After updates, commits all changes automatically.

## Documentation Targets

| Document | Purpose | Update Trigger |
|----------|---------|----------------|
| `CLAUDE.md` | Claude Code instructions | New patterns, commands, architecture changes |
| `README.md` | Project overview | New features, tech stack updates, badges |
| `docs/development/frontend-standards.md` | Frontend coding standards | New components, patterns, CSS variables |
| `docs/development/tech-stack.md` | Technology stack | Dependency updates, new libraries |
| `docs/development/*.md` | Other dev docs | Config changes, new tools |
| `_bmad-output/**/*.md` | BMad artifacts | Sprint progress, story completion |

## Subagent Architecture

```
Main Orchestrator
├── Codebase Scanner (Explore agent)
│   └── Scans src/ for new patterns, components, stores
├── Dependency Analyzer (General agent)
│   └── Analyzes package.json for version changes
├── Config Analyzer (Explore agent)
│   └── Scans config files for new settings
└── Documentation Writer (General agent)
    └── Writes updates to all target documents
```

## Execution Flow

### Phase 1: Collect Project State (Parallel Subagents)

Launch 3 subagents concurrently to gather information:

**Agent 1: Codebase Scanner**
```
Prompt: "Scan the codebase and report:
1. New components in src/renderer/components/ - list all with their props interfaces
2. New stores in src/renderer/store/ - list all with their state/actions/selectors structure
3. New hooks in src/renderer/hooks/ - list all with their signatures
4. New CSS variables in src/renderer/styles/ - list all defined tokens
5. New IPC channels in src/main/ - list all handlers
6. New shared types in src/shared/types/ - list all exported types

Focus on files added or significantly modified since last documentation update.
Output a structured report for each category."
```

**Agent 2: Dependency Analyzer**
```
Prompt: "Analyze package.json and report:
1. All dependencies with current versions
2. New dependencies added (not in docs)
3. Version changes from documented versions
4. Dev dependencies status
5. Scripts available

Compare against docs/development/tech-stack.md and README.md for discrepancies."
```

**Agent 3: Config Analyzer**
```
Prompt: "Scan configuration files and report:
1. eslint.config.js - rules and plugins
2. vitest.config.ts - test setup and coverage
3. playwright.config.ts - E2E config
4. electron.vite.config.ts - build config
5. tsconfig.json - TypeScript settings
6. .prettierrc - formatting rules

Highlight any new settings not documented in docs/development/*.md"
```

### Phase 2: Synthesize and Update Documents

After all subagents complete, synthesize findings and update documents:

**Update Priority Order**:
1. `docs/development/tech-stack.md` - Version accuracy is critical
2. `docs/development/frontend-standards.md` - Component/hook documentation
3. `CLAUDE.md` - Architecture and patterns
4. `README.md` - Feature list and badges
5. Other `docs/development/*.md` - Config-specific updates

### Phase 3: Commit Changes

Use smart-commit skill to create organized commits:
- `docs(tech-stack): update dependency versions`
- `docs(frontend-standards): add new components and hooks`
- `docs(claude): sync architecture with current codebase`
- `docs(readme): update feature list`

## Update Rules

### CLAUDE.md Updates

Add/update sections when:
- New architecture patterns emerge (e.g., new IPC channels)
- New development commands added
- New testing patterns established
- Directory structure changes
- New path aliases defined

**Format**: Keep concise, use tables for commands/configs.

### README.md Updates

Add/update when:
- New features implemented
- Tech stack versions change
- New badges earned (coverage, quality)
- New documentation links

**Format**: Keep user-focused, link to detailed docs.

### frontend-standards.md Updates

Add/update when:
- New components with unique patterns
- New CSS variables defined
- New hooks created
- New store patterns
- New CodeMirror extensions

**Format**: Add to appropriate section, maintain template examples.

### tech-stack.md Updates

Add/update when:
- Any dependency version changes
- New library added
- Library removed

**Format**: Update version table, add notes for major changes.

## Output Format

```
=== Project Documentation Update ===

Phase 1: Scanning...
✓ Codebase Scanner: Found 3 new components, 2 new hooks, 5 new CSS variables
✓ Dependency Analyzer: React 19.0.0 → 19.2.0, added zustand/shallow
✓ Config Analyzer: ESLint now uses flat config, Vitest coverage threshold added

Phase 2: Updating Documents...
✓ docs/development/tech-stack.md - Updated 5 version entries
✓ docs/development/frontend-standards.md - Added EditorToolbar component, useAutoSave hook
✓ CLAUDE.md - Added new IPC channels section
✓ README.md - Added iCloud sync feature, updated tech stack table

Phase 3: Committing...
✓ docs(tech-stack): update dependency versions to current
✓ docs(frontend-standards): add EditorToolbar and useAutoSave documentation
✓ docs(claude): add IPC channels and update architecture
✓ docs(readme): add iCloud sync feature and update badges

=== Summary ===
Updated 4 documents with 12 changes
Created 4 commits
```

## Special Cases

### No Changes Detected

If all subagents report no discrepancies:
```
=== Project Documentation Update ===

Phase 1: Scanning...
✓ Codebase Scanner: All components documented
✓ Dependency Analyzer: All versions match docs
✓ Config Analyzer: All configs documented

Phase 2: No updates needed - documentation is current

=== Summary ===
0 documents updated (all current)
0 commits created
```

### Partial Updates

If user requests specific document updates:
```
User: "只更新 README 和 tech-stack"

Execute only Dependency Analyzer, update only README.md and tech-stack.md.
```

### BMad Artifacts

If `_bmad-output/` has new/updated artifacts:
- Include in commit with appropriate scope
- `docs(bmad-planning)` for PRD/architecture updates
- `docs(bmad-implementation)` for story/sprint updates

## Usage Examples

**User says**: "update docs" or "更新文档"

**You should**:
1. Launch 3 subagents in parallel (Codebase Scanner, Dependency Analyzer, Config Analyzer)
2. Wait for all reports
3. Synthesize findings
4. Update each document with specific changes
5. Invoke smart-commit skill for organized commits
6. Output summary

**User says**: "sync documentation after adding the editor"

**You should**:
1. Focus Codebase Scanner on `src/renderer/components/modules/editor/`
2. Update frontend-standards.md with editor components
3. Update CLAUDE.md with editor architecture
4. Commit changes

**User says**: "检查文档是否需要更新"

**You should**:
1. Run all scanners
2. Report discrepancies without making changes
3. Ask user which updates to apply