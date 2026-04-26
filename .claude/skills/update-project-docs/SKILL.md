---
name: update-project-docs
description: |
  Multi-agent documentation updater that scans project state and updates all documentation files.

  TRIGGER when: user says "update docs", "sync documentation", "refresh docs", "更新文档", "同步文档"; user wants to keep documentation current with codebase changes; after completing significant implementation work; before release or PR.

  Use this skill proactively when major code changes have been made and documentation may be stale.

compatibility:
  tools: [Agent]
  dependencies: [smart-commit skill]
---

# Update Project Docs

Multi-agent documentation sync that keeps all project docs synchronized with the codebase.

## Quick Reference

| Document | Purpose | Update Trigger |
|----------|---------|----------------|
| `CLAUDE.md` | Claude Code instructions | New patterns, commands, architecture |
| `README.md` | Project overview | New features, tech stack updates |
| `docs/development/*.md` | Development standards | New components, patterns, configs |
| `_bmad-output/**/*.md` | BMad artifacts | Sprint progress, story completion |

## Execution Flow

### Phase 1: Collect Project State (Parallel)

Launch 3 subagents concurrently using the Agent tool:

**Codebase Scanner** (`subagent_type: Explore`)
- Scan `src/` for new components, stores, hooks, CSS variables, IPC channels, types
- Output structured report per category

**Dependency Analyzer** (`subagent_type: general-purpose`)
- Analyze `package.json` for version changes
- Compare against documented versions

**Config Analyzer** (`subagent_type: Explore`)
- Scan config files (eslint, vitest, tsconfig, etc.)
- Report undocumented settings

See `references/subagent-prompts.md` for exact prompts.

### Phase 2: Update Documents

Update in priority order:
1. `docs/development/tech-stack.md` - Version accuracy
2. `docs/development/frontend-standards.md` - Components/hooks
3. `CLAUDE.md` - Architecture and patterns
4. `README.md` - Feature list and badges

### Phase 3: Commit Changes

Use `smart-commit` skill for organized commits:
- `docs(tech-stack): update dependency versions`
- `docs(frontend-standards): add new components and hooks`
- `docs(claude): sync architecture with current codebase`

## Error Handling

### Subagent Failure

If a subagent fails:
1. Log the error
2. Continue with available data from other subagents
3. Report which scanner failed in the summary

### No Changes Detected

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

## Partial Updates

User can specify which documents to update:
- "只更新 README 和 tech-stack" → Run only Dependency Analyzer, update only those files

## Output Format

```
=== Project Documentation Update ===

Phase 1: Scanning...
✓ Codebase Scanner: Found 3 new components, 2 new hooks
✓ Dependency Analyzer: React 19.0.0 → 19.2.0
✓ Config Analyzer: ESLint now uses flat config

Phase 2: Updating Documents...
✓ docs/development/tech-stack.md - Updated 5 version entries
✓ docs/development/frontend-standards.md - Added EditorToolbar component

Phase 3: Committing...
✓ docs(tech-stack): update dependency versions to current

=== Summary ===
Updated 4 documents with 12 changes
Created 4 commits
```
