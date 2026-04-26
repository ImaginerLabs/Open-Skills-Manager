# Agent Spawning Patterns

Templates and patterns for spawning different types of agents.

## Core Pattern: Task-Context-Output

Every agent spawn follows this structure:

```javascript
Agent({
  description: "<what this agent does>",
  prompt: `
## Task
<specific, actionable instructions>

## Context
<files to read, dependencies>

## Output
<where to write, what to return>

## Constraints
<rules to follow>
  `,
  subagent_type: "<appropriate-type>",
  run_in_background: <true for parallel, false for sequential>
})
```

## BMad Development Agent Template

**CRITICAL**: All development agents MUST invoke `/bmad-dev-story` skill.

```javascript
Agent({
  name: "core-dev",
  description: "Core: Implement Story X",
  subagent_type: "bmad-dev",
  run_in_background: true,
  prompt: `
## MANDATORY: Use BMad Development Workflow

**CRITICAL**: You MUST invoke the /bmad-dev-story skill to load the BMad development workflow.

### Step 1: Invoke BMad Dev Story Skill
Run: /bmad-dev-story

This will load:
- Story file from _bmad-output/
- Project context and coding standards
- Red-green-refactor development cycle
- Test-first discipline
- Definition of Done validation

### Step 2: Read ALL Mandatory Standards

**Frontend Development Standards (MANDATORY)**:
- docs/standards/react-standards.md      # React component standards
- docs/standards/typescript-standards.md # TypeScript standards
- docs/standards/hooks-standards.md      # Hook standards
- docs/standards/state-management.md     # Zustand state management
- docs/standards/component-library.md    # Component library reuse

**Styling Standards (MANDATORY)**:
- docs/standards/design-tokens.md        # Design tokens
- design-system/claude-code-skills-manager/MASTER.md  # Design system (CRITICAL)

**Project Standards (MANDATORY)**:
- CLAUDE.md                              # Project overview
- docs/standards/project-structure.md    # Directory structure
- docs/standards/naming-conventions.md   # Naming conventions

### Step 3: Implement Story
Follow the BMad workflow exactly:
1. Load story file
2. Implement tasks in order (red-green-refactor)
3. Write tests FIRST
4. Run all tests
5. Mark tasks complete only when tests pass
6. Update story status to "review"

## Story File
Story path: _bmad-output/stories/story-X-Y-name.md

## Output
- Implemented code following ALL standards
- All tests passing
- Story status updated to "review"
`
})
```

## Utility Agent Template

For shared, reusable components.

```javascript
Agent({
  description: "Utility: {utility-name}",
  prompt: `
## Task
Create a reusable {utility-name} that multiple modules can use.

## Requirements
- {requirement-1}
- {requirement-2}
- Must be self-contained (no external deps beyond standard lib)

## Output
- Write to: src/utils/{utility-name}.ts
- Export: {export-signature}
- Return: file path + usage example

## Constraints
- Single responsibility: {specific-purpose}
- Well-documented with JSDoc
- Include type definitions
  `,
  subagent_type: "bmad-dev",
  run_in_background: true
})
```

## Standards Checker Template

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
1. File Size: Max 300 lines per file
2. Directory Structure: Follow project-structure.md
3. Naming Conventions: Follow naming-conventions.md
4. React Standards: Follow react-standards.md
5. TypeScript Standards: Follow typescript-standards.md
6. BMad Workflow: Story file exists, acceptance criteria met

## Output
Report violations or PASS. If FAIL, list required fixes.
`
})
```

## Parallel Spawn Pattern

For multiple independent tasks, spawn all in one message:

```javascript
// Single message, multiple Agent calls
Agent({ description: "Task A", prompt: "...", run_in_background: true })
Agent({ description: "Task B", prompt: "...", run_in_background: true })
Agent({ description: "Task C", prompt: "...", run_in_background: true })

// Main agent continues, receives notifications as each completes
```

## Sequential Spawn Pattern

For dependent tasks, spawn one at a time:

```javascript
// First task
const result1 = await Agent({
  description: "Task A",
  prompt: "...",
  run_in_background: false
})

// Verify output exists
if (!fs.existsSync(result1.outputPath)) {
  throw new Error("Task A failed")
}

// Second task (depends on first)
const result2 = await Agent({
  description: "Task B",
  prompt: `
## Context
Read output from Task A: ${result1.outputPath}
...
  `,
  run_in_background: false
})
```

## Return Format

All agents should return a consistent format:

```json
{
  "status": "success|failed",
  "outputPath": "path/to/output/file",
  "summary": "100-word summary of what was done",
  "notes": "any important notes or warnings"
}
```

Main agent only stores this metadata, never the full output content.

## Standards by Agent Type

| Agent Type | Standards to Read |
|------------|-------------------|
| **Core Developer** | ALL mandatory standards (frontend + styling + project) |
| **Component Developer** | ALL mandatory standards - Design system CRITICAL |
| **Utility Developer** | CLAUDE.md, typescript-standards, hooks-standards, naming-conventions |
| **Standards Checker** | ALL docs/standards/*, CLAUDE.md, design-system/MASTER.md, bmad-workflow.md |
| **QA Engineer** | CLAUDE.md, testing-standards, react-standards, typescript-standards |
| **Code Quality** | CLAUDE.md, typescript-standards, react-standards, design-tokens |
