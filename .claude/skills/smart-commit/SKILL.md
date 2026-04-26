---
name: smart-commit
description: |
  Intelligent git commit assistant that analyzes uncommitted changes and automatically chooses the optimal commit strategy based on file count, complexity, and change patterns.

  TRIGGER when: user has uncommitted changes and says "commit", "smart commit", "batch commit", "organize commits", "分类提交", "智能提交", "提交代码"; user runs git status showing multiple files; user wants structured commits for BMad artifacts, source code, configs, or styles.

  Use proactively when you notice uncommitted files that would benefit from organized commits.
---

# Smart Commit - Intelligent Batch Commit Assistant

## Overview

This skill analyzes uncommitted files and automatically selects the optimal commit strategy:

- **Quick Commit**: Single category, low complexity → one focused commit
- **Batch Commit**: Multiple categories or high complexity → organized multi-commit

The strategy is determined by analyzing file count, category diversity, and change complexity.

## Strategy Selection Logic

### Decision Matrix

| File Count | Categories | Complexity | Strategy |
|------------|------------|------------|----------|
| 1-3 files | Single | Low | Quick Commit |
| 1-5 files | Single | Medium | Quick Commit |
| 4-15 files | 2-3 | Low-Medium | Batch Commit (grouped) |
| 6-20 files | 3-5 | Medium | Batch Commit (categorized) |
| 15+ files | 4+ | High | Batch Commit (full analysis) |
| Any | Mixed BMad | Any | Batch Commit (BMad special) |

### Complexity Indicators

**Low Complexity:**
- Same file type (all `.tsx`, all `.css`)
- Same directory/module
- Small diffs (<50 lines per file)
- No cross-file dependencies

**Medium Complexity:**
- 2-3 related file types (component + style)
- Same feature/module area
- Moderate diffs (50-200 lines)
- Some cross-file references

**High Complexity:**
- Multiple unrelated categories
- Large diffs (>200 lines per file)
- New files + modifications mixed
- Cross-module changes
- BMad artifacts present

### Quick Commit Conditions

Use single commit when ALL conditions are met:
1. Files belong to same category
2. Files are logically related (same feature/module)
3. Total diff lines < 300
4. No BMad artifacts mixed in
5. Clear, single intent (feat/fix/style/docs)

### Batch Commit Conditions

Use multi-commit when ANY condition is met:
1. Files span 2+ categories
2. BMad artifacts present (always separate)
3. Total files > 10
4. Unrelated changes (different features)
5. User explicitly requests organization

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
git diff --stat
```

Parse output and collect:
- File paths and status (modified/added/deleted)
- Line change counts per file
- File categories

### Step 2: Determine Strategy

Calculate metrics:
1. **File count** - Total uncommitted files
2. **Category count** - Unique categories present
3. **Complexity score** - Based on diff sizes and cross-file dependencies
4. **BMad presence** - Whether BMad artifacts are included

Apply decision matrix to select strategy:
- **Quick Commit** → Skip to Step 5 with single commit
- **Batch Commit** → Continue to Step 3

### Step 3: Categorize and Group Files

Group files by category and scope:
- Files in same category with same scope → one commit
- Related files (component + style + test) → one commit
- BMad files by artifact type → separate commits

### Step 4: Generate Commit Messages

For each group, generate appropriate commit message:
- Analyze diff to understand change nature
- Use imperative mood, no period at end
- Keep first line under 72 characters
- Add body for complex changes

### Step 5: Execute Commits

For each group:
1. Stage files: `git add <files>`
2. Create commit with generated message
3. Log the commit for user review

### Step 6: Summary Report

Output a summary of all commits created.

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

### Quick Commit Output

```
=== Smart Commit Analysis ===

Strategy: Quick Commit (single category, low complexity)

Files: 3 modified
Category: Components (editor module)
Complexity: Low (45 lines changed)

---
Creating commit...

✓ feat(editor): add toolbar buttons for text formatting

=== Summary ===
Created 1 commit from 3 files
```

### Batch Commit Output

```
=== Smart Commit Analysis ===

Strategy: Batch Commit (multiple categories, medium complexity)

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

### Quick Commit Scenario

**User says**: "commit" (with 2-3 related files)

**You should**:
1. Run `git status --porcelain` and `git diff --stat`
2. Check if files meet Quick Commit conditions
3. If yes: create single focused commit
4. Output Quick Commit summary

**Example**:
```
Files: EditorPane.tsx, EditorPane.module.css (both in editor module)
→ Quick Commit: feat(editor): add EditorPane component with styling
```

### Batch Commit Scenario

**User says**: "smart commit" or "分类提交" (with many files)

**You should**:
1. Run `git status --porcelain` to get uncommitted files
2. Categorize each file using the rules above
3. Group related files together
4. Generate commit messages following Conventional Commits
5. Execute commits in priority order
6. Output Batch Commit summary

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

### Strategy Override

**User says**: "把这些改动分成多个提交" (force batch)

**You should**:
1. Ignore Quick Commit conditions
2. Always use Batch Commit strategy
3. Categorize and group all files
4. Create multiple commits

**User says**: "快速提交" (force quick)

**You should**:
1. Check if single commit is reasonable
2. If too complex, warn user and suggest batch
3. Otherwise create single commit
