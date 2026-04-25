---
name: smart-commit
description: |
  Intelligent git commit assistant that categorizes uncommitted files by type and creates multiple focused commits automatically.

  TRIGGER when: user has many uncommitted changes and wants to commit them in organized batches; user says "commit all", "smart commit", "batch commit", "organize my commits", "分类提交", "智能提交"; user runs git status and sees many modified files; user wants to commit BMad artifacts, source code, configs, styles separately.

  Use this skill proactively when you notice the user has a large number of uncommitted files across different categories.
---

# Smart Commit - Intelligent Batch Commit Assistant

## Overview

This skill analyzes uncommitted files, categorizes them by type, and creates focused commits following Conventional Commits specification. It handles BMad artifacts specially and groups related changes together.

## File Classification System

### Category Priority (commit order)

1. **Infrastructure** - Config files, dependencies, build tools
2. **Core Source** - Business logic, services, stores
3. **Components** - UI components by module
4. **Styles** - CSS, theme files
5. **Tests** - Test files (follows corresponding source)
6. **Documentation** - README, docs
7. **BMad Artifacts** - Planning and implementation artifacts

### Classification Rules

```
BMad Files:
├── _bmad-output/planning-artifacts/    → docs(bmad-planning)
├── _bmad-output/implementation-artifacts/stories/ → feat(story)
├── _bmad-output/implementation-artifacts/*.yaml   → chore(sprint)
├── _bmad-output/implementation-artifacts/*-retro-*.md → docs(retro)
└── ui/                                  → docs(ui-design)

Source Code:
├── src/main/                            → feat(backend) / fix(backend)
├── src/renderer/components/modules/     → feat(module-name)
├── src/renderer/components/base/        → feat(ui-base)
├── src/renderer/components/navigation/  → feat(navigation)
├── src/renderer/store/                  → feat(store)
├── src/renderer/hooks/                  → feat(hooks)
├── src/renderer/styles/                 → style
├── src/shared/                          → feat(shared)
└── src/preload/                         → feat(preload)

Configuration:
├── package.json, package-lock.json      → chore(deps)
├── *.config.{js,ts,mjs,cjs}             → chore(config)
├── tsconfig*.json                       → chore(config)
├── .eslintrc*, .prettierrc*             → chore(lint)
└── electron.vite.config.ts              → chore(build)

Tests:
├── **/*.test.ts(x)                      → test(module)
├── **/*.spec.ts                         → test(module)
└── e2e/                                 → test(e2e)

Documentation:
├── README.md                            → docs
├── docs/                                → docs
└── CLAUDE.md                            → docs(claude)
```

## Commit Message Templates

Follow Conventional Commits format:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Type Definitions

| Type | Usage | Example |
|------|-------|---------|
| `feat` | New feature | feat(editor): add CodeMirror setup |
| `fix` | Bug fix | fix(store): correct note update logic |
| `docs` | Documentation | docs(bmad-planning): update architecture |
| `style` | Styling | style: add Pure Memo theme variables |
| `refactor` | Code refactoring | refactor(hooks): extract auto-save logic |
| `test` | Adding tests | test(editor): add CodeMirror unit tests |
| `chore` | Maintenance | chore(deps): upgrade dependencies |

### Scope Extraction

Extract scope from file path:
- `src/renderer/components/modules/editor/` → `editor`
- `src/renderer/store/note.store.ts` → `store:note`
- `_bmad-output/implementation-artifacts/stories/1-1-*.md` → `story:1-1`

## Execution Flow

### Step 1: Analyze Uncommitted Files

```bash
git status --porcelain
```

Parse output and categorize each file.

### Step 2: Group Files

Group files by category and scope:
- Files in same category with same scope → one commit
- Related files (component + style + test) → one commit
- BMad files by artifact type → separate commits

### Step 3: Generate Commit Messages

For each group, generate appropriate commit message:
- Analyze diff to understand change nature
- Use imperative mood, no period at end
- Keep first line under 72 characters
- Add body for complex changes

### Step 4: Execute Commits

For each group:
1. Stage files: `git add <files>`
2. Create commit with generated message
3. Log the commit for user review

### Step 5: Summary Report

Output a summary of all commits created:
```
Created 5 commits:
  1. feat(editor): add CodeMirror setup and toolbar
  2. feat(store): implement note state management
  3. style: add Pure Memo design system variables
  4. docs(bmad-planning): update architecture decisions
  5. chore(config): update ESLint and Prettier

Total files committed: 23
```

## Special Handling

### BMad Artifacts

BMad files are committed separately by type:

**Planning Artifacts** (docs scope):
```
docs(bmad-planning): update PRD and architecture
```

**Story Files** (feat scope):
```
feat(story:1-1): implement basic note creation flow
```

**Sprint Status** (chore scope):
```
chore(sprint): update sprint status for week 3
```

**Retrospectives** (docs scope):
```
docs(retro): add Epic 0 retrospective notes
```

### Component Groups

Related files should be committed together:
- Component file + CSS module + test file → one commit
- Example: `Button.tsx`, `Button.module.css`, `Button.test.tsx`

### Large Diffs

For files with >500 line changes:
- Consider splitting if logically separable
- Add detailed body explaining the change
- Reference related issues/PRs

## Edge Cases

### Untracked vs Modified

- Untracked files: Analyze content to determine category
- Modified files: Use git diff to understand change type
- Deleted files: Include with related deletions

### Binary Files

- Images, fonts: Include with related component
- Lock files: Commit with package.json

### Merge Conflicts

- Skip files with unresolved conflicts
- Warn user about uncommitted conflicts

## Output Format

```
=== Smart Commit Analysis ===

Found 47 uncommitted files across 8 categories:

Infrastructure (3 files):
  - package.json, package-lock.json, tsconfig.json

Core Source (8 files):
  - src/main/services/note.service.ts
  - src/renderer/store/note.store.ts
  ...

Components (12 files):
  - src/renderer/components/modules/editor/EditorPane.tsx
  - src/renderer/components/modules/editor/EditorToolbar.tsx
  ...

Styles (4 files):
  - src/renderer/styles/variables.css
  - src/renderer/styles/globals.css
  ...

BMad Artifacts (15 files):
  Planning: 4 files
  Stories: 8 files
  Sprint: 2 files
  Retro: 1 file

Tests (5 files):
  - src/renderer/store/note.store.test.ts
  ...

---

Creating commits...

✓ chore(deps): upgrade React to 19.2.0
✓ feat(store): implement note and notebook state management
✓ feat(editor): add EditorPane and EditorToolbar components
✓ style: define Pure Memo design system variables
✓ feat(story:1-1): implement basic note creation flow
✓ docs(bmad-planning): update architecture with IPC patterns
✓ chore(sprint): update sprint status for week 2
✓ test(store): add note store unit tests

=== Summary ===
Created 8 commits from 47 files
```

## Usage Examples

**User says**: "smart commit" or "分类提交"

**You should**:
1. Run `git status --porcelain` to get uncommitted files
2. Categorize each file using the rules above
3. Group related files together
4. Generate commit messages following Conventional Commits
5. Execute commits in priority order
6. Output summary report

**User says**: "commit all the BMad files"

**You should**:
1. Filter for BMad-related files only
2. Group by artifact type (planning/stories/sprint/retro)
3. Create separate commits for each type
4. Output summary

**User says**: "只提交组件相关的改动"

**You should**:
1. Filter for component files only
2. Group by module (editor, navigation, etc.)
3. Create commits for each module
4. Output summary
