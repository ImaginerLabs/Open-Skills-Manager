---
name: bmad-subagent-orchestrator
description: BMad workflow automation with chained subagents for context efficiency. All tasks (sequential and parallel) run in subagents — context passes via files, not conversation history. Main agent only tracks status + file paths, preventing context explosion from large BMad artifacts. TRIGGER when: user wants to execute multiple BMad tasks, coordinate workflows, or automate project phases. NOT for simple status checks or single interactive tasks (use direct agent invocation instead).
---

# BMad Subagent Orchestrator

## Overview

This skill orchestrates BMad agent execution for automated project workflow. It analyzes the current BMad phase and artifacts, identifies task dependencies, determines optimal execution strategy (sequential vs parallel), dispatches appropriate BMad agents, and tracks progress.

## Core Capabilities

| Phase | Agent | Role | Skill |
|-------|-------|------|-------|
| 1-analysis | Mary (Analyst) | Market/Domain Research | `bmad-agent-analyst` |
| 2-planning | John (PM) | PRD Creation | `bmad-agent-pm` |
| 2-planning | Sally (UX) | UX Design | `bmad-agent-ux-designer` |
| 3-solutioning | Winston (Architect) | Architecture | `bmad-agent-architect` |
| 4-implementation | Amelia (Dev) | Story Execution | `bmad-agent-dev` |

## Fast Path Detection

Before loading full orchestration overhead, quickly assess task complexity:

**Fast Path Criteria** (skip orchestration, execute directly):
- Single artifact status check (e.g., "check if PRD exists")
- Simple query about project state
- Direct request to invoke a specific BMad agent
- Task can be completed in < 3 tool calls

**Full Orchestration** (proceed with workflow below):
- Multiple tasks to coordinate
- Tasks with dependencies
- Complex multi-step workflows
- Parallel execution opportunities

**Decision Logic**:
```
IF task is status check OR single artifact query:
    → Fast Path: Scan artifacts directly, report immediately
ELSE IF task involves multiple agents OR dependencies:
    → Full Orchestration: Proceed with Steps 1-5
ELSE:
    → Direct Execution: Invoke appropriate BMad agent immediately
```

## Workflow

### Step 1: Context Discovery

Load project state to understand current position in BMad workflow:

1. **Read config**: `{project-root}/_bmad/bmm/config.yaml` (or `_bmad/config.yaml`)
2. **Scan artifacts**: Check `{planning_artifacts}/` for existing deliverables:
   - `prd*.md` → PRD exists
   - `ux-design*.md` → UX design exists
   - `architecture*.md` → Architecture exists
   - `epics*.md` → Epics/Stories defined
   - `implementation-readiness*.md` → Ready for implementation
3. **Scan implementation**: Check `{implementation_artifacts}/` for story progress
4. **Identify phase**: Determine current BMad phase based on artifact completeness

### Step 2: Dependency Analysis

Analyze task dependencies to determine execution strategy:

```
Dependency Graph Rules:
- PRD → depends on: (optional) Market Research, Domain Research
- UX Design → depends on: PRD
- Architecture → depends on: PRD, (optional) UX Design
- Epics/Stories → depends on: PRD, Architecture
- Implementation Readiness → depends on: PRD, UX, Architecture, Epics
- Sprint Planning → depends on: Implementation Readiness
- Story Execution → depends on: Sprint Planning, Story Validation
```

**Execution Strategy Decision**:

| Condition | Strategy |
|-----------|----------|
| Single task, no dependencies | Direct execution |
| Multiple tasks with dependencies | Sequential (topological order) |
| Multiple tasks, no mutual dependencies | Parallel execution |
| Mixed (some dependent, some independent) | Hybrid: parallel groups, sequential between groups |

### Step 3: Task Planning

Generate execution plan with:

1. **Task list**: Ordered by dependency graph
2. **Agent assignment**: Match task type to BMad agent
3. **Execution mode**: Sequential/Parallel/Hybrid
4. **Estimated effort**: Based on task complexity
5. **Risk flags**: Potential blockers or conflicts

Output format:

```markdown
## Execution Plan

| # | Task | Agent | Mode | Dependencies | Status |
|---|------|-------|------|--------------|--------|
| 1 | Create PRD | John (PM) | Direct | - | pending |
| 2 | Create UX Design | Sally (UX) | Sequential | #1 | pending |
| 3 | Create Architecture | Winston (Architect) | Sequential | #1, #2 | pending |
| 4 | Create Epics | John (PM) | Sequential | #1, #3 | pending |
```

### Step 4: Agent Dispatch

Execute tasks by invoking BMad agent skills directly via Skill tool.

**Task → Agent Mapping**:

| Task Type | BMad Agent | Skill to Invoke |
|-----------|------------|-----------------|
| Market Research, Domain Research, Technical Research | Mary (Analyst) | `bmad-agent-analyst` |
| PRD Creation, Epics Creation | John (PM) | `bmad-agent-pm` |
| UX Design | Sally (UX) | `bmad-agent-ux-designer` |
| Architecture | Winston (Architect) | `bmad-agent-architect` |
| Story Development, Code Implementation | Amelia (Dev) | `bmad-agent-dev` |

**Execution Pattern**:

**For Sequential Execution (Chained Subagents)**:
- Spawn subagent for each task, one at a time
- Each subagent reads required input files from disk (not from conversation context)
- Each subagent writes output to specified path
- Main agent only tracks: task status + file paths (does NOT read full content)
- After each task: verify file exists, record completion
- Optional: pause for user confirmation at checkpoints (configurable)

**Why subagents for sequential tasks**:
- BMad artifacts are large (PRD ~800 lines, Architecture ~1500 lines)
- Main agent context would explode if all intermediate outputs accumulated
- File-based context passing keeps main agent lean (~2KB tracking vs ~50KB+ content)

**For Parallel Execution**:
- Use Agent tool to spawn multiple subagents in single message
- Each subagent invokes the corresponding BMad agent skill
- Collect results as they complete

**Direct Skill Invocation** (for single task, user interactive):
```
Skill({
  skill: "bmad-agent-{role}",
  args: "{task-specific-args}"
})
```

**Sequential Subagent Invocation** (for dependent tasks):
```
// Task 1
Agent({
  description: "Execute {task-name}",
  prompt: `
    **CRITICAL: Your first action MUST be to invoke the Skill tool.**

    Step 1: Call Skill tool immediately:
      Skill({ skill: "bmad-agent-{role}" })

    Step 2: After skill loads, follow the skill's instructions:
      - The skill will present a capabilities menu
      - Select the appropriate capability code for: {task-description}
      - Execute the task according to skill instructions

    Input files to read (after skill loads): {list of dependency file paths}
    Output file: {expected output path}

    After completion:
    1. Verify output file was created
    2. Return: file path + brief summary (max 100 words)

    DO NOT:
    - Start coding before invoking the skill
    - Return full content of output file
    - Skip the skill invocation step
  `,
  subagent_type: "general-purpose"
})

// After completion, main agent checks:
fs.existsSync(outputPath) // Verify file exists
// Record: "✓ Task N: {task-name} → {output-path}"
// Continue to next task...
```

**Parallel Agent Invocation** (for multiple independent tasks):
```
Agent({
  description: "Execute {task-name} via BMad agent",
  prompt: `
    **CRITICAL: Your first action MUST be to invoke the Skill tool.**

    Step 1: Call Skill tool immediately:
      Skill({ skill: "bmad-agent-{role}" })

    Step 2: Follow skill instructions to execute: {task-description}

    Return: completion status + output file path + 100-word summary
  `,
  subagent_type: "general-purpose"
})
```

**Important**: BMad agent skills are the execution layer. Orchestrator plans and dispatches, BMad agents execute. Subagents MUST invoke the skill first to load the persona and capabilities before doing any work.

### Step 5: Progress Tracking

Monitor execution and report status:

1. **Track completion**: Mark tasks as completed/failed
2. **Handle failures**: Retry or report blockers
3. **Update plan**: Adjust remaining tasks if needed
4. **Report to parent**: Summarize execution results

**Progress Report Format**:

```markdown
## Execution Progress

### Completed
- [x] Task 1: Create PRD → Output: `prd-openpurememo.md`
- [x] Task 2: Create UX → Output: `ux-design-specification.md`

### In Progress
- [ ] Task 3: Architecture (Winston) → Running...

### Pending
- [ ] Task 4: Epics (John)
- [ ] Task 5: Implementation Readiness Check

### Summary
- Completed: 2/5 (40%)
- In Progress: 1
- Pending: 2
- Estimated remaining: ~15 min
```

## Execution Modes

