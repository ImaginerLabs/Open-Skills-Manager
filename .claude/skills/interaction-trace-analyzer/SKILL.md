---
name: interaction-trace-analyzer
description: |
  Analyze frontend page interaction chains by tracing all interactive elements through their complete execution paths. Use this skill when the user wants to understand how a frontend page works, debug interaction issues, analyze user flows, or document the complete behavior of UI elements. Triggers on requests like "analyze this page's interactions", "trace button click flow", "what happens when user clicks X", "document all interactive elements", "find issues in user flow", or any frontend interaction analysis task.
---

# Interaction Trace Analyzer

A systematic skill for analyzing frontend page interactions through multi-agent collaboration, tracing each interactive element through its complete execution chain—including operations, logic branches, and data flows—until reaching the chain's endpoint. Record detailed chain information incrementally, identify logical intent and potential issues, and generate graded analysis reports.

## ⚠️ CRITICAL RULES (MUST FOLLOW)

### 1. NO AUTO-CORRECTION - DOCUMENT ONLY
**绝对禁止自动修复代码问题**。本 skill 的目标是：
- ✅ 产出完整的链路分析文档
- ✅ 记录所有发现的问题和建议修复方案
- ❌ **绝不**直接修改代码
- ❌ **绝不**自动应用修复

用户需要文档来进行分析决策，而不是自动修复。

### 2. ITERATE THROUGH ALL PAGES
必须循环遍历应用的所有页面，而不是只分析单个页面：
- 发现所有路由/页面入口
- 对每个页面执行完整的元素发现和链路追踪
- 循环直到所有页面都被分析

### 3. TERMINATION = DOCUMENT OUTPUT
分析终止条件是**产出完整文档**，而不是"修复完成"：
- 所有页面分析完成
- 所有链路文档记录完成
- 产出最终报告供用户分析

## Core Objective

Starting from interactive elements on frontend pages (buttons, inputs, dropdowns, links, etc.), use subagent collaboration to systematically trace each element's complete execution chain—including operations, logic branches, and data flows—until reaching the chain's endpoint. Record detailed chain information incrementally, identify logical intent and potential issues, and generate graded analysis reports **for user review**.

## Agent Roles and Responsibilities

### Main Agent (Orchestrator)
**Role**: Command, coordinate, and document only. Never participate in chain exploration or issue correction.

**Responsibilities**:
1. **Page Discovery**: First discover ALL pages/routes in the application
2. Create and manage the Exploration Agent for each page
3. Receive interactive element inventory and dispatch concurrent Subagents
4. Aggregate all results and check for completeness
5. **Iterate**: Continue to next page until all pages analyzed
6. Write and update the final analysis report
7. Create additional Subagents if gaps are found

### Page Discovery Agent
**Role**: Discover all pages/routes in the application before analysis begins.

**Responsibilities**:
1. Scan router configuration files
2. Identify all page components and their routes
3. Return a complete page inventory to Main Agent
4. Include page hierarchy and navigation relationships

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
**Role**: Explore, trace, and document for a single interactive element. **DO NOT CORRECT**.

**Responsibilities**:
1. Simulate triggering the assigned element
2. Trace the complete execution chain layer by layer
3. Record all chain nodes, branches, and endpoints
4. Identify logical intent and potential issues
5. **Document issues with suggested fixes** (DO NOT APPLY)
6. Return detailed chain analysis to Main Agent

## Execution Flow

### Phase 0: Application Page Discovery (NEW)

```
Main Agent
    │
    ▼
Create Page Discovery Agent
    │
    ▼
Page Discovery Agent scans router/config
    │
    ▼
Return Complete Page Inventory
    │
    ▼
Main Agent receives page list
    │
    ▼
Initialize analysis loop
```

**Page Discovery Agent Output Format**:
```json
{
  "application_name": "string",
  "scan_timestamp": "ISO timestamp",
  "pages": [
    {
      "id": "page-id",
      "name": "Page Name",
      "route": "/path",
      "component_path": "src/pages/PageName/PageName.tsx",
      "layout": "MainLayout | None",
      "children_pages": ["child-page-ids"],
      "entry_points": ["navigation links that lead to this page"]
    }
  ],
  "total_pages": number,
  "navigation_structure": {
    "root_pages": ["page-ids"],
    "nested_pages": {
      "parent_id": ["child_ids"]
    }
  }
}
```

### Phase 1: Page-by-Page Analysis Loop (MODIFIED)

```
For each page in Page Inventory:
    │
    ▼
Create Exploration Agent for current page
    │
    ▼
Exploration Agent scans page
    │
    ▼
Return Interactive Element Inventory
    │
    ▼
Main Agent receives inventory
    │
    ▼
Phase 2: Concurrent Chain Analysis
    │
    ▼
Phase 3: Subagent Chain Exploration (DOCUMENT ONLY)
    │
    ▼
Phase 4: Aggregation for current page
    │
    ▼
Update cumulative report
    │
    ▼
Continue to next page (if any remain)
    │
    ▼
When all pages complete: Generate Final Report
```

### Phase 2: Concurrent Chain Analysis

```
Main Agent receives inventory for current page
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

### Phase 3: Subagent Chain Exploration (DOCUMENT ONLY)

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

6. DOCUMENT ISSUES (DO NOT CORRECT)
   └── For issues found:
       ├── Document the issue with severity
       ├── Document suggested fix (as text, NOT code changes)
       ├── Document impact and affected scenarios
       └── ❌ DO NOT apply any fixes

7. REPORT
   └── Return complete chain analysis (documentation only)
```

### Phase 4: Aggregation and Gap Analysis

```
Main Agent collects all Subagent reports for current page
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
    └── If complete → Update cumulative report, continue to next page
```

