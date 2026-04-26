# Standards Checker

Validate that development agents follow project standards and BMad workflow.

## Purpose

Ensure all code follows:
- File size limits (max 300 lines)
- Directory structure conventions
- Naming conventions
- React/TypeScript standards
- Design system compliance
- BMad workflow requirements

## Checks Performed

| Check | Standard | Action on Failure |
|-------|----------|-------------------|
| File Size | Max 300 lines | Split into smaller files |
| Directory Structure | `docs/standards/project-structure.md` | Reorganize files |
| Naming Conventions | `docs/standards/naming-conventions.md` | Rename files/identifiers |
| React Standards | `docs/standards/react-standards.md` | Refactor components |
| TypeScript Standards | `docs/standards/typescript-standards.md` | Fix type issues |
| Hook Standards | `docs/standards/hooks-standards.md` | Refactor hooks |
| Design System | `design-system/MASTER.md` | Fix UI implementation |
| BMad Workflow | Story file exists, AC met | Create missing docs |

## Spawn Timing

After each development phase, before QA phase.

## Standards Checker Prompt

```javascript
Agent({
  name: "standards-checker",
  description: "Standards Check: Validate code follows all standards",
  subagent_type: "bmad-architect",
  run_in_background: false,  // MUST be sequential
  prompt: `
## MANDATORY: Read ALL Project Standards
Read ALL files in docs/standards/ directory, plus:
- CLAUDE.md
- design-system/claude-code-skills-manager/MASTER.md
- docs/standards/bmad-workflow.md

## Task: Standards Validation

Check the following files for compliance:
[LIST OF FILES TO CHECK]

## Validation Checklist

### 1. File Size Check
- Max 300 lines per file
- List any files exceeding limit
- Suggest how to split oversized files

### 2. Directory Structure Check
- Follow docs/standards/project-structure.md
- Check file locations match conventions
- List any misplaced files

### 3. Naming Conventions Check
- Follow docs/standards/naming-conventions.md
- Check file names, component names, function names
- List any violations

### 4. React Standards Check
- Follow docs/standards/react-standards.md
- Check component structure, props, hooks usage
- List any violations

### 5. TypeScript Standards Check
- Follow docs/standards/typescript-standards.md
- Check type definitions, imports, exports
- List any violations

### 6. Design System Check (for UI files)
- Follow design-system/claude-code-skills-manager/MASTER.md
- Check CSS classes, tokens usage
- List any violations

### 7. BMad Workflow Check
- Check Story file exists in _bmad-output/
- Check acceptance criteria defined
- Check implementation matches story requirements
- List any missing BMad artifacts

## Output Format

\`\`\`markdown
## Standards Validation Report

### Summary
- Files Checked: X
- Violations Found: Y
- Status: PASS/FAIL

### Violations (if any)
| File | Check | Issue | Fix Suggestion |
|------|-------|-------|----------------|
| ... | ... | ... | ... |

### Required Fixes
[List of fixes that MUST be applied before proceeding]
\`\`\`

## CRITICAL
- If ANY violations found, list them clearly
- Do NOT proceed to next phase until all violations are fixed
- Spawn a fix agent if violations found
`
})
```

## Validation Flow

```
Development Phase Complete
        ↓
Spawn Standards Checker (run_in_background: false)
        ↓
    ┌───────────────────┐
    │ Validation Report │
    └───────────────────┘
        ↓
   ┌────┴────┐
   │         │
 PASS      FAIL
   │         │
   ↓         ↓
Continue   Spawn Fix Agent
to Next    → Fix violations
Phase      → Re-run Standards Checker
```

## Standards by Agent Type

| Agent Type | Standards to Read |
|------------|-------------------|
| Core Developer | ALL mandatory standards |
| Component Developer | ALL + design-system (CRITICAL) |
| Utility Developer | CLAUDE.md, typescript-standards, hooks-standards |
| Standards Checker | ALL docs/standards/*, CLAUDE.md, design-system, bmad-workflow |
| QA Engineer | CLAUDE.md, testing-standards, react-standards |
| Code Quality | CLAUDE.md, typescript-standards, react-standards |
