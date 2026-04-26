---
name: bmad-epic-validation
description: 'Concurrently validate all stories in an epic for completeness, gaps, and issues. Use when the user wants to validate an epic, check story quality, or verify implementation readiness for an entire epic.'
---

# Epic Validation

**Goal:** Concurrently validate all stories within an epic, identify gaps and issues, then synthesize findings into an actionable summary.

**Your Role:** You are a meticulous Quality Assurance Lead specializing in story validation. You spot missing acceptance criteria, incomplete tasks, ambiguous specifications, and implementation risks before development begins.

---

## INITIALIZATION

### Configuration Loading

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve:

- `project_name`, `user_name`
- `communication_language`, `document_output_language`
- `implementation_artifacts`, `planning_artifacts`
- `date` as system-generated current datetime

### Paths

- `sprint_status_file` = `{implementation_artifacts}/sprint-status.yaml`
- `stories_dir` = `{implementation_artifacts}/stories`
- `epics_dir` = `{implementation_artifacts}` (epic files at root level)

---

## EXECUTION

### Step 1: Identify Target Epic

<action>Load {sprint_status_file} to discover available epics</action>
<action>Parse development_status to identify all epic keys (pattern: `epic-N` where N is a number)</action>

<check if="epic_id provided as argument">
  <action>Validate epic exists in sprint-status.yaml</action>
  <check if="epic not found">
    <output>❌ Epic `{epic_id}` not found in sprint-status.yaml.</output>
    <action>Exit workflow</action>
  </check>
</check>

<check if="no epic_id provided">
  <output>
## Available Epics

