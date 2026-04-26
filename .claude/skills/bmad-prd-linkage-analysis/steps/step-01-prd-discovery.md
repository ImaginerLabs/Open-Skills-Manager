# Step 1: PRD Document Discovery

## Objective
Locate and load the PRD document for analysis.

## Instructions

### 1.1 Check for PRD in Standard Locations

Search for PRD documents in the following locations (in order):

1. `{project-root}/docs/knowledge/` - Look for files containing "PRD" or "需求文档" in the name
2. `{project-root}/docs/` - Look for PRD-related files
3. `{project-root}/` - Look for README or PRD files at root

Use Glob to find candidate files:
```
docs/knowledge/*PRD*.md
docs/knowledge/*需求*.md
docs/*PRD*.md
*PRD*.md
```

### 1.2 Present PRD Selection Menu (If Multiple PRDs Found)

If multiple PRD documents are found, **HALT and use AskUserQuestion tool**:

```
问题: "请选择要分析的 PRD 文档:"
选项:
  - "[1] docs/knowledge/XXX-PRD.md"
  - "[2] docs/PRD.md"
  - "Other (输入自定义路径)"
```

**If only one PRD is found**, proceed directly to Step 1.3 without asking.

**Wait for user selection before proceeding.**

### 1.3 Load PRD Content

Once PRD is selected:
1. Read the full PRD document
2. Parse the frontmatter for metadata
3. Identify the document structure (sections, requirements tables)

### 1.4 Identify Requirements Sections

Scan the PRD for requirements sections. Look for:
- Functional Requirements (FR-*)
- Non-Functional Requirements (NFR-*)
- User Stories
- Acceptance Criteria tables
- Any section with requirement IDs (e.g., FR-1.1, NFR-P1)

### 1.5 Display Summary and WAIT for User Confirmation

Show a summary of discovered requirements:

```
📊 PRD 分析摘要

文档: {filename}
版本: {version from frontmatter}
最后更新: {lastUpdated}

发现的需求模块:
- FR-1: App Library Management (7 requirements)
- FR-2: Skill Import/Export (11 requirements)
- FR-3: Skill Deployment (10 requirements)
...
- NFR-P: Performance (7 requirements)
- NFR-S: Security (4 requirements)
...

总计: {X} 个功能需求, {Y} 个非功能需求
```

**🛑 CRITICAL: HALT AND WAIT FOR USER INPUT**

Use the `AskUserQuestion` tool to ask:

```
问题: "是否开始链路分析？"
选项:
  - "开始分析 (Continue)" - 继续执行 Step 2
  - "退出 (Quit)" - 终止工作流
```

**DO NOT proceed to Step 2 until user explicitly confirms.**

### 1.6 Proceed to Next Step

**Frontmatter Update:**
```yaml
stepsCompleted: ['step-01-prd-discovery']
prdPath: '{selected-prd-path}'
requirementsCount: {total}
```

Read and follow: `./steps/step-02-requirement-extraction.md`
