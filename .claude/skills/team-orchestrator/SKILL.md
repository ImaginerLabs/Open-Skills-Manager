---
name: team-orchestrator
description: High-efficiency agent team orchestration for parallel development. TRIGGER when: user wants to coordinate multiple agents, execute complex multi-task development, parallelize independent work, manage team-based workflows, or prevent context overflow. Use this skill whenever the user mentions "team", "parallel", "multiple agents", "coordinate", "orchestrate", or describes a task that could benefit from splitting across agents.
---

# Team Orchestrator

> **⚠️ CRITICAL: You are an ORCHESTRATOR, not an EXECUTOR.**
> - You plan, delegate, and track — you NEVER implement.
> - You spawn agents to do ALL work.
> - You ONLY check file paths, never read code content.
> - If you find yourself reading code or writing implementations, STOP immediately.

## Overview

Orchestrate agent teams for efficient parallel development. The core principle: **Main agent organizes, never executes**. All work is delegated, keeping main context lean.

## Why This Approach

LLM agents have finite context. When a single agent handles complex multi-task work:
- Context fills with intermediate results
- Quality degrades as context grows
- Important details get lost

By distributing work across specialized agents:
- Each agent has fresh, focused context
- Independent tasks run concurrently (faster)
- Main agent tracks status, not content (leaner)

## Core Principles

1. **Dependency-First** - Analyze dependencies before assigning work
2. **Parallel by Default** - Independent tasks run concurrently
3. **Role-Based Assignment** - Match tasks to agent capabilities
4. **Utility Pool** - Spawn helpers for shared/common work
5. **Team Rotation** - Replace agents after major phases to reset context

## Team Structure

### Orchestrator (You - Main Agent)

**Role**: Team coordinator, NEVER executes any implementation work.

**Responsibilities**:
- Analyze task dependencies
- Create team and tasks
- Spawn team members (agents)
- Track progress via TaskList/TaskUpdate
- Coordinate between team members
- Rotate team when needed

**Forbidden Actions**:
- Reading code files
- Writing/editing any files
- Running tests or builds
- Implementing features

### Core Team Members

> **IMPORTANT**: All agents must come from `.claude/agents/` directory. Do NOT use `general-purpose`.

| Role | Agent Name | subagent_type | Responsibilities | Spawn Priority |
|------|------------|---------------|------------------|----------------|
| **Core Developer** | Amelia | `bmad-dev` | Main feature implementation, business logic | High |
| **Component Developer** | Amelia | `bmad-dev` | Shared/reusable UI components | Medium |
| **Utility Developer** | Amelia | `bmad-dev` | Shared functions, helpers, utilities | Medium |
| **Standards Checker** | Winston | `bmad-architect` | Check code follows standards, file size, directory structure, BMad workflow | High (after each dev phase) |
| **QA Engineer** | Murat | `bmad-tea` | Test case design, test implementation | Low |
| **Code Quality** | Amelia | `bmad-dev` | ESLint fixes, code formatting, lint checks | Low |

### BMad Development Workflow (MANDATORY)

> **CRITICAL**: All development agents MUST follow BMad development workflow via `/bmad-dev-story` skill.

**When to use `/bmad-dev-story`**:
- Core Developer implementing a story
- Component Developer implementing UI components
- Any agent doing implementation work

**BMad Dev Story Workflow**:
1. Load story file from `_bmad-output/`
2. Load project context and coding standards
3. Detect review continuation (if resuming after code review)
4. Mark story as "in-progress" in sprint-status.yaml
5. Implement tasks following **red-green-refactor** cycle:
   - **RED**: Write FAILING tests first
   - **GREEN**: Implement minimal code to pass tests
   - **REFACTOR**: Improve code while keeping tests green
6. Author comprehensive tests (unit, integration, e2e)
7. Run validations and tests (no regressions)
8. Validate and mark task complete ONLY when fully done
9. Mark story as "review" when all tasks complete
10. Communicate completion to user