{{#each epics}}
- **{{epic_id}}**: {{status}} ({{story_count}} stories)
{{/each}}
  </output>
  <ask>Which epic would you like to validate? Enter the epic ID (e.g., "epic-1"):</ask>
  <action>Store selected epic as {target_epic}</action>
</check>

<action>Continue to Step 2</action>

### Step 2: Discover Stories

<action>From sprint-status.yaml, extract all story keys matching pattern `{epic_number}-*` (e.g., for epic-1, find 1-1-*, 1-2-*, etc.)</action>
<action>Filter out retrospective entries (keys ending with `-retrospective`)</action>
<action>Build list: {story_ids} with their statuses</action>

<check if="no stories found for epic">
  <output>❌ No stories found for {target_epic}.</output>
  <action>Suggest running `/bmad-create-story` to create the first story</action>
  <action>Exit workflow</action>
</check>

<output>
## Stories to Validate

| Story ID | Status | File |
|----------|--------|------|
{{#each stories}}
| {{id}} | {{status}} | {{file}} |
{{/each}}

**Total:** {{story_count}} stories
</output>

<action>Continue to Step 3</action>

### Step 3: Load Reference Documents

<action>Load these reference documents for validation context:</action>

| Document | Path Pattern | Purpose |
|----------|--------------|---------|
| PRD | `{planning_artifacts}/prd.md` or `**/prd*.md` | Requirements traceability |
| Architecture | `{planning_artifacts}/architecture.md` | Technical constraints |
| UX Design | `{planning_artifacts}/ux-design*.md` | UX requirements |
| Epic File | `{implementation_artifacts}/epic-{N}*.md` | Epic-level requirements |

<action>Store loaded references as {validation_context}</action>

### Step 4: Concurrent Story Validation

<action>Spawn a subagent for EACH story using the Agent tool. All agents run in parallel.</action>

**For each story, spawn an agent with this prompt:**

```
You are a Story Validator performing a quality check on a single story file.

## Story to Validate
- Story ID: {{story_id}}
- File: {{story_file}}

## Validation Checklist

Read the story file and validate against these criteria:

### 1. Completeness
- [ ] Story statement follows user story format (As a... I want... So that...)
- [ ] All acceptance criteria are testable and unambiguous
- [ ] Tasks/subtasks cover all acceptance criteria
- [ ] No tasks are missing checkmarks for completed work

### 2. Requirements Traceability
- [ ] Each AC maps to specific PRD requirements (FR/NFR references)
- [ ] No orphaned requirements (PRD requirements not covered by any story)
- [ ] NFRs are addressed (performance, security, accessibility)

### 3. Technical Alignment
- [ ] Dev notes reference correct architecture patterns
- [ ] File paths match project structure conventions
- [ ] Dependencies on other stories/components are documented
- [ ] No conflicts with architecture decisions

### 4. Implementation Quality
- [ ] Task breakdown is granular enough (each task < 4 hours)
- [ ] Deferred items are clearly marked with target story
- [ ] Test tasks are included (unit, integration, E2E as appropriate)
- [ ] Performance targets have measurable criteria

### 5. Clarity & Ambiguity
- [ ] No vague terms without definition (e.g., "appropriate", "reasonable")
- [ ] Edge cases are considered
- [ ] Error handling scenarios are documented

## Output Format

Return your findings as:

```
## Story {{story_id}} Validation

**Status:** ✅ PASS / ⚠️ WARNINGS / ❌ ISSUES

### Issues Found
1. [Category] Description of issue
2. ...

### Warnings
1. [Category] Non-critical observation
2. ...

### Recommendations
1. Suggested improvement
2. ...

### Summary
One-sentence summary of story health.
```

If the story is complete and has no issues, state "✅ PASS - Story is well-formed and complete."
```

**Spawn all story validation agents in a SINGLE message** so they execute concurrently.

### Step 5: Aggregate Results

<action>Collect all subagent validation reports</action>
<action>Parse each report for status (PASS/WARNINGS/ISSUES)</action>

<action>Compute aggregate metrics:</action>
- `pass_count` = stories with ✅ PASS
- `warning_count` = stories with ⚠️ WARNINGS
- `issue_count` = stories with ❌ ISSUES
- `total_validated` = all stories processed

### Step 6: Synthesize Findings

<action>Group issues by category across all stories:</action>

| Category | Description |
|----------|-------------|
| Completeness | Missing AC, tasks, or documentation |
| Traceability | Unmapped requirements, orphaned FRs |
| Technical | Architecture conflicts, wrong paths |
| Quality | Task granularity, missing tests |
| Clarity | Ambiguous terms, missing edge cases |

<action>Identify cross-cutting issues (problems appearing in multiple stories)</action>
<action>Identify blocking issues (must fix before development)</action>

### Step 7: Generate Validation Report

<output>
## 📋 Epic {{epic_id}} Validation Report

**Generated:** {{date}}
**Stories Validated:** {{total_validated}}

### Summary

| Status | Count |
|--------|-------|
| ✅ Pass | {{pass_count}} |
| ⚠️ Warnings | {{warning_count}} |
| ❌ Issues | {{issue_count}} |

### Cross-Cutting Issues

{{#if cross_cutting_issues}}
{{#each cross_cutting_issues}}
- **{{category}}**: {{description}} (affects {{affected_stories}} stories)
{{/each}}
{{else}}
No cross-cutting issues identified.
{{/if}}

### Blocking Issues

{{#if blocking_issues}}
{{#each blocking_issues}}
- [{{story_id}}] {{description}}
{{/each}}
{{else}}
✅ No blocking issues found.
{{/if}}

### Story-by-Story Results

{{#each story_results}}
<details>
<summary>{{story_id}} — {{status}}</summary>

{{validation_report}}

</details>
{{/each}}

---

### Recommendations

1. **Immediate Actions** (blocking issues)
   {{#each blocking_issues}}
   - Fix: {{description}} in {{story_id}}
   {{/each}}

2. **Before Development** (warnings)
   {{#each warning_items}}
   - Review: {{description}} in {{story_id}}
   {{/each}}

3. **Nice to Have** (recommendations)
   {{#each recommendations}}
   - {{description}}
   {{/each}}

</output>

### Step 8: Offer Actions

<ask>
What would you like to do next?

1. **Export report** — Save validation report to file
2. **Fix issues** — Open the first story with blocking issues
3. **Re-validate** — Run validation again after fixes
4. **Exit** — Return to normal workflow

Choice:</ask>

<check if="choice == 1">
  <action>Write report to `{implementation_artifacts}/epic-{N}-validation-{date}.md`</action>
  <output>✅ Report saved to `{output_path}`</output>
</check>

<check if="choice == 2">
  <action>Identify first story with blocking issues</action>
  <output>Run `/bmad-dev-story` with story_key={{story_with_issues}}</output>
</check>

<check if="choice == 3">
  <action>Restart validation from Step 1</action>
</check>

<check if="choice == 4">
  <action>Exit workflow</action>
</check>

---

## Arguments

This skill accepts optional arguments:

- `epic_id` — Target epic to validate (e.g., `epic-1`). If omitted, presents a selection menu.
- `--quick` — Run a quick validation (completeness checks only, skip traceability analysis)
- `--fix` — After validation, automatically open first story with issues

## Example Usage

```
/bmad-epic-validation epic-1
/bmad-epic-validation epic-2 --quick
/bmad-epic-validation --fix
```
