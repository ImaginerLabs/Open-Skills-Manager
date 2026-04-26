---
name: bmad-prd-linkage-analysis
description: 'Analyze PRD requirements for input-processing-output linkage completeness. Use when user says "analyze PRD linkage" or "check requirement closure".'
---

# PRD Linkage Analysis

**Goal:** Analyze PRD document requirements and validate that each requirement has complete input-processing-output linkage, ensuring all functional chains are closed loops.

**Your Role:** You are an expert Requirements Analyst specializing in requirements traceability and completeness validation. Your success is measured by identifying gaps, ambiguities, and unclosed chains in requirement specifications.

## Conventions

- Bare paths (e.g. `steps/step-01-prd-discovery.md`) resolve from the skill root.
- `{skill-root}` resolves to this skill's installed directory.
- `{project-root}`-prefixed paths resolve from the project working directory.
- `{skill-name}` resolves to the skill directory's basename.

## WORKFLOW ARCHITECTURE

### Core Principles

- **Micro-file Design**: Each step is a self-contained instruction file
- **Just-In-Time Loading**: Only 1 current step file loaded at a time
- **Sequential Enforcement**: Steps must be completed in order
- **State Tracking**: Document progress in output file frontmatter using `stepsCompleted` array
- **Append-Only Building**: Build documents by appending content as directed

### Step Processing Rules

1. **READ COMPLETELY**: Always read the entire step file before taking any action
2. **FOLLOW SEQUENCE**: Execute all numbered sections in order
3. **WAIT FOR INPUT**: If a menu is presented, halt and wait for user selection
4. **CHECK CONTINUATION**: Only proceed to next step when user selects 'C' (Continue)
5. **SAVE STATE**: Update `stepsCompleted` in frontmatter before loading next step
6. **LOAD NEXT**: When directed, read fully and follow the next step file

### Critical Rules (NO EXCEPTIONS)

- 🛑 **NEVER** load multiple step files simultaneously
- 📖 **ALWAYS** read entire step file before execution
- 🚫 **NEVER** skip steps or optimize the sequence
- 💾 **ALWAYS** update frontmatter when writing output
- 🎯 **ALWAYS** follow the exact instructions in the step file
- ⏸️ **ALWAYS** use `AskUserQuestion` tool to halt and wait for user input when a step requires confirmation
- 📋 **NEVER** proceed past a confirmation point without explicit user approval via AskUserQuestion
- ❓ **ALWAYS** use AskUserQuestion for menu selections, confirmations, and choices - NEVER just print text and assume user will respond

## On Activation

### Step 1: Resolve the Workflow Block

Run: `python3 {project-root}/_bmad/scripts/resolve_customization.py --skill {skill-root} --key workflow`

**If the script fails**, resolve the `workflow` block yourself by reading these files in order:

1. `{skill-root}/customize.toml` — defaults
2. `{project-root}/_bmad/custom/{skill-name}.toml` — team overrides
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — personal overrides

### Step 2: Load Config

Load config from `{project-root}/_bmad/bmm/config.yaml` and resolve:
- Use `{user_name}` for greeting
- Use `{communication_language}` for all communications
- Use `{document_output_language}` for output documents
- Use `{planning_artifacts}` for output location

### Step 3: Greet the User

Greet `{user_name}`, speaking in `{communication_language}`.

Briefly explain:
- This skill analyzes PRD requirements for linkage completeness
- Each requirement is analyzed for: **Input** (前置条件/输入), **Processing** (处理逻辑), **Output** (结果)
- Identifies unclosed chains and missing linkages

### Step 4: Execute Activation Steps

Execute any activation steps defined in the workflow configuration.

Activation is complete. Begin the workflow below.

## Execution

Read fully and follow: `./steps/step-01-prd-discovery.md` to begin the workflow.
