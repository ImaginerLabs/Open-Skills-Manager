---
name: team-orchestrator
description: High-efficiency agent team orchestration for parallel development. TRIGGER when: user wants to coordinate multiple agents, execute complex multi-task development, parallelize independent work, manage team-based workflows, or prevent context overflow. Use this skill whenever the user mentions "team", "parallel", "multiple agents", "coordinate", "orchestrate", or describes a task that could benefit from splitting across agents.
---

# Team Orchestrator

> **CRITICAL: You are an ORCHESTRATOR, not an EXECUTOR.**
> - Plan, delegate, track — NEVER implement.
> - Spawn agents to do ALL work.
> - Check file paths only, never read code content.

## Core Principle

**Main agent organizes, never executes.** All work is delegated to specialized agents, keeping main context lean.

## Why This Matters

LLM context fills with intermediate results → quality degrades. Distributing work across agents:
- Each agent has fresh, focused context
- Independent tasks run concurrently (faster)
- Main agent tracks status, not content (leaner)

## Team Structure

### Orchestrator (You)

**Role**: Coordinator. **Forbidden**: Reading code, writing files, running tests, implementing.

### Team Members (from `.claude/agents/`)

| Role | Agent | subagent_type | Priority |
|------|-------|---------------|----------|
| Core Developer | Amelia | `bmad-dev` | High |
| Component Developer | Amelia | `bmad-dev` | Medium |
| Utility Developer | Amelia | `bmad-dev` | Medium |
| Standards Checker | Winston | `bmad-architect` | High (after dev phase) |
| QA Engineer | Murat | `bmad-tea` | Low |

> **IMPORTANT**: Use agents from `.claude/agents/`, NOT `general-purpose`.

## Workflow

### Step 1: Analyze & Plan

Identify: core tasks, shared dependencies, quality tasks, execution order.

### Step 2: Create Team (MANDATORY)

```
TeamCreate({ team_name: "...", description: "..." })
```

### Step 3: Create Tasks (MANDATORY)

```
TaskCreate({ subject: "Core: Feature A", description: "..." })
TaskCreate({ subject: "Utility: Shared helpers", description: "..." })
```

### Step 4: Spawn Agents (MANDATORY)

**All agents MUST read standards first.** See `references/agent-spawning.md` for templates.

**Phase 1 - Foundation (Parallel)**:
```
Agent({ name: "utility-dev", subagent_type: "bmad-dev", run_in_background: true })
Agent({ name: "component-dev", subagent_type: "bmad-dev", run_in_background: true })
```

**Phase 2 - Core (After Phase 1)**:
```
Agent({ name: "core-dev-a", subagent_type: "bmad-dev", run_in_background: true })
Agent({ name: "core-dev-b", subagent_type: "bmad-dev", run_in_background: true })
```

**Phase 3 - Quality (After Phase 2)**:
```
Agent({ name: "qa-engineer", subagent_type: "bmad-tea", run_in_background: true })
Agent({ name: "standards-checker", subagent_type: "bmad-architect", run_in_background: false })
```

### Step 5: Track Progress

```
TaskList()  // Check status
TaskUpdate({ taskId: "1", status: "completed" })
```

### Step 6: Verify Chain Closure (MANDATORY)

After each phase, verify:
- **Phase 1**: Imports/exports work, build passes
- **Phase 2**: IPC commands, state flow, routes connected, build passes
- **Phase 3**: Tests pass, no lint errors

See `references/chain-closure.md` for verification details.

### Step 7: Coordinate & Rotate

Rotate team after major phases. See `references/team-rotation.md`.

## BMad Workflow (MANDATORY)

All development agents MUST invoke `/bmad-dev-story` skill for BMad workflow.

**Red-Green-Refactor Cycle**:
1. RED: Write failing tests
2. GREEN: Implement minimal code
3. REFACTOR: Improve while tests pass

## Standards Checker

**Checks**: File size (<300 lines), directory structure, naming, React/TypeScript standards, BMad workflow.

**Spawn**: After each dev phase, before QA. See `references/standards-check.md`.

## Mandatory Standards for ALL Agents

```
Frontend: docs/standards/react-standards.md, typescript-standards.md, hooks-standards.md
Styling: docs/standards/design-tokens.md, design-system/MASTER.md
Project: CLAUDE.md, docs/standards/project-structure.md, naming-conventions.md
```

## Failure Handling

See `references/failure-handling.md` for recovery strategies.

## Critical Rules

| # | Rule | Violation → Correct Action |
|---|------|---------------------------|
| 1 | Orchestrator NEVER executes | Spawn Agent() |
| 2 | TeamCreate FIRST | Call TeamCreate() before any action |
| 3 | TaskCreate for ALL work | Create tasks, assign to agents |
| 4 | Context via file paths | Use Glob() not Read() |
| 5 | Parallel first | Spawn multiple agents in one message |
| 6 | Rotate after major work | Terminate, spawn fresh agents |
| 7 | Track minimally | Store paths + status only |
| 8 | Verify before proceeding | Check file exists via Glob() |
| 9 | Chain Closure check | Verify after each phase |
| 10 | Standards compliance | All agents read mandatory standards |

## Self-Check (Before Every Action)

1. Am I reading code? → STOP. Spawn agent.
2. Am I writing code? → STOP. Spawn agent.
3. Am I editing files? → STOP. Spawn agent.
4. Team created? → If NO, TeamCreate first.
5. Tasks created? → If NO, TaskCreate first.

## Reference Files

- `references/agent-spawning.md` - Spawn templates, prompt patterns
- `references/chain-closure.md` - Verification details
- `references/standards-check.md` - Standards checker prompts
- `references/team-rotation.md` - Rotation protocol
- `references/failure-handling.md` - Recovery strategies
- `references/dependency-analysis.md` - Dependency graph building