### Mode 1: Direct Execution (Simple Task)

For single, straightforward tasks - invoke BMad agent directly:

```
User: "Create PRD for this project"

→ Analyze: Single task, no dependencies
→ Dispatch: Skill({ skill: "bmad-agent-pm" })
→ John (PM) presents capabilities, user selects "Create PRD"
→ Report: PRD created at {path}
```

### Mode 2: Sequential Execution (Dependent Tasks)

For tasks with dependencies - spawn subagents in chain, each reads/writes from disk:

```
User: "Set up the full planning phase"

→ Analyze: PRD → UX → Architecture → Epics (dependency chain)
→ Plan: Execute in chain, each as subagent
→ Execute:
   1. Agent({
        description: "Create PRD",
        prompt: "Invoke bmad-agent-pm to create PRD.
                 Output to: {planning_artifacts}/prd-{project}.md
                 Return: file path + 100-word summary"
      })
      → Wait for completion
      → Check file exists
      → Record: "✓ Task 1: PRD created"

   2. Agent({
        description: "Create UX Design",
        prompt: "Read {prd_path} for context.
                 Invoke bmad-agent-ux-designer to create UX.
                 Output to: {planning_artifacts}/ux-design-specification.md
                 Return: file path + 100-word summary"
      })
      → Wait for completion
      → Check file exists
      → Record: "✓ Task 2: UX created"

   3. Agent({
        description: "Create Architecture",
        prompt: "Read {prd_path} and {ux_path} for context.
                 Invoke bmad-agent-architect to create Architecture.
                 Output to: {planning_artifacts}/architecture.md
                 Return: file path + 100-word summary"
      })
      → Wait for completion
      → Record: "✓ Task 3: Architecture created"

   4. Agent({
        description: "Create Epics",
        prompt: "Read {prd_path}, {ux_path}, {arch_path} for context.
                 Invoke bmad-agent-pm to create Epics.
                 Output to: {planning_artifacts}/epics.md
                 Return: file path + 100-word summary"
      })
      → Wait for completion
      → Record: "✓ Task 4: Epics created"

→ Report: All planning artifacts created
```

**Key difference from old approach**: Main agent never loads full artifact content.
Context passes through file system, not conversation history.

### Mode 3: Parallel Execution (Independent Tasks)

For concurrent tasks - spawn subagents that invoke BMad agents:

```
User: "Run market research and technical research simultaneously"

→ Analyze: Both are analysis phase, no mutual dependencies
→ Plan: Parallel execution
→ Execute: Launch subagents in single message:
   - Agent 1: Invoke bmad-agent-analyst → Mary does market research
   - Agent 2: Invoke bmad-agent-analyst → Mary does technical research
→ Collect: Wait for both completions
→ Report: Both research docs created
```

### Mode 4: Hybrid Execution

Mixed dependent/independent tasks - parallel groups connected by sequential chains:

```
User: "Complete analysis and planning phases"

→ Analyze:
   - Group A (parallel): Market Research + Domain Research
   - Sequential: PRD (depends on Group A)
   - Group B (parallel after PRD): UX + Architecture
   - Sequential: Epics (depends on all)

→ Execute:
   Phase 1: Launch parallel subagents
     - Agent({ description: "Market Research", prompt: "Invoke bmad-agent-analyst..." })
     - Agent({ description: "Domain Research", prompt: "Invoke bmad-agent-analyst..." })
     → Wait for both, verify files exist

   Phase 2: Sequential subagent (reads Group A outputs)
     - Agent({
         description: "Create PRD",
         prompt: "Read {market_research_path}, {domain_research_path}.
                  Invoke bmad-agent-pm to create PRD.
                  Output to: {prd_path}
                  Return: file path + 100-word summary"
       })
     → Wait, verify file exists

   Phase 3: Launch parallel subagents (both read PRD)
     - Agent({ description: "Create UX", prompt: "Read {prd_path}. Invoke bmad-agent-ux-designer..." })
     - Agent({ description: "Create Architecture", prompt: "Read {prd_path}. Invoke bmad-agent-architect..." })
     → Wait for both, verify files exist

   Phase 4: Sequential subagent (reads all outputs)
     - Agent({
         description: "Create Epics",
         prompt: "Read {prd_path}, {ux_path}, {arch_path}.
                  Invoke bmad-agent-pm to create Epics.
                  Output to: {epics_path}
                  Return: file path + 100-word summary"
       })
     → Wait, verify file exists

→ Report: Full workflow completed
```

