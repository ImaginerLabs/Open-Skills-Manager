# Agent Spawning Patterns

Templates and patterns for spawning different types of agents.

## Why These Patterns Matter

Consistent spawning patterns ensure:
- Agents receive complete context
- Outputs are predictable and verifiable
- Coordination is reliable
- Context stays lean (main agent doesn't read full outputs)

## Core Pattern: Task-Context-Output

Every agent spawn follows this structure:

```
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

## Specialist Agent

For complex domain work requiring expertise.

```javascript
Agent({
  description: "Implement {feature-name}",
  prompt: `
## Task
Implement {feature-name} with the following requirements:
- {requirement-1}
- {requirement-2}

## Context Files
Read these files for context:
- {dependency-file-1}: {purpose}
- {dependency-file-2}: {purpose}

## Output
- Write implementation to: {output-path}
- Return: file path + 100-word summary of what was implemented

## Constraints
- Follow patterns in: {conventions-file}
- Use existing utilities from: {utilities-path}
- Match coding style in: {style-reference}
  `,
  subagent_type: "bmad-dev", // or appropriate specialist
  run_in_background: true
})
```

**When to use**: Architecture, complex features, domain-specific logic

## Utility Agent

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
- Return: file path + usage example (how to import and use)

## Constraints
- Single responsibility: {specific-purpose}
- Well-documented with JSDoc
- Include type definitions
  `,
  subagent_type: "general-purpose",
  run_in_background: true
})
```

**When to use**: Shared utilities, helpers, common functions, formatters, validators

## Worker Agent

For standard implementation tasks (tests, docs, simple features).

```javascript
Agent({
  description: "{task-type}: {scope}",
  prompt: `
## Task
{task-description}

## Implementation Files
Read these to understand what to {task-type}:
- {impl-file-1}
- {impl-file-2}

## Output
- Write to: {output-path}
- Return: file path + brief summary

## Standards
- Follow patterns in: {standards-file}
- Match existing style in: {style-reference}
  `,
  subagent_type: "general-purpose",
  run_in_background: true
})
```

**When to use**: Tests, documentation, simple CRUD, boilerplate

## Parallel Spawn Pattern

For multiple independent tasks, spawn all in one message:

```javascript
// Single message, multiple Agent calls
Agent({ description: "Task A", prompt: "...", run_in_background: true })
Agent({ description: "Task B", prompt: "...", run_in_background: true })
Agent({ description: "Task C", prompt: "...", run_in_background: true })

// Main agent continues, receives notifications as each completes
```

**Why**: All start immediately, run concurrently, finish faster

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

**Why**: Ensures dependencies complete before dependents start

## Hybrid Pattern

Mix parallel and sequential for complex workflows:

```javascript
// Phase 1: Parallel utilities
const [util1, util2] = await Promise.all([
  Agent({ description: "Utility 1", prompt: "...", run_in_background: true }),
  Agent({ description: "Utility 2", prompt: "...", run_in_background: true })
])

// Wait for both, verify
await Promise.all([util1.promise, util2.promise])

// Phase 2: Sequential core (uses utilities)
const core = await Agent({
  description: "Core implementation",
  prompt: `
## Context
Utilities created:
- ${util1.outputPath}
- ${util2.outputPath}
...
  `,
  run_in_background: false
})

// Phase 3: Parallel tests/docs
await Promise.all([
  Agent({ description: "Tests", prompt: `...${core.outputPath}...`, run_in_background: true }),
  Agent({ description: "Docs", prompt: `...${core.outputPath}...`, run_in_background: true })
])
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
