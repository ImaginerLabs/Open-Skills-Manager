# Step 2: Requirement Extraction

## Objective
Extract each requirement and identify its Input-Processing-Output components.

## Instructions

### 2.1 Parse Requirements Tables

For each requirements section found in Step 1:

1. Identify the table structure (ID, Requirement, Acceptance Criteria columns)
2. Extract each row as a discrete requirement
3. Store requirement metadata:
   - ID (e.g., FR-1.1)
   - Description (Requirement column)
   - Acceptance Criteria (if present)
   - Parent Module (e.g., FR-1: App Library Management)

### 2.2 Analyze Each Requirement

For each requirement, analyze the three dimensions:

#### Dimension 1: INPUT (前置条件/输入)

Identify what must exist or be provided BEFORE this requirement can be executed:

**Questions to answer:**
- What data is needed? (user input, system state, files, etc.)
- What preconditions must be true? (user logged in, file exists, etc.)
- What triggers this requirement? (user action, system event, etc.)
- What dependencies exist? (other requirements, external systems)

**Common input types:**
- User actions (click, drag, type)
- File system state (files, folders, permissions)
- Application state (current view, selected items)
- External data (iCloud status, network availability)
- Configuration (settings, preferences)

#### Dimension 2: PROCESSING (处理逻辑)

Identify what the system DOES with the inputs:

**Questions to answer:**
- What operations are performed? (CRUD, validation, transformation)
- What business logic applies? (rules, constraints, calculations)
- What integrations are involved? (IPC calls, API calls, file operations)
- What state changes occur? (UI updates, data mutations)

**Common processing types:**
- Validation (format check, permission check)
- File operations (read, write, copy, delete)
- Data transformation (parsing, formatting)
- State management (store, update, clear)
- IPC communication (Rust ↔ Frontend)
- UI rendering (display, update, animate)

#### Dimension 3: OUTPUT (结果)

Identify what results from the processing:

**Questions to answer:**
- What is produced? (data, files, UI state)
- What feedback is given? (success message, error, visual indicator)
- What side effects occur? (file created, state changed, sync triggered)
- How is success verified? (acceptance criteria)

**Common output types:**
- Data output (returned data, stored data)
- File system changes (created, modified, deleted files)
- UI feedback (toast, dialog, animation)
- State changes (updated store, navigation)
- External effects (iCloud sync, notification)

### 2.3 Document Analysis Format

For each requirement, create an analysis entry:

```markdown
### {ID}: {Description}

**Module:** {Parent Module}

#### 📥 INPUT (前置条件/输入)
| Type | Description | Source |
|------|-------------|--------|
| User Action | Click "Import" button | User |
| File System | Selected folder path | File Picker |
| Validation | SKILL.md exists check | System |

**Preconditions:**
- User has selected a valid folder
- App has file system permissions
- Folder contains SKILL.md at root

#### ⚙️ PROCESSING (处理逻辑)
1. Receive folder path from file picker
2. Validate folder structure (SKILL.md exists)
3. Parse SKILL.md frontmatter
4. Calculate skill size and file count
5. Generate UUID for skill
6. Copy folder to iCloud container
7. Update library index

**IPC Calls:**
- `library_import(path, options)`

**State Changes:**
- Library store: add new skill
- UI: show import success

#### 📤 OUTPUT (结果)
| Type | Description | Verification |
|------|-------------|--------------|
| Data | New LibrarySkill object | Appears in library list |
| File | Skill folder in iCloud | Path exists |
| UI | Success toast | User sees confirmation |
| Sync | iCloud sync triggered | Sync status updates |

**Acceptance Criteria Met:**
- [ ] Skill appears in library within 300ms
- [ ] All files copied correctly
- [ ] SKILL.md parsed successfully
```

### 2.4 Progress Indicator

Show progress as requirements are analyzed:

```
🔄 分析进度: [████████░░░░░░░░] 45/120 requirements

当前: FR-3.5 - Deployment conflict handling
```

### 2.5 Store Analysis Results

Save the complete analysis to a structured format for Step 3.

### 2.6 Proceed to Next Step

After all requirements are analyzed:

**Frontmatter Update:**
```yaml
stepsCompleted: ['step-01-prd-discovery', 'step-02-requirement-extraction']
analysisComplete: true
```

Read and follow: `./steps/step-03-linkage-validation.md`