**Key principle**: Every task runs in a subagent. Main agent only coordinates.

## On Activation

**CRITICAL**: First determine if orchestration is needed using Fast Path Detection above.

### Step 1: Quick Assessment (1 tool call max)

- Scan `_bmad-output/planning-artifacts/` for existing files
- If task is simple status check → Report immediately, STOP
- If task requires orchestration → Continue to Step 2

### Step 2: Context Analysis

When user invokes this skill without a specific execution plan:

1. **Analyze user request**:
   - What phase/task does the user want to work on?
   - Is there a specific deliverable mentioned?
   - Is there a scope constraint (single task, full phase, multiple phases)?

2. **Analyze project state**:
   - Load config from `{project-root}/_bmad/bmm/config.yaml` or `_bmad/config.yaml`
   - Check for existing BMad artifacts in `{planning_artifacts}/`
   - Check implementation progress in `{implementation_artifacts}/`
   - Identify current BMad phase and incomplete deliverables

3. **Determine execution scope**:
   - What's missing that blocks progress?
   - What can be executed next based on dependencies?
   - What's the optimal execution strategy?

### Step 3: Plan Generation

Generate a detailed execution plan:

```markdown
## Proposed Execution Plan

### Current State
- Phase: {current-phase}
- Completed: {list of completed artifacts}
- Missing: {list of missing artifacts}

### Recommended Tasks

| # | Task | Agent | Mode | Dependencies | Est. Time |
|---|------|-------|------|--------------|-----------|
| 1 | ... | ... | ... | ... | ... |

### Execution Strategy
- Phase 1: {description} (parallel/sequential)
- Phase 2: {description}
- ...

### Expected Outputs
- {artifact-1}
- {artifact-2}
```

### Step 4: User Confirmation

**ALWAYS present the plan and ask for confirmation**:

```
I've analyzed the project and generated an execution plan:

{display the plan}

Would you like me to proceed with this plan? You can:
1. Approve - Execute the plan as proposed
2. Modify - Tell me what to change
3. Cancel - Stop here
```

**STOP and WAIT** for user response. Do NOT execute until user approves.

### Step 5: Execute After Approval

Once user approves:
1. Dispatch BMad agents according to the plan
2. Track progress and report status
3. Handle any failures or blockers
4. Summarize results when complete

## Critical Rules

- **Never skip dependencies**: Tasks must wait for their dependencies to complete
- **Pass context via files**: Completed artifacts are passed as file paths, not conversation content
- **Main agent stays lean**: Only track task status + file paths, never read full artifact content
- **Subagents do the work**: Every task (sequential or parallel) runs in a subagent
- **Verify completion**: Check file exists after each subagent completes
- **Report honestly**: If a task fails, report the failure and blocker
- **Respect BMad workflow**: Follow BMad phase ordering even in accelerated mode
- **Communicate with parent**: Always summarize results for the calling agent/user
- **Never fix directly**: If Code Review or validation fails, spawn a new subagent to fix — main agent never modifies code directly

## Failure Handling

When a task fails or returns issues (e.g., Code Review finds problems):

```
Code Review Subagent returns:
  "Found 2 issues:
   1. Missing import in file X
   2. Test mock incorrect in file Y"

Main agent should:
  1. Record issues in tracking
  2. Spawn Fix Subagent:
     Agent({
       description: "Fix Code Review issues",
       prompt: `
         **CRITICAL: Your first action MUST be to invoke the Skill tool.**

         Step 1: Call Skill tool immediately:
           Skill({ skill: "bmad-agent-dev" })

         Step 2: After skill loads, fix these issues:
           - {issue 1 description}
           - {issue 2 description}

         Input files to read: {files with issues}
         After fix: Run tests to verify

         Return: brief summary of fixes made
       `,
       subagent_type: "general-purpose"
     })
  3. After fix completes, spawn Re-Review Subagent:
     Agent({
       description: "Re-review after fixes",
       prompt: `
         Invoke bmad-code-review to verify fixes.
         Previous issues: {list of issues}
         Return: pass/fail + summary
       `,
       subagent_type: "general-purpose"
     })
  4. If still failing, repeat fix cycle (max 3 iterations)
  5. If passing, continue to next task
```

**Key principle**: Main agent coordinates, subagents execute. Even fixes must go through subagents.

