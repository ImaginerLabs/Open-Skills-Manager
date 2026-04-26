# Dependency Analysis

How to analyze task dependencies and build execution graphs.

## Why Dependency Analysis Matters

When multiple tasks need coordination, understanding dependencies is critical for:

1. **Efficiency** - Independent tasks can run in parallel, reducing total time
2. **Correctness** - Dependent tasks must wait for their dependencies to complete
3. **Resource optimization** - Avoid idle agents waiting on blocked tasks

## Dependency Graph Structure

A dependency graph is a directed acyclic graph (DAG) where:
- Nodes = Tasks
- Edges = Dependencies (A → B means B depends on A)

## Building the Graph

### Step 1: Identify All Tasks

Break down the user request into atomic, executable units:

```
Request: "Build user authentication with JWT"

Tasks:
1. Create JWT utility
2. Create auth service
3. Create auth routes
4. Create auth tests
5. Update documentation
```

### Step 2: Identify Dependencies

For each task, ask: "What must exist before this can start?"

| Task | Dependencies | Reason |
|------|--------------|--------|
| JWT utility | None | Self-contained |
| Auth service | JWT utility | Uses JWT for tokens |
| Auth routes | Auth service | Calls service methods |
| Auth tests | Auth routes | Tests the routes |
| Documentation | Auth routes | Documents the API |

### Step 3: Build Execution Levels

Group tasks by their "depth" in the dependency graph:

```
Level 0 (no deps):     [JWT utility]
Level 1 (deps on 0):   [Auth service]
Level 2 (deps on 1):   [Auth routes]
Level 3 (deps on 2):   [Auth tests, Documentation]
```

Tasks at the same level with no mutual dependencies can run in parallel.

## Execution Strategies

### Strategy 1: Level-by-Level (Safe)

Execute all tasks at Level N before starting Level N+1:

```
Phase 1: Execute all Level 0 tasks (parallel)
Phase 2: Execute all Level 1 tasks (parallel)
Phase 3: Execute all Level 2 tasks (parallel)
...
```

**Pros**: Simple, guarantees dependencies are met
**Cons**: May wait longer than necessary

### Strategy 2: As-Soon-As-Possible (Optimal)

Start each task as soon as all its dependencies complete:

```
Time 0: Start JWT utility
Time 1: JWT utility completes → Start Auth service
Time 2: Auth service completes → Start Auth routes
Time 3: Auth routes completes → Start Auth tests AND Documentation (parallel)
```

**Pros**: Minimizes total time
**Cons**: More complex coordination

## Detecting Parallel Opportunities

Two tasks can run in parallel if:
1. Neither depends on the other (directly or transitively)
2. They don't write to the same file
3. They don't modify the same resource

### Example: Multi-Module Development

```
Request: "Create user, product, and order modules"

Dependency Graph:
User module ──┐
              ├──> Integration tests
Product module ──┤
              │
Order module ──┘

Analysis:
- Level 0: [User, Product, Order] - ALL can run in parallel!
- Level 1: [Integration tests] - Must wait for all Level 0
```

## Handling Circular Dependencies

Circular dependencies indicate a design problem. Resolve by:

1. **Extract shared code** - Create a new shared module
2. **Use interfaces** - Depend on abstractions, not implementations
3. **Split the task** - Break into smaller, non-circular units

```
Bad: A → B → C → A (circular!)

Good: A → Shared → B
      C → Shared
```

## Dependency Visualization

For complex graphs, visualize with ASCII art:

```
     ┌─────────────┐
     │ JWT Utility │
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ Auth Service│
     └──────┬──────┘
            │
     ┌──────▼──────┐
     │ Auth Routes │
     └──────┬──────┘
            │
     ┌──────┴──────┐
     │             │
┌────▼────┐  ┌─────▼─────┐
│  Tests  │  │    Docs   │
└─────────┘  └───────────┘
```
