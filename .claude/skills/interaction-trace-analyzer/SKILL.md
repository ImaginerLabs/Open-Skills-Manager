---
name: interaction-trace-analyzer
description: |
  Analyze frontend page interaction chains by tracing all interactive elements through their complete execution paths. Use this skill when the user wants to understand how a frontend page works, debug interaction issues, analyze user flows, or document the complete behavior of UI elements. Triggers on requests like "analyze this page's interactions", "trace button click flow", "what happens when user clicks X", "document all interactive elements", "find issues in user flow", or any frontend interaction analysis task.
---

# Interaction Trace Analyzer

A systematic skill for analyzing frontend page interactions through multi-agent collaboration, tracing each interactive element through its complete execution chain, identifying issues, and generating graded analysis reports.

## Core Objective

Starting from interactive elements on a frontend page (buttons, inputs, dropdowns, links, etc.), use subagent collaboration to systematically trace each element's complete execution chain—including operations, logic branches, and data flows—until reaching the chain's endpoint. Record detailed chain information incrementally, identify logical intent and potential issues, and generate a graded analysis report.

## Agent Roles and Responsibilities

### Main Agent (Orchestrator)
**Role**: Command, coordinate, and document only. Never participate in chain exploration or issue correction.

**Responsibilities**:
1. Create and manage the Exploration Agent
2. Receive interactive element inventory and dispatch concurrent Subagents
3. Aggregate all results and check for completeness
4. Write and update the final analysis report
5. Create additional Subagents if gaps are found

### Exploration Agent
**Role**: Scan and identify interactive elements only. Do not explore chains.

**Responsibilities**:
1. Comprehensively scan the target frontend page
2. Identify ALL interactive elements with their metadata:
   - Element type (button, input, select, link, etc.)
   - Display text/label
   - Location (component/file, line number if available)
   - Trigger method (click, input, change, submit, etc.)
   - Any visible state dependencies (disabled conditions, visibility toggles)
3. Return a structured inventory to the Main Agent

### Subagent (Chain Explorer)
**Role**: Explore, trace, analyze, and correct issues for a single interactive element.

**Responsibilities**:
1. Simulate triggering the assigned element
2. Trace the complete execution chain layer by layer
3. Record all chain nodes, branches, and endpoints
4. Identify logical intent and potential issues
5. Correct issues found during exploration
6. Return detailed chain analysis to Main Agent

## Execution Flow

### Phase 1: Element Discovery

```
Main Agent
    │
    ▼
Create Exploration Agent
    │
    ▼
Exploration Agent scans page
    │
    ▼
Return Interactive Element Inventory
    │
    ▼
Main Agent receives inventory
```

**Exploration Agent Output Format**:
```json
{
  "page_url_or_component": "string",
  "scan_timestamp": "ISO timestamp",
  "interactive_elements": [
    {
      "id": "unique-element-id",
      "type": "button|input|select|link|form|etc",
      "label": "visible text or aria-label",
      "location": "component path and line number",
      "trigger": "click|input|change|submit|focus|blur",
      "state_dependencies": ["disabled when X", "hidden when Y"],
      "initial_state": "enabled|disabled|hidden|visible"
    }
  ],
  "total_count": number
}
```

### Phase 2: Concurrent Chain Analysis

```
Main Agent receives inventory
    │
    ├─────────┬─────────┬─────────┬─────────┐
    ▼         ▼         ▼         ▼         ▼
Subagent-1 Subagent-2 Subagent-3 Subagent-4 Subagent-N
(element A) (element B) (element C) (element D) (element N)
    │         │         │         │         │
    └─────────┴─────────┴─────────┴─────────┘
                      │
                      ▼
              Main Agent aggregates results
```

**Critical**: Create ALL Subagents in a SINGLE turn. Do not create them sequentially. Each Subagent receives only ONE element to analyze.

### Phase 3: Subagent Chain Exploration

Each Subagent executes this internal loop:

```
1. TRIGGER
   └── Simulate the element's trigger action

2. TRACE
   └── Follow the execution path:
       ├── Event handler entry point
       ├── State changes (Redux, Zustand, Context, etc.)
       ├── API calls (request/response)
       ├── Side effects
       ├── Conditional branches
       └── UI updates

3. BRANCH
   └── For each conditional path:
       ├── Document branch condition
       ├── Trace branch-specific flow
       └── Record branch endpoint

4. RECORD
   └── Incrementally document:
       ├── Each node in the chain
       ├── Data transformations
       ├── State mutations
       └── Error handling paths

5. ANALYZE
   └── Identify:
       ├── Logical intent (what this chain is designed to do)
       ├── Potential issues (dead ends, missing feedback, race conditions)
       └── Edge cases (error states, empty states)

6. CORRECT
   └── For issues found:
       ├── Document the issue
       ├── Propose fix
       ├── Apply fix if safe
       └── Verify fix resolves issue

7. REPORT
   └── Return complete chain analysis
```

### Phase 4: Aggregation and Gap Analysis

```
Main Agent collects all Subagent reports
    │
    ▼
Check for gaps:
├── Unanalyzed elements?
├── Incomplete chains?
├── Missing branch coverage?
└── Unresolved issues?
    │
    ├── If gaps exist → Create new Subagents for gaps
    │
    └── If complete → Generate final report
```

## Chain Record Structure

Each chain record MUST contain:

```json
{
  "chain_id": "element-name_action-type_timestamp",
  "element_info": {
    "type": "button|input|etc",
    "label": "string",
    "location": "file:line",
    "trigger": "click|input|etc"
  },
  "chain_nodes": [
    {
      "step": 1,
      "action": "User clicks 'Import' button",
      "handler": "handleImport() in ImportButton.tsx:42",
      "state_changes": ["isImporting = true"],
      "api_calls": [],
      "branches": []
    },
    {
      "step": 2,
      "action": "File picker opens",
      "handler": "window.showOpenFilePicker()",
      "state_changes": [],
      "api_calls": [],
      "branches": [
        {
          "condition": "User selects file",
          "target_step": 3
        },
        {
          "condition": "User cancels",
          "target_step": "END_CANCEL"
        }
      ]
    }
  ],
  "branches": {
    "branch_id": {
      "condition": "string",
      "flow": ["step numbers"],
      "endpoint": "result description"
    }
  },
  "endpoints": [
    {
      "type": "success|error|cancel|redirect",
      "result": "description",
      "state": "final state snapshot",
      "user_feedback": "toast, modal, redirect, etc."
    }
  ],
  "logical_intent": "This chain handles importing skill files from the local filesystem...",
  "issues_found": [
    {
      "severity": "critical|high|medium|low",
      "node": "step number or 'general'",
      "description": "string",
      "impact": "string",
      "suggested_fix": "string"
    }
  ],
  "corrections_applied": [
    {
      "issue": "reference to issue",
      "fix": "description of fix applied",
      "verification": "how fix was verified"
    }
  ]
}
```

## Grading System

### Chain Complexity Grade

| Grade | Criteria |
|-------|----------|
| **L1 - Simple** | Single linear path, no branches, no issues found |
| **L2 - Moderate** | Has branches or conditional logic, minor issues only |
| **L3 - Complex** | Multiple branches, async operations, notable issues |
| **L4 - Critical** | Complex with severe issues affecting functionality |

### Issue Severity Classification

| Severity | Criteria | Examples |
|----------|----------|----------|
| **Critical** | Breaks core functionality, data loss possible | Unhandled errors, infinite loops, data corruption |
| **High** | Significant user impact, workaround difficult | Missing error feedback, race conditions |
| **Medium** | Noticeable issue, workaround exists | Poor UX feedback, redundant operations |
| **Low** | Minor improvement opportunity | Code style, optimization opportunities |

## Final Report Structure

```markdown
# Interaction Chain Analysis Report

## Executive Summary
- Page/Component analyzed
- Total interactive elements found
- Chain complexity distribution (L1/L2/L3/L4)
- Critical issues summary

## Interactive Element Inventory
[Complete list of all elements discovered]

## Chain Analysis Details

### [Element Name] - Grade: L#
#### Element Information
- Type: button
- Location: Component.tsx:42
- Trigger: click

#### Chain Flow
[Step-by-step flow diagram]

#### Branches
[All conditional paths with conditions]

#### Endpoints
[All possible outcomes]

#### Logical Intent
[What this chain is designed to accomplish]

#### Issues Found
[Detailed issue list with severity]

#### Corrections Applied
[Fixes made during analysis]

---

[Repeat for each element]

## Issue Summary by Severity

### Critical Issues
[Issues requiring immediate attention]

### High Priority Issues
[Issues to address soon]

### Medium Priority Issues
[Issues to plan for]

### Low Priority Issues
[Nice-to-have improvements]

## Recommendations
[Prioritized action items]

## Appendix: Chain Trace Logs
[Detailed logs for each chain]
```

## Constraints and Rules

### Agent Boundaries (MUST follow)

1. **Main Agent**:
   - ✅ Create/manage Exploration Agent and Subagents
   - ✅ Aggregate results and check completeness
   - ✅ Write and update documentation
   - ❌ Never explore chains directly
   - ❌ Never correct issues directly

2. **Exploration Agent**:
   - ✅ Scan page for interactive elements
   - ✅ Return structured inventory
   - ❌ Never explore chains
   - ❌ Never analyze issues

3. **Subagent**:
   - ✅ Explore assigned element's complete chain
   - ✅ Trace all branches and endpoints
   - ✅ Identify and correct issues
   - ✅ Return detailed chain record
   - ❌ Never analyze other elements
   - ❌ Never modify other chains' records

### Process Order (MUST follow)

```
1. Main Agent creates Exploration Agent
2. Exploration Agent scans and returns inventory
3. Main Agent receives inventory
4. Main Agent creates ALL Subagents concurrently (single turn)
5. Subagents execute independently and return results
6. Main Agent aggregates and checks for gaps
7. If gaps: create new Subagents, go to step 5
8. If complete: Main Agent generates final report
```

### Recording Rules

- **Incremental**: New chains add new records, never modify existing
- **Traceable**: Each record has unique ID and timestamp
- **Complete**: Include all nodes, branches, and endpoints
- **Objective**: Base issues on actual findings, not assumptions

### Termination Conditions

The analysis terminates when ALL of the following are met:
- [ ] All interactive elements have been analyzed
- [ ] All chains traced to their endpoints
- [ ] All branches documented
- [ ] All issues recorded with severity
- [ ] No unexplored paths remain

## Usage Examples

**Example 1: Analyze a specific page**
```
User: "Analyze the interaction chains on the Settings page"
```

**Example 2: Trace a specific element**
```
User: "What happens when I click the Import button? Trace the complete flow."
```

**Example 3: Find issues in user flow**
```
User: "Find potential issues in the skill deployment flow"
```

**Example 4: Document all interactions**
```
User: "Document all interactive elements and their behaviors for the Library page"
```

## Implementation Notes

### For Tauri Applications
- Use tauri-webdriver for interaction simulation
- Trace IPC calls between frontend and backend
- Document Rust command handlers in the chain

### For React Applications
- Trace state management (Zustand, Redux, Context)
- Document effect hooks and their triggers
- Map component lifecycle events

### For API-Heavy Chains
- Document request/response schemas
- Trace error handling paths
- Note retry and timeout behaviors