## Chain Record Structure

Each chain record MUST contain:

```json
{
  "chain_id": "element-name_action-type_timestamp",
  "page_id": "source-page-id",
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
      "suggested_fix": "string (DOCUMENT ONLY - DO NOT APPLY)",
      "code_location": "file:line where fix would be applied"
    }
  ]
}
```

**Note**: Removed `corrections_applied` field - this skill does NOT apply corrections.

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
- Application analyzed
- Total pages discovered
- Total interactive elements found
- Chain complexity distribution (L1/L2/L3/L4)
- Critical issues summary

## Page Inventory
[Complete list of all pages discovered with their routes]

---

## Page Analysis: [Page Name]

### Interactive Element Inventory
[Complete list of all elements discovered on this page]

### Chain Analysis Details

#### [Element Name] - Grade: L#
##### Element Information
- Type: button
- Location: Component.tsx:42
- Trigger: click

##### Chain Flow
[Step-by-step flow diagram]

##### Branches
[All conditional paths with conditions]

##### Endpoints
[All possible outcomes]

##### Logical Intent
[What this chain is designed to accomplish]

##### Issues Found
[Detailed issue list with severity - NO AUTO-FIX]

---

[Repeat for each element on this page]

---

[Repeat for each page in the application]

---

## Cross-Page Analysis

### Navigation Flow
[How pages connect and user navigation paths]

### Shared Component Issues
[Issues affecting multiple pages]

---

## Issue Summary by Severity

### Critical Issues
[Issues requiring immediate attention - listed with suggested fixes]

### High Priority Issues
[Issues to address soon]

### Medium Priority Issues
[Issues to plan for]

### Low Priority Issues
[Nice-to-have improvements]

## Recommendations
[Prioritized action items for user to decide]

## Appendix: Chain Trace Logs
[Detailed logs for each chain]
```

## Constraints and Rules

### Agent Boundaries (MUST follow)

1. **Main Agent**:
   - ✅ Create/manage Page Discovery, Exploration Agents and Subagents
   - ✅ Iterate through all pages
   - ✅ Aggregate results and check completeness
   - ✅ Write and update documentation
   - ❌ Never explore chains directly
   - ❌ Never correct issues directly

2. **Page Discovery Agent**:
   - ✅ Scan router/config for all pages
   - ✅ Return complete page inventory
   - ❌ Never analyze elements or chains

3. **Exploration Agent**:
   - ✅ Scan page for interactive elements
   - ✅ Return structured inventory
   - ❌ Never explore chains
   - ❌ Never analyze issues

4. **Subagent**:
   - ✅ Explore assigned element's complete chain
   - ✅ Trace all branches and endpoints
   - ✅ Identify and **document** issues
   - ✅ **Document suggested fixes** (as text)
   - ✅ Return detailed chain record
   - ❌ Never analyze other elements
   - ❌ Never modify other chains' records
   - ❌ **NEVER apply any code fixes**

### Process Order (MUST follow)

```
0. Main Agent creates Page Discovery Agent
1. Page Discovery Agent scans and returns complete page inventory
2. Main Agent receives page inventory
3. FOR EACH PAGE (iterate):
   a. Main Agent creates Exploration Agent for current page
   b. Exploration Agent scans and returns element inventory
   c. Main Agent receives inventory
   d. Main Agent creates ALL Subagents concurrently (single turn)
   e. Subagents execute independently and return results
   f. Main Agent aggregates and checks for gaps
   g. If gaps: create new Subagents, go to step e
   h. If complete: update cumulative report, continue to next page
4. When all pages complete: Main Agent generates final report
```

### Recording Rules

- **Incremental**: New chains add new records, never modify existing
- **Traceable**: Each record has unique ID and timestamp
- **Complete**: Include all nodes, branches, and endpoints
- **Objective**: Base issues on actual findings, not assumptions
- **Document Only**: Issues are documented with suggested fixes, never applied

### Termination Conditions

The analysis terminates when ALL of the following are met:
- [ ] All pages discovered and inventoried
- [ ] All pages have been analyzed
- [ ] All interactive elements across all pages have been analyzed
- [ ] All chains traced to their endpoints
- [ ] All branches documented
- [ ] All issues recorded with severity and suggested fixes (NOT applied)
- [ ] No unexplored paths remain
- [ ] **Final documentation report generated for user review**

## Usage Examples

**Example 1: Analyze entire application**
```
User: "Analyze all interaction chains in the application"
→ Skill discovers all pages, analyzes each page's elements, produces complete report
```

**Example 2: Analyze a specific page**
```
User: "Analyze the interaction chains on the Settings page"
→ Skill focuses on Settings page only, but still discovers all elements on that page
```

**Example 3: Trace a specific element**
```
User: "What happens when I click the Import button? Trace the complete flow."
→ Skill traces just this element's chain, documents the flow and any issues
```

**Example 4: Document all interactions**
```
User: "Document all interactive elements and their behaviors for the Library page"
→ Skill produces documentation without any code modifications
```

## Implementation Notes

### For Tauri Applications
- Use tauri-webdriver for interaction simulation
- Trace IPC calls between frontend and backend
- Document Rust command handlers in the chain
- Discover pages from router configuration

### For React Applications
- Trace state management (Zustand, Redux, Context)
- Document effect hooks and their triggers
- Map component lifecycle events
- Discover pages from React Router configuration

### For API-Heavy Chains
- Document request/response schemas
- Trace error handling paths
- Note retry and timeout behaviors

## Output Location

All analysis reports should be written to:
- `_bmad-output/interaction-analysis/[application-name]-analysis-[timestamp].md`

This ensures reports are preserved for user review and not lost.