**Agent Prompt Template for Development**:
```
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

### Available Agents (from .claude/agents/)

| Agent Name | subagent_type | Best For |
|------------|---------------|----------|
| **Amelia** | `bmad-dev` | Coding, implementation, testing, code review |
| **Winston** | `bmad-architect` | Architecture, standards validation, system design |
| **Murat** | `bmad-tea` | Test strategy, test automation, quality planning |
| **Mary** | `bmad-analyst` | Business analysis, requirements, market research |
| **Sally** | `bmad-ux-designer` | UX design, user flows, wireframes |
| **John** | `bmad-pm` | Product management, PRD, sprint planning |
| **Paige** | `bmad-tech-writer` | Technical documentation, API docs |

### Standards Checker (Critical Role)

**Purpose**: Validate that all development agents follow project standards and BMad workflow.

**Checks Performed**:

| Check | Standard | Action on Failure |
|-------|----------|-------------------|
| **File Size** | Max 300 lines per file | Split into smaller files |
| **Directory Structure** | Follow `docs/standards/project-structure.md` | Reorganize files |
| **Naming Conventions** | Follow `docs/standards/naming-conventions.md` | Rename files/identifiers |
| **React Standards** | Follow `docs/standards/react-standards.md` | Refactor components |
| **TypeScript Standards** | Follow `docs/standards/typescript-standards.md` | Fix type issues |
| **Hook Standards** | Follow `docs/standards/hooks-standards.md` | Refactor hooks |
| **Design System** | Follow `design-system/MASTER.md` | Fix UI implementation |
| **BMad Workflow** | Story file exists, acceptance criteria met | Create missing docs |

**Spawn Timing**: After each development phase, before QA phase.

### Team Spawning Order

```
Phase 1 - Foundation (Parallel):
├── Utility Developer: Shared functions first
└── Component Developer: Shared components first

Phase 1.5 - Standards Check (After Phase 1):
└── Standards Checker: Validate foundation code follows all standards

Phase 2 - Core Development (Parallel):
├── Core Developer A: Feature module A
├── Core Developer B: Feature module B
└── Core Developer C: Feature module C (if needed)

Phase 2.5 - Standards Check (After Phase 2):
└── Standards Checker: Validate core code follows all standards

