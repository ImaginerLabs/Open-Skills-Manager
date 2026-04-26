# Failure Handling

How to handle agent failures, timeouts, and errors.

## Why Failure Handling Matters

In distributed agent systems, failures are inevitable:
- Agent exceeds time limit
- Agent produces invalid output
- Dependency fails unexpectedly
- Resource conflict occurs

Robust failure handling ensures the team can recover and continue.

## Failure Types

### Type 1: Timeout

Agent takes too long to complete.

**Detection**: Agent doesn't respond within timeout period

**Recovery**:
1. Check if partial output exists
2. If partial output is usable, proceed with warning
3. If not, spawn new agent with simplified task
4. Consider splitting task into smaller pieces

### Type 2: Invalid Output

Agent completes but output is malformed or incorrect.

**Detection**:
- Output file doesn't exist
- Output file is empty
- Output doesn't match expected schema
- Tests fail on output

**Recovery**:
1. Log the invalid output for analysis
2. Spawn fix agent with specific error context
3. Re-validate after fix
4. If still failing, escalate to user

### Type 3: Dependency Failure

A task's dependency failed, blocking the task.

**Detection**: Dependency task status is "failed"

**Recovery**:
1. Mark dependent task as "blocked"
2. Attempt to fix dependency first
3. If unfixable, report blocker to user
4. User may provide alternative approach

### Type 4: Resource Conflict

Two agents try to modify the same file.

**Detection**: File write conflict detected

**Recovery**:
1. Stop both agents
2. Merge changes if possible
3. If merge conflict, spawn resolution agent
4. Re-run affected tasks

## Recovery Strategies

### Strategy 1: Retry with Simplification

```
Original task: "Implement full auth system with JWT, OAuth, and SAML"
Failed after: 10 minutes

Recovery:
1. Split into smaller tasks:
   - Task A: JWT implementation (simpler)
   - Task B: OAuth implementation (simpler)
   - Task C: SAML implementation (simpler)
2. Spawn agents for each subtask
3. Aggregate results
```

### Strategy 2: Fix Agent

```
Task: "Create user API routes"
Output: File exists but tests fail

Recovery:
1. Spawn fix agent:
   Agent({
     description: "Fix user API routes",
     prompt: `
   ## Task
   Fix the failing tests in src/routes/users.ts

   ## Error Output
   ${testErrorOutput}

   ## Current Implementation
   Read: src/routes/users.ts

   ## Output
   - Fix the issues
   - Run tests to verify
   - Return: summary of fixes
     `
   })
2. Re-run tests
3. If still failing, retry or escalate
```

### Strategy 3: Alternative Approach

```
Task: "Parse complex CSV file"
Failed: Parser library doesn't handle edge case

Recovery:
1. Try alternative parser library
2. Or: Use manual parsing for edge cases
3. Or: Pre-process file to normalize format
```

### Strategy 4: User Escalation

```
Task: "Integrate with legacy API"
Failed: API documentation is incomplete

Recovery:
1. Report to user:
   "Unable to integrate with legacy API.
    Missing documentation for endpoints X, Y, Z.
    Please provide:
    - Endpoint specifications
    - Authentication requirements
    - Or alternative integration approach"
2. Wait for user input
3. Resume with new information
```

## Failure Tracking

Maintain a failure log for analysis:

```json
{
  "failures": [
    {
      "taskId": "auth-routes",
      "type": "timeout",
      "timestamp": "2024-01-15T10:30:00Z",
      "recovery": "split-task",
      "resolved": true
    },
    {
      "taskId": "csv-parser",
      "type": "invalid-output",
      "timestamp": "2024-01-15T11:00:00Z",
      "recovery": "fix-agent",
      "resolved": true
    }
  ]
}
```

## Circuit Breaker Pattern

Prevent cascade failures by stopping after repeated failures:

```
Rules:
- If 3 consecutive failures of same type → Pause and alert user
- If 5 total failures in a phase → Stop phase, ask for guidance
- If same task fails 3 times → Escalate to user
```

## Example: Handling a Failed Task

```
=== Task Execution ===
Main: Spawning Agent A for "auth routes"
Agent A: Starting...
Agent A: [timeout after 5 minutes]

=== Failure Detection ===
Main: Agent A timed out
Main: Checking for partial output...
Main: Found partial output: src/routes/auth.ts (incomplete)

=== Recovery ===
Main: Output is incomplete, cannot use
Main: Splitting task into smaller pieces:
  - Task A1: Basic auth routes (simpler)
  - Task A2: Auth middleware (simpler)
Main: Spawning Agent A1 and A2...

=== Resolution ===
Agent A1: Completed successfully
Agent A2: Completed successfully
Main: Auth routes complete (via split approach)
```