## Checkpoint Configuration

Optional checkpoints can be configured for critical milestones:

| Checkpoint Type | When to Use | Behavior |
|----------------|-------------|----------|
| `phase-complete` | After each BMad phase | Pause for user review before next phase |
| `artifact-created` | After key artifacts (PRD, Architecture) | Pause for user approval |
| `story-complete` | After each story | No pause by default, optional |
| `epic-complete` | After all stories in epic | Pause for retrospective |

To enable checkpoints, add to execution plan:
```markdown
### Execution Strategy
- Checkpoints: phase-complete, epic-complete
```

## Example Usage

### Example 1: User specifies execution plan

**User**: "Execute the remaining planning tasks for this project"

**Orchestrator**:
1. Scans `_bmad-output/planning-artifacts/`
2. Finds: PRD exists, UX missing, Architecture missing, Epics missing
3. Plans:
   - Task 1: UX Design (Sally) → depends on PRD ✓
   - Task 2: Architecture (Winston) → depends on PRD ✓, can run parallel with Task 1
   - Task 3: Epics (John) → depends on Task 1 + Task 2
4. Executes:
   - Parallel Phase: Spawn 2 subagents in single message
     - Agent 1: "Read {prd_path}. Invoke bmad-agent-ux-designer. Output to {ux_path}. Return file path + 100-word summary."
     - Agent 2: "Read {prd_path}. Invoke bmad-agent-architect. Output to {arch_path}. Return file path + 100-word summary."
   - Wait for both completions, verify files exist
   - Sequential Phase: Spawn subagent for Epics
     - Agent 3: "Read {prd_path}, {ux_path}, {arch_path}. Invoke bmad-agent-pm to create Epics. Output to {epics_path}. Return file path + 100-word summary."
   - Wait for completion, verify file exists
5. Reports: "UX and Architecture created in parallel, Epics created sequentially. All planning artifacts complete. Files: {ux_path}, {arch_path}, {epics_path}"

### Example 2: User invokes without specific plan

**User**: invokes `/bmad-subagent-orchestrator` or says "帮我推进项目"

**Orchestrator**:
1. **Context Analysis**:
   - Scans project artifacts
   - Finds: PRD ✓, UX ✓, Architecture ✓, Epics ✓, Implementation Readiness ✓
   - Current phase: Implementation (Phase 4)
   - Sprint status: Epic 0 in progress, 2/8 stories done

2. **Generates Plan**:
   ```markdown
   ## Proposed Execution Plan

   ### Current State
   - Phase: 4-Implementation
   - Epic: 0 (Core Foundation) - 25% complete
   - Completed Stories: 0-1, 0-2
   - In Progress: 0-3, 0-4, 0-8
   - Ready for Dev: 0-5, 0-6, 0-7

   ### Recommended Tasks

   | # | Task | Agent | Mode | Dependencies | Est. Time |
   |---|------|-------|------|--------------|-----------|
   | 1 | Complete Story 0-3 (IPC Layer) | Amelia (Dev) | Sequential | None | ~2h |
   | 2 | Complete Story 0-4 (Data Models) | Amelia (Dev) | Sequential | None | ~1.5h |
   | 3 | Start Story 0-5 (Zustand Store) | Amelia (Dev) | Sequential | #2 | ~1h |

   ### Execution Strategy
   - All tasks run as chained subagents
   - Story 0-4 blocks 0-5, complete sequentially
   - Story 0-3 can run parallel with 0-4

   ### Expected Outputs
   - Completed stories 0-3, 0-4, 0-5
   - Updated sprint status
   ```

3. **Asks for Confirmation**:
   ```
   I've analyzed the project and generated an execution plan above.

   Would you like me to proceed with this plan? You can:
   1. Approve - Execute the plan as proposed
   2. Modify - Tell me what to change (e.g., "skip story 0-5", "only do 0-3")
   3. Cancel - Stop here
   ```

4. **Waits for user response** before executing

5. **After approval, executes via chained subagents**:
   - Phase 1 (Parallel): Spawn 2 subagents for Story 0-3 and 0-4
   - Wait for both, verify story files updated
   - Phase 2 (Sequential): Spawn subagent for Story 0-5 (reads 0-4 output)
   - Wait for completion, verify file updated
   - Report: "Stories 0-3, 0-4, 0-5 completed. Sprint status updated."