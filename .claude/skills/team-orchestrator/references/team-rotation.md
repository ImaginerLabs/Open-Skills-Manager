# Team Rotation Strategy

How and when to rotate team members to prevent context overflow.

## Why Rotation Matters

LLM agents have finite context windows. As they work:
- Tool calls accumulate
- File contents are read and stored
- Intermediate results build up
- Context window fills

When context fills:
- Performance degrades
- Hallucinations increase
- Important details are forgotten
- Quality drops

## Rotation Triggers

Rotate the team when any of these occur:

### Hard Triggers (Must Rotate)
- **Token limit approaching** - >80% of context window used
- **Phase complete** - All tasks in current phase done
- **Error cascade** - Multiple failures in sequence

### Soft Triggers (Consider Rotation)
- **Complex debugging done** - Long debugging session complete
- **New feature starting** - About to start independent feature
- **Many files touched** - Agent has modified >10 files

## Rotation Pattern

### Before Rotation

1. **Capture state** - Write current state to file:
   ```markdown
   ## Phase 1 Summary

   ### Completed
   - JWT utility: src/utils/jwt.ts
   - Auth service: src/services/auth.ts

   ### In Progress
   - Auth routes: 50% complete

   ### Decisions Made
   - Using RS256 for JWT signing
   - Token expiry: 1 hour

   ### Next Steps
   - Complete auth routes
   - Add refresh token logic
   ```

2. **Save to file**: `.team-state/phase-N-summary.md`

### During Rotation

1. **Terminate agents**: Send shutdown signal
2. **Clear context**: Main orchestrator only keeps file paths
3. **Spawn fresh agents**: New agent instances with clean context

### After Rotation

1. **Load state**: New agents read `.team-state/phase-N-summary.md`
2. **Continue work**: Resume from saved state
3. **Verify**: Check that previous outputs exist

## Context Handoff Protocol

The key principle: **Context passes through files, not conversation**.

### What to Pass

```json
{
  "phase": 2,
  "completed_tasks": [
    {"task": "jwt-utility", "output": "src/utils/jwt.ts"},
    {"task": "auth-service", "output": "src/services/auth.ts"}
  ],
  "in_progress": {
    "task": "auth-routes",
    "output": "src/routes/auth.ts",
    "status": "50%"
  },
  "decisions": {
    "jwt_algorithm": "RS256",
    "token_expiry": "1h"
  },
  "next_tasks": ["auth-tests", "documentation"]
}
```

### What NOT to Pass

- Full file contents (read from files instead)
- Conversation history (not relevant)
- Intermediate scratchpad (not needed)

## Rotation Example

```
=== Phase 1 Start ===
Main: Spawning agents for Phase 1
├── Agent A: JWT utility
├── Agent B: Token refresh
└── Agent C: Auth config

=== Phase 1 Complete ===
Main: All Phase 1 tasks done
Main: Writing state to .team-state/phase-1-summary.md
Main: Terminating Agent A, B, C
Main: Context cleared (only file paths retained)

=== Phase 2 Start ===
Main: Spawning fresh agents for Phase 2
├── Agent D: Auth service (reads phase-1-summary.md)
└── Agent E: Auth middleware (reads phase-1-summary.md)

...and so on
```

## Measuring Context Health

Track these metrics to know when rotation is needed:

| Metric | Healthy | Warning | Critical |
|--------|---------|---------|----------|
| Tool calls | <50 | 50-100 | >100 |
| Files read | <20 | 20-40 | >40 |
| Output size | <50KB | 50-100KB | >100KB |

When any metric hits Critical, rotate immediately.