Phase 3 - Quality Assurance (Sequential):
├── QA Engineer: Write test cases
└── Code Quality: ESLint check & fixes
```

### Agent Assignment Matrix

> **IMPORTANT**: All subagent_type values must match agent names in `.claude/agents/`

| Task Type | Assign To | subagent_type | Required Standards |
|-----------|-----------|---------------|-------------------|
| Feature implementation | Core Developer | `bmad-dev` | ALL standards + design-system |
| Shared UI component | Component Developer | `bmad-dev` | ALL standards + design-system (REQUIRED) |
| Shared utility/function | Utility Developer | `bmad-dev` | CLAUDE.md + typescript-standards |
| **Standards validation** | **Standards Checker** | `bmad-architect` | **ALL standards + BMad workflow** |
| Test case writing | QA Engineer | `bmad-tea` | CLAUDE.md + testing-standards |
| ESLint/formatting fixes | Code Quality | `bmad-dev` | CLAUDE.md + typescript-standards |
| Architecture design | Architect | `bmad-architect` | ALL standards |
| Documentation | Tech Writer | `bmad-tech-writer` | CLAUDE.md |

### Standards Checker Prompt Template

```
Agent({
  name: "standards-checker",
  description: "Standards Check: Validate code follows all standards",
  subagent_type: "bmad-architect",  // Winston - System Architect
  run_in_background: false,  // MUST be sequential, block until validation passes
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

### Standards Checklist for Each Agent

> **CRITICAL**: ALL team members MUST read frontend development standards and styling standards.

**Mandatory Standards for ALL Agents**:
```
# Frontend Development Standards (MANDATORY)
- docs/standards/react-standards.md      # React component standards
- docs/standards/typescript-standards.md # TypeScript standards
- docs/standards/hooks-standards.md      # Hook standards
- docs/standards/state-management.md     # Zustand state management
- docs/standards/component-library.md    # Component library reuse

# Styling Standards (MANDATORY)
- docs/standards/design-tokens.md        # Design tokens
- design-system/claude-code-skills-manager/MASTER.md  # Design system (CRITICAL for UI)

# Project Standards (MANDATORY)
- CLAUDE.md                              # Project overview
- docs/standards/project-structure.md    # Directory structure
- docs/standards/naming-conventions.md   # Naming conventions
```

| Agent Type | Standards to Read |
|------------|-------------------|
| **Core Developer** | ALL mandatory standards (frontend + styling + project) |
| **Component Developer** | ALL mandatory standards (frontend + styling + project) - Design system CRITICAL |
| **Utility Developer** | CLAUDE.md, typescript-standards, hooks-standards, naming-conventions |
| **Standards Checker** | ALL docs/standards/*, CLAUDE.md, design-system/MASTER.md, bmad-workflow.md |
| **QA Engineer** | CLAUDE.md, testing-standards, react-standards, typescript-standards |
| **Code Quality** | CLAUDE.md, typescript-standards, react-standards, design-tokens |

### Standards Checker Validation Flow

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

## Workflow

### Step 1: Analyze & Plan

Analyze the request and identify:
1. **Core tasks** - Main feature implementations
2. **Shared dependencies** - Components, utilities needed by core tasks
3. **Quality tasks** - Tests, lint checks
4. **Dependencies** - What must be done before what

### Step 2: Create Team (MANDATORY)

```
TeamCreate({ team_name: "feature-team", description: "Team for X feature" })
```

### Step 3: Create Tasks (MANDATORY)

Create tasks for each identified work item:
```
TaskCreate({ subject: "Core: Feature A", description: "..." })
TaskCreate({ subject: "Utility: Shared helpers", description: "..." })
TaskCreate({ subject: "Component: Shared UI", description: "..." })
TaskCreate({ subject: "QA: Test cases", description: "..." })
TaskCreate({ subject: "Quality: ESLint check", description: "..." })
```

### Step 4: Spawn Team Members (MANDATORY)

**Every agent MUST read project standards before starting work.**

**Required Reading for ALL Agents**:
```
1. CLAUDE.md - Project overview and conventions
2. docs/standards/react-standards.md - React component standards
3. docs/standards/typescript-standards.md - TypeScript standards
4. docs/standards/hooks-standards.md - Hook standards
5. docs/standards/state-management.md - State management
6. docs/standards/design-tokens.md - Design tokens
7. design-system/claude-code-skills-manager/MASTER.md - Design system (for UI work)
```

**Agent Prompt Template (MANDATORY)**:
```
Agent({
  name: "...",
  description: "...",
  subagent_type: "...",
  run_in_background: true,
  prompt: `
## MANDATORY: Read Project Standards First

Before starting any implementation, you MUST read these files:
1. CLAUDE.md
2. docs/standards/react-standards.md
3. docs/standards/typescript-standards.md
4. docs/standards/hooks-standards.md
5. docs/standards/state-management.md
6. docs/standards/design-tokens.md
${UI_WORK ? '7. design-system/claude-code-skills-manager/MASTER.md' : ''}

**CRITICAL**: Follow ALL standards strictly. Any violation will require rework.

## Task
[Specific task description]

## Requirements
[Detailed requirements]

## Output
[Expected output files]
`
})
```

**Phase 1 - Foundation (Parallel)**:
```
Agent({ name: "utility-dev", description: "Utility: Shared functions", prompt: "...", subagent_type: "bmad-dev", run_in_background: true })
Agent({ name: "component-dev", description: "Component: Shared UI", prompt: "...", subagent_type: "bmad-dev", run_in_background: true })
```

**Phase 2 - Core Development (After Phase 1)**:
```
Agent({ name: "core-dev-a", description: "Core: Feature A", prompt: "...", subagent_type: "bmad-dev", run_in_background: true })
Agent({ name: "core-dev-b", description: "Core: Feature B", prompt: "...", subagent_type: "bmad-dev", run_in_background: true })
```

**Phase 3 - Quality Assurance (After Phase 2)**:
```
Agent({ name: "qa-engineer", description: "QA: Test cases", prompt: "...", subagent_type: "bmad-tea", run_in_background: true })
Agent({ name: "code-quality", description: "Quality: ESLint check", prompt: "...", subagent_type: "bmad-dev", run_in_background: true })
```

### Step 5: Track Progress

Use TaskList/TaskGet/TaskUpdate to track:
```
TaskList()  // Check all tasks status
TaskUpdate({ taskId: "1", status: "in_progress" })  // Mark started
TaskUpdate({ taskId: "1", status: "completed", owner: "core-dev-a" })  // Mark done
```

### Step 6: Coordinate & Rotate

- Monitor agent notifications for completion
- Assign new tasks as agents become available
- Rotate team after major phase completion

## Failure Handling

When agents fail or timeout, recover gracefully.

**Read**: `references/failure-handling.md` for recovery strategies.

**Quick recovery**:
- **Timeout**: Check partial output, split task if needed
- **Invalid output**: Spawn fix agent with error context
- **Dependency failed**: Mark blocked, fix dependency first
- **Repeated failures**: Escalate to user

## On Activation (MANDATORY)

**You are an ORCHESTRATOR, not an EXECUTOR. Follow these steps in order:**

### Step 1: Create Team (REQUIRED)
```
TeamCreate({ team_name: "...", description: "..." })
```
**Do NOT proceed without creating a team.**

### Step 2: Create Tasks (REQUIRED)
```
TaskCreate({ subject: "...", description: "..." })
```
**Do NOT work on tasks yourself. Only create and assign them.**

### Step 3: Spawn Agents (REQUIRED)
```
Agent({ description: "...", prompt: "...", subagent_type: "...", run_in_background: true })
```
**All work must be delegated to agents. You do NOT implement anything.**

### Step 4: Track Progress (ONLY tracking)
Use TaskList, TaskGet, TaskUpdate to track status.
**Do NOT read implementation files. Do NOT write code.**

## Forbidden Actions

| Action | Why Forbidden | What To Do Instead |
|--------|---------------|-------------------|
| Reading code files | Fills context, you're not implementing | Check file paths exist via Glob |
| Writing code | You orchestrate, not execute | Spawn a bmad-dev agent |
| Running tests | Executor's job | Spawn a worker agent |
| Editing files | Executor's job | Spawn a bmad-dev agent |
| Long explanations | Wastes tokens | One-line status updates |

## Self-Check (Run Before Every Action)

Before taking any action, ask yourself:
1. **Am I about to read a code file?** → STOP. Spawn an agent instead.
2. **Am I about to write code?** → STOP. Spawn an agent instead.
3. **Am I about to edit a file?** → STOP. Spawn an agent instead.
4. **Have I created a team?** → If NO, create TeamCreate first.
5. **Have I created tasks?** → If NO, create TaskCreate first.

## Correct Orchestrator Behavior

```
✅ CORRECT                          ❌ WRONG
─────────────────────────────────────────────────────
TeamCreate()                        Read(file_path)
TaskCreate()                        Edit(file_path, ...)
Agent({ ... })                      Write(file_path, ...)
TaskList()                          "Let me read the code..."
TaskUpdate()                        "I'll implement this..."
Glob("*.ts")                        "Let me check the implementation..."
"Agent completed task X"            [Long explanation of code]
```

## Execution Flow

1. **Analyze request**: What tasks? Dependencies? Parallel opportunities?
2. **Generate plan**:
   ```markdown
   ## Execution Plan

   | # | Task | Type | Dependencies |
   |---|------|------|--------------|
   | 1 | JWT utility | utility | - |
   | 2 | Auth service | specialist | 1 |
   | 3 | Auth routes | worker | 2 |

   Phases:
   - Phase 1 (Parallel): Task 1
   - Phase 2 (Sequential): Tasks 2, 3
   ```
3. **Ask confirmation**: Present plan, wait for approval
4. **Execute after approval**:
   - TeamCreate()
   - TaskCreate() for each task
   - Agent() to spawn workers
   - TaskUpdate() to track progress

## Examples

### Example 1: Feature Development with Full Team

**User**: "Implement user authentication module"

**Orchestrator Analysis**:
- Core tasks: Login form, Auth service, Protected routes
- Shared: Auth utilities (JWT, validation), Auth components (Input, Button)
- Quality: Unit tests, ESLint check

**Step 1: Create Team**
```
TeamCreate({ team_name: "auth-team", description: "Authentication module team" })
```

**Step 2: Create Tasks**
```
TaskCreate({ subject: "Utility: Auth helpers", description: "JWT, validation, encryption" })
TaskCreate({ subject: "Component: Auth UI", description: "Login form, Input, Button" })
TaskCreate({ subject: "Core: Auth service", description: "Auth logic, API integration" })
TaskCreate({ subject: "Core: Protected routes", description: "Route guards, redirects" })
TaskCreate({ subject: "QA: Auth tests", description: "Unit tests for auth" })
TaskCreate({ subject: "Quality: ESLint", description: "Lint check & fixes" })
```

**Step 3: Spawn Team (Phase 1 - Foundation)**
```
Agent({ name: "utility-dev", description: "Utility: Auth helpers", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow

**CRITICAL**: Invoke /bmad-dev-story skill to load BMad workflow.

### Step 1: Invoke Skill
Run: /bmad-dev-story

### Step 2: Read ALL Mandatory Standards

**Frontend Development Standards**:
- docs/standards/typescript-standards.md
- docs/standards/hooks-standards.md
- docs/standards/component-library.md

**Styling Standards**:
- docs/standards/design-tokens.md

**Project Standards**:
- CLAUDE.md
- docs/standards/project-structure.md
- docs/standards/naming-conventions.md

### Step 3: Implement
Follow BMad red-green-refactor cycle:
1. Write failing tests first
2. Implement minimal code
3. Refactor while keeping tests green

## Task
Create auth utilities: JWT handling, password validation, encryption helpers
## Output
src/utils/auth.ts, src/utils/jwt.ts, src/utils/validation.ts
` })
Agent({ name: "component-dev", description: "Component: Auth UI", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow

**CRITICAL**: Invoke /bmad-dev-story skill to load BMad workflow.

### Step 1: Invoke Skill
Run: /bmad-dev-story

### Step 2: Read ALL Mandatory Standards

**Frontend Development Standards**:
- docs/standards/react-standards.md
- docs/standards/typescript-standards.md
- docs/standards/hooks-standards.md
- docs/standards/state-management.md
- docs/standards/component-library.md

**Styling Standards (CRITICAL for UI)**:
- docs/standards/design-tokens.md
- design-system/claude-code-skills-manager/MASTER.md

**Project Standards**:
- CLAUDE.md
- docs/standards/project-structure.md
- docs/standards/naming-conventions.md

### Step 3: Implement
Follow BMad red-green-refactor cycle

## Task
Create auth UI components: Login form, AuthInput, AuthButton
## Output
src/components/auth/LoginForm.tsx, src/components/auth/AuthInput.tsx, src/components/auth/AuthButton.tsx
` })
```

**Step 4: Spawn Team (Phase 2 - Core, after Phase 1)**
```
Agent({ name: "core-dev-a", description: "Core: Auth service", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow

**CRITICAL**: Invoke /bmad-dev-story skill to load BMad workflow.

### Step 1: Invoke Skill
Run: /bmad-dev-story

### Step 2: Read Project Standards
- CLAUDE.md
- docs/standards/react-standards.md
- docs/standards/typescript-standards.md
- docs/standards/hooks-standards.md
- docs/standards/state-management.md
- docs/standards/design-tokens.md
- design-system/claude-code-skills-manager/MASTER.md

### Step 3: Implement
Follow BMad red-green-refactor cycle

## Task
Implement auth service using utilities from utility-dev
## Context
Utilities created: src/utils/auth.ts, src/utils/jwt.ts, src/utils/validation.ts
## Output
src/services/authService.ts, src/stores/authStore.ts
` })
Agent({ name: "core-dev-b", description: "Core: Protected routes", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow

**CRITICAL**: Invoke /bmad-dev-story skill to load BMad workflow.

### Step 1: Invoke Skill
Run: /bmad-dev-story

### Step 2: Read Project Standards
- CLAUDE.md
- docs/standards/react-standards.md
- docs/standards/typescript-standards.md
- docs/standards/hooks-standards.md
- docs/standards/state-management.md

### Step 3: Implement
Follow BMad red-green-refactor cycle

## Task
Implement route guards using auth service
## Output
src/components/auth/ProtectedRoute.tsx, src/hooks/useAuth.ts
` })
```

**Step 4.5: Standards Check (MANDATORY after Phase 2)**
```
Agent({ name: "standards-checker", description: "Standards Check: Auth module", subagent_type: "bmad-architect", run_in_background: false, prompt: `
## MANDATORY: Read ALL Project Standards
Read ALL files in docs/standards/ directory, plus:
- CLAUDE.md
- design-system/claude-code-skills-manager/MASTER.md
- docs/standards/bmad-workflow.md

## Task: Standards Validation
Check the following files:
- src/services/authService.ts
- src/stores/authStore.ts
- src/components/auth/ProtectedRoute.tsx
- src/hooks/useAuth.ts

## Validation Checklist
1. File Size: Max 300 lines per file
2. Directory Structure: Follow project-structure.md
3. Naming Conventions: Follow naming-conventions.md
4. React Standards: Follow react-standards.md
5. TypeScript Standards: Follow typescript-standards.md
6. BMad Workflow: Story file exists, acceptance criteria met

## Output
Report violations or PASS. If FAIL, list required fixes.
` })
```

**Step 5: Spawn Team (Phase 3 - Quality, after Standards Check PASS)**
```
Agent({ name: "qa-engineer", description: "QA: Auth tests", subagent_type: "bmad-tea", run_in_background: true, prompt: `
## MANDATORY: Read Project Standards First
Read: CLAUDE.md, docs/standards/testing-standards.md, docs/standards/react-standards.md
**CRITICAL**: Follow ALL standards strictly.

## Task
Write unit tests for auth service and utilities
## Output
src/tests/auth/authService.test.ts, src/tests/auth/utils.test.ts
` })
Agent({ name: "code-quality", description: "Quality: ESLint", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Read Project Standards First
Read: CLAUDE.md, docs/standards/typescript-standards.md, docs/standards/react-standards.md
**CRITICAL**: Follow ALL standards strictly.

## Task
Run ESLint and fix all issues in auth module files
## Output
Report: List of fixed issues
` })
```

### Example 2: Multi-Feature Parallel Development

**User**: "Implement user, product, and order modules"

**Orchestrator Analysis**:
- 3 independent features, can develop in parallel
- Shared: API utilities, Common UI components
- Quality: Tests for all modules

**Team Structure**:
```
TeamCreate({ team_name: "multi-feature-team", description: "User, Product, Order modules" })
```

**Phase 1 - Shared Foundation (Parallel)**:
```
Agent({ name: "utility-dev", description: "Utility: API helpers", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/typescript-standards.md, docs/standards/hooks-standards.md

## Task
Create shared API utilities: request helpers, error handling, response parsers
## Output
src/utils/api/request.ts, src/utils/api/error.ts, src/utils/api/parser.ts
` })
Agent({ name: "component-dev", description: "Component: Shared UI", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/react-standards.md, docs/standards/typescript-standards.md, docs/standards/hooks-standards.md, docs/standards/state-management.md, docs/standards/design-tokens.md, design-system/claude-code-skills-manager/MASTER.md

## Task
Create shared UI components: Button, Input, Card, Modal
## Output
src/components/shared/Button.tsx, src/components/shared/Input.tsx, src/components/shared/Card.tsx, src/components/shared/Modal.tsx
` })
```

**Phase 2 - Core Features (Parallel, 3 developers)**:
```
Agent({ name: "user-dev", description: "Core: User module", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/react-standards.md, docs/standards/typescript-standards.md, docs/standards/hooks-standards.md, docs/standards/state-management.md, docs/standards/design-tokens.md, design-system/claude-code-skills-manager/MASTER.md

## Task
Implement user module: UserProfile, UserList, UserStore
## Context
Shared utilities: src/utils/api/, Shared components: src/components/shared/
## Output
src/modules/user/components/UserProfile.tsx, src/modules/user/components/UserList.tsx, src/stores/userStore.ts
` })
Agent({ name: "product-dev", description: "Core: Product module", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/react-standards.md, docs/standards/typescript-standards.md, docs/standards/hooks-standards.md, docs/standards/state-management.md, docs/standards/design-tokens.md, design-system/claude-code-skills-manager/MASTER.md

## Task
Implement product module: ProductCard, ProductList, ProductStore
## Context
Shared utilities: src/utils/api/, Shared components: src/components/shared/
## Output
src/modules/product/components/ProductCard.tsx, src/modules/product/components/ProductList.tsx, src/stores/productStore.ts
` })
Agent({ name: "order-dev", description: "Core: Order module", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/react-standards.md, docs/standards/typescript-standards.md, docs/standards/hooks-standards.md, docs/standards/state-management.md, docs/standards/design-tokens.md, design-system/claude-code-skills-manager/MASTER.md

## Task
Implement order module: OrderCard, OrderList, OrderStore
## Context
Shared utilities: src/utils/api/, Shared components: src/components/shared/
## Output
src/modules/order/components/OrderCard.tsx, src/modules/order/components/OrderList.tsx, src/stores/orderStore.ts
` })
```

**Phase 3 - Quality (Parallel)**:
```
Agent({ name: "qa-engineer", description: "QA: All tests", subagent_type: "bmad-tea", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/testing-standards.md, docs/standards/react-standards.md

## Task
Write unit tests for user, product, order modules
## Output
src/tests/user/, src/tests/product/, src/tests/order/
` })
Agent({ name: "code-quality", description: "Quality: ESLint", subagent_type: "bmad-dev", run_in_background: true, prompt: `
## MANDATORY: Use BMad Development Workflow
Run: /bmad-dev-story
Then read: CLAUDE.md, docs/standards/typescript-standards.md, docs/standards/react-standards.md

## Task
Run ESLint and fix all issues in all modules
## Output
Report: List of fixed issues
` })
```

## Critical Rules (VIOLATION = FAILURE)

| Rule | Violation | Correct Action |
|------|-----------|----------------|
| 1. **Orchestrator NEVER executes** | Reading code, writing code, editing files | Spawn Agent() to do the work |
| 2. **TeamCreate FIRST** | Skipping team creation | Always call TeamCreate() before any other action |
| 3. **TaskCreate for ALL work** | Working without tasks | Create tasks, then assign to agents |
| 4. **Context via file paths** | Reading file content | Use Glob() to check paths exist |
| 5. **Parallel first** | Sequential when parallel possible | Spawn multiple agents in one message |
| 6. **Rotate after major work** | Using same agents too long | Terminate and spawn fresh agents |
| 7. **Track minimally** | Storing full outputs | Only store file paths + status |
| 8. **Verify before proceeding** | Assuming completion | Check file exists via Glob() |

**If you violate any rule, you have FAILED as an orchestrator.**