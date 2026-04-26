---
name: team-orchestrator
description: High-efficiency agent team orchestration for parallel development. TRIGGER when: user wants to coordinate multiple agents, execute complex multi-task development, parallelize independent work, manage team-based workflows, or prevent context overflow. Use this skill whenever the user mentions "team", "parallel", "multiple agents", "coordinate", "orchestrate", or describes a task that could benefit from splitting across agents.
---

# Team Orchestrator

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

## Agent Roles

| Role | Purpose | When to Use |
|------|---------|-------------|
| **Orchestrator** (You) | Plan, delegate, track - never execute | Always |
| **Specialist** | Domain expert (architect, dev, UX) | Complex domain work |
| **Worker** | General implementation | Tests, docs, simple features |
| **Utility** | Shared helpers | Reusable utilities, common functions |

## Workflow

### Step 1: Decompose Task

Break request into atomic units:
1. Identify all sub-tasks
2. Group by type (domain vs general)
3. Mark dependencies
4. Identify shared/common tasks

### Step 2: Analyze Dependencies

Build dependency graph to determine execution order.

**Read**: `references/dependency-analysis.md` for detailed guidance.

**Quick rules**:
- Level 0 (no deps) → Execute immediately
- Level N (deps on N-1) → Wait for dependencies
- Same level, no mutual deps → Parallel candidates

### Step 3: Assign Roles

Match tasks to agent types:

| Task Type | Agent Type |
|-----------|------------|
| Architecture, complex features | Specialist |
| Shared utilities, helpers | Utility |
| Tests, docs, CRUD | Worker |

### Step 4: Execute

Spawn agents according to dependency levels.

**Read**: `references/agent-spawning.md` for spawn templates.

**Parallel spawn pattern**:
```
Agent({ description: "Task A", prompt: "...", run_in_background: true })
Agent({ description: "Task B", prompt: "...", run_in_background: true })
Agent({ description: "Task C", prompt: "...", run_in_background: true })
// All start immediately, run concurrently
```

**Sequential spawn pattern**:
```
Agent({ description: "Task A", prompt: "...", run_in_background: false })
// Wait for completion, verify output
Agent({ description: "Task B", prompt: "...Read ${outputA}...", run_in_background: false })
```

### Step 5: Track Progress

Maintain lean tracking (file paths only, never content):

```markdown
## Team Status

| Agent | Task | Status | Output |
|-------|------|--------|--------|
| A | Core module | running | - |
| B | Utilities | complete | src/utils/parser.ts |
| C | Tests | pending | - |

Phase 1: 2/3 complete
```

### Step 6: Rotate Team

After major phase completion, rotate agents to reset context.

**Read**: `references/team-rotation.md` for rotation protocol.

**Triggers**:
- Phase complete
- Context approaching limits (>80% tokens)
- Complex debugging done

**Protocol**:
1. Write state to `.team-state/phase-N-summary.md`
2. Terminate current agents
3. Spawn fresh agents
4. New agents read state file for context

## Failure Handling

When agents fail or timeout, recover gracefully.

**Read**: `references/failure-handling.md` for recovery strategies.

**Quick recovery**:
- **Timeout**: Check partial output, split task if needed
- **Invalid output**: Spawn fix agent with error context
- **Dependency failed**: Mark blocked, fix dependency first
- **Repeated failures**: Escalate to user

## On Activation

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
4. **Execute after approval**

## Examples

### Example 1: Multi-Module Parallel

**User**: "Create user, product, and order modules"

**Analysis**: 3 independent modules, no dependencies

**Execution**:
```
Phase 1 (Parallel):
├── Agent 1: User module
├── Agent 2: Product module
└── Agent 3: Order module

Phase 2 (Sequential):
└── Agent 4: Integration tests
```

### Example 2: Shared Utilities

**User**: "Build API layer with auth and logging"

**Analysis**: Auth + logging are shared utilities

**Execution**:
```
Phase 1 (Parallel - Utilities):
├── Utility Agent: Auth middleware
└── Utility Agent: Logging middleware

Phase 2 (Parallel - Routes):
├── Agent A: User routes
├── Agent B: Product routes
└── Agent C: Order routes

Phase 3 (Sequential):
└── Agent D: Integration tests

Rotation: After Phase 2
```

## Critical Rules

1. **Orchestrator never executes** - Delegate all work
2. **Context via files** - Pass file paths, not content
3. **Parallel first** - Default to concurrent execution
4. **Rotate after major work** - Fresh agents reset context
5. **Track minimally** - File paths + status only
6. **Verify before proceeding** - Check outputs exist