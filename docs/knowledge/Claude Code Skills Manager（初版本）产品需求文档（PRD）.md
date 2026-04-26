---
workflowType: 'prd'
workflow: 'edit'
classification:
  domain: 'developer-tools'
  projectType: 'desktop-application'
  complexity: 'moderate'
  platform: 'macos-only'
inputDocuments:
  - 'docs/knowledge/Claude Code Skills Manager（初版本）产品需求文档（PRD）.md'
  - '.firecrawl/tauri-v2-main.md'
  - '.firecrawl/tauri-plugins.md'
stepsCompleted: ['step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '2026-04-26'
editHistory:
  - date: '2026-04-25'
    changes: 'Full BMAD restructure: added Executive Summary, Success Criteria, Product Scope, User Personas, User Journeys, NFRs, MoSCoW priorities, Competitive Analysis, Architecture Decisions, Data Models, Timeline, Onboarding Flow'
  - date: '2026-04-25'
    changes: 'Updated technology stack with latest NPM versions: Electron 41.3.0, React 19.2.5, TypeScript 6.0.3, TailwindCSS 4.2.4, Vite 8.0.10, OpenAI SDK 6.34.0'
  - date: '2026-04-26'
    changes: 'Major architecture change: migrated from Electron to Tauri v2, added macOS-only platform focus, promoted iCloud Sync to MVP (Must priority), updated performance targets for native app, added Rust backend'
  - date: '2026-04-26'
    changes: 'Changed styling from TailwindCSS to CSS Modules + Sass; Expanded FR-6 Smart Categorization with AI-powered classification; Expanded FR-7 LLM Integration with multi-provider support (OpenAI, Anthropic, DeepSeek, Ollama, custom); Added LLMProvider and LLMModel data models; Added LLM-related IPC commands'
  - date: '2026-04-26'
    changes: 'Major scope change: removed remote source search/install features; focused on local skill library management; added FR-1 (Library Management), FR-2 (Skill Import), FR-3 (Skill Deployment); updated user journeys and timeline; updated competitive analysis'
  - date: '2026-04-26'
    changes: 'Clarified storage concepts: App Library (iCloud synced, user-managed), Global Skills (~/.claude/skills/), Project Skills (per-project); Added FR-4 Global Skills View, FR-5 Project Skills View, FR-6 Unified Search; Updated data models with LibrarySkill, InstalledSkill, Project entities; Only supports Claude Code CLI'
  - date: '2026-04-26'
    changes: 'MVP scope reduction: removed all LLM-related features (Smart Categorization, Bilingual Translation, LLM Integration) from MVP; moved to Growth (V1.1); simplified dependencies, IPC commands, data models, and timeline; reduced from 10-week to 8-week schedule'
  - date: '2026-04-26'
    changes: 'Added FR-8 Localization (EN + ZH-CN, system language detection) and FR-9 Theme Support (Light/Dark mode, system preference detection) to MVP; added i18next dependencies; updated IPC commands for locale/theme; updated competitive analysis'
  - date: '2026-04-26'
    changes: 'Clarified Skill as folder structure with SKILL.md + optional resource files; added SkillFolderStructure section; updated FR-2 with resource file handling; extended LibrarySkill and InstalledSkill data models with folderName, size, fileCount, hasResources fields; added SkillFile interface'
  - date: '2026-04-26'
    changes: 'Added FR-10 Skill Content Preview with rich markdown rendering, code syntax highlighting, frontmatter parsing, GFM support, TOC generation; added react-markdown, react-syntax-highlighter, gray-matter, remark-gfm dependencies'
  - date: '2026-04-26'
    changes: 'Updated dependencies to latest versions: i18next 24.2.2→26.0.8, react-i18next 15.4.1→17.0.4, i18next-browser-languagedetector 8.0.4→8.2.1, react-syntax-highlighter 15.6.1→16.1.1, sass 1.86.0→1.99.0'
  - date: '2026-04-26'
    changes: 'Added NFR-L Loading States section with skeleton screen requirements for all data loading scenarios (skill list, detail, sidebar, search); unified skeleton components with pulse animation'
  - date: '2026-04-26'
    changes: 'Added FR-2.9-2.11 import progress requirements (progress bar, status feedback, cancel); Added FR-3.8-3.10 batch deploy progress requirements; Added NFR-O Operation Progress section (progress dialog, cancel, retry, result summary)'
  - date: '2026-04-26'
    changes: 'Added Phosphor Icons (@phosphor-icons/react v2.1.8) as icon library - 9,072 Apple-style icons with 6 weight variants, tree-shakable, MIT license'
  - date: '2026-04-26'
    changes: 'Validation-driven improvements: Added FR-11 Auto-Update (check, download, install, rollback); Added NFR-E Error Handling (global boundary, logging, recovery, graceful degradation); Added NFR-M Performance Monitoring (startup tracking, memory monitoring, crash reporting); Added Auto-Update IPC commands'
  - date: '2026-04-26'
    changes: 'Clarified project repository source: users manually add projects; Added FR-5.9-5.12 auto-refresh requirements (on page open, periodic background, manual refresh, refresh indicator)'
  - date: '2026-04-26'
    changes: 'Extended IPC Channel Design with new command groups: Security & Error (sanitize, logs, report), Library Management Extended (categories/groups CRUD, validate deployments), Skill Operations Extended (file read), Search Extended (snippets), Deployment Extended (remove), Auto-Update Extended (rollback), Performance Monitoring (startup, memory, operations, crashes), State Management (snapshot, restore), IPC Events (update progress, theme change, iCloud sync)'
  - date: '2026-04-26'
    changes: 'Fixed NFR-S Security module: Added NFR-S1 dangerous commands classification (shell/script/file/code injection), sanitization libraries (DOMPurify + Rust sanitize crate), sanitization pipeline; Added NFR-S2 Tauri capability mapping for all IPC command groups with configuration example; Added NFR-S4 sensitive files definition and NSFileProtectionComplete implementation details'
  - date: '2026-04-26'
    changes: 'Extended NFR-E Error Handling with detailed subsections: NFR-E1 ErrorBoundary UI spec (component path, fallback UI, props interface); NFR-E2 Error Logging spec (log path, JSON Lines format, field schema, rotation policy); NFR-E3 Error Code Classification (code ranges E001-E499, error code examples table with EN/ZH messages); NFR-E4 Error Recovery Classification (recoverable vs fatal, recovery options mapping, action types); NFR-E5 Feature Criticality Matrix (Critical/Important/Optional levels, detailed fallback behaviors); NFR-E6 Rust Error Type Definition (AppError enum, type conversions, IpcResult); NFR-E7 OS Error Mapping (errno to user messages with i18n keys); NFR-E8 iCloud Error Detection (NSUbiquityIdentityError mapping, quota detection, conflict UI, status indicators)'
  - date: '2026-04-26'
    changes: 'Extended FR-10 Skill Content Preview with detailed subsections: FR-10.5 TOC data structure (TableOfContents/HeadingNode references, TOC generation trigger at >500 lines, rendering spec with sidebar/click navigation/activeId highlight, line count detection methods); FR-10.7 Resource file IPC (skill_file_read command reference, preview flow diagram, error handling for file not found/too large); FR-10.8 FileType preview mapping (FileType enum reference, component mapping table with 8 file types, file type detection logic with extension mapping and content analysis)'
  - date: '2026-04-26'
    changes: 'Fixed FR-3 Deployment Tracking gaps: Added FR-3.6 UI spec (deployment count badge on Skill Card, "Deployed to" list in Detail Panel, missing deployment warning, DeploymentStatus interface); Added FR-3.7 delete sync spec (synchronization flow for global_delete/project_skill_delete, deployment_remove IPC command, Rust implementation); Added FR-3.10 cancel rollback spec (Preserve Completed default strategy, Undo All option, cancel result summary UI, undoAllDeployments implementation)'
  - date: '2026-04-26'
    changes: 'Fixed FR-6 Unified Search gaps: Added FR-6.3 SearchResult rendering spec (matchedSnippet/highlightRanges fields, rendering rules); Added FR-6.4 Category Filter UI spec (library_categories_list IPC reference, dropdown UI, behavior); Added FR-6.5 GroupedSearchResults rendering spec (group display rules, UI structure, group toggle); Added FR-6.1 Project Scope Selector spec (project_list IPC reference, dropdown UI); Added FR-6.2 Debounce Strategy spec (300ms debounce, min query length, cache TTL, performance notes)'
  - date: '2026-04-26'
    changes: 'Fixed NFR-P Performance gaps: Added NFR-P2 Virtualization Strategy (react-window spec, trigger at >100 skills, overscan 5 items, performance verification with 1000 skills test); Added NFR-P3 Search Index Strategy (in-memory inverted index, SearchIndex interface, rebuild strategy, cache validation); Added NFR-P4 Memory Management (idle detection at 5 min, cleanup actions, recovery on interaction, threshold adjustment: 120MB active/50MB idle); Added NFR-P5 Skill Data Virtualization (metadata size estimation, SKILL.md on-demand loading, LRU cache, memory budget); Added NFR-P6 React Optimization (useMemo/useCallback/React.memo specs, Web Worker for >50ms operations); Added NFR-P7 Bundle Size CI check (5MB threshold, tree-shaking, code splitting, lazy loading)'
  - date: '2026-04-26'
    changes: 'Fixed FR-11 Auto-Update gaps: Added FR-11.4 Download Progress Stream (update_progress_event IPC reference, UpdateProgressEvent interface with progress/status/downloadedBytes/totalBytes/downloadSpeed, Tauri event listener spec, progress UI requirements); Added FR-11.5 Restart Mechanism (app.restart() and tauri.process.relaunch() methods, installation flow with checksum verification/backup/replace/restart, failure handling table, Rust implementation); Added FR-11.9 Network Status Detection (HTTP-based network check, offline handling flow diagram, retry logic table, UpdateCheckState interface); Added FR-11.10 Rollback Strategy (update_rollback IPC reference, backup strategy table with path/content/timing/cleanup, backup creation code, rollback trigger conditions table, CrashTracker struct for crash detection, rollback flow diagram, Rust implementation, rollback notification UI)'
---

# Claude Code Skills Manager - Product Requirements Document

## 1. Executive Summary

### Vision

Claude Code Skills Manager (CSM) is a macOS-native visual management tool for Claude Code CLI Skills. It provides a centralized skill library with iCloud sync, while also allowing users to view and manage skills deployed across global scope and multiple projects.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **Skill** | A folder containing `SKILL.md` (required) and optional resource files (templates, prompts, configs, etc.). The folder name becomes the skill identifier. |
| **App Library** | User's personal skill collection stored in iCloud container. User manually imports/exports, organizes with categories/groups. iCloud syncs this space only. |
| **Global Skills** | Skills deployed to `~/.claude/skills/` (Claude Code CLI global scope) |
| **Project Skills** | Skills deployed to `.claude/skills/` in specific project directories |
| **Deployment** | Copying a skill (entire folder) from App Library to Global or Project scope |

### Skill Folder Structure

```
skill-name/                    # Folder name = skill identifier
├── SKILL.md                   # Required: Skill definition file
├── templates/                 # Optional: Template files
│   └── example.tmpl
├── prompts/                   # Optional: Prompt templates
│   └── system-prompt.md
├── configs/                   # Optional: Configuration files
│   └── settings.json
└── assets/                    # Optional: Other resources
    └── diagram.png
```

**Validation Rules:**
- `SKILL.md` must exist at root level
- Folder name must be valid (alphanumeric, hyphens, underscores)
- All files within folder are treated as part of the skill
- Maximum skill size: 10MB (configurable)

### Differentiator

| Competitor | Gap | CSM Solution |
|------------|-----|--------------|
| Claude Code CLI | No GUI, can't see all skills across projects | Visual overview of all scopes (App/Global/Projects) |
| Manual file management | No centralized library, no sync | iCloud-synced library + multi-project visibility |
| LobeHub Web | Browser-based, no local management | Local-first with iCloud sync |

### Target Users

- **Primary:** Chinese macOS developers using Claude Code CLI who want centralized skill management
- **Secondary:** Team leads managing skill distribution across multiple projects

### Core Value Proposition

> "One library, all your projects. Import, organize, and deploy Claude Code Skills with iCloud sync."

---

## 2. Success Criteria

| ID | Metric | Target | Measurement Method |
|----|--------|--------|-------------------|
| SC-1 | First skill import time | < 2 minutes | From app launch to first skill imported |
| SC-2 | Skill deployment success rate | > 95% | Successful deployments / total attempts |
| SC-3 | App crash rate | < 0.1% | Crashes per 1000 sessions |
| SC-4 | Daily active users (30-day) | 500+ | Unique users opening app daily |

---

## 3. Product Scope

### MVP (V1.0)

| Priority | Module | Description |
|----------|--------|-------------|
| Must | App Library Management | View, organize (categories/groups), delete skills in App Library |
| Must | Skill Import/Export | Import skills from files/folders, export skills as packages |
| Must | Skill Deployment | Deploy skills from Library to Global/Project scope |
| Must | Global Skills View | View and manage skills in `~/.claude/skills/` |
| Must | Project Skills View | View skills across multiple projects, browse project directories |
| Must | Unified Search | Search across App Library, Global, and Project skills |
| Must | iCloud Sync | Sync App Library across devices (not Global/Project skills) |
| Must | Localization (i18n) | English (default) + Chinese UI, auto-detect system language |
| Must | Theme Support | Light/Dark mode, follow system preference or manual toggle |
| Must | Auto-Update | Check for updates on launch, download and install with user consent |

### Growth (V1.1)

| Priority | Module | Description |
|----------|--------|-------------|
| Should | Smart Categorization | AI-powered skill classification in App Library |
| Should | Bilingual Translation | Auto-translate English skills to Chinese |
| Should | Skill Export | Export skills as shareable packages |
| Could | Skill Editing | Basic skill content editing |
| Could | Version Tracking | Track skill versions and updates |

### Vision (V2.0+)

| Priority | Module | Description |
|----------|--------|-------------|
| Won't | Remote Source Search | Search Claude official + LobeHub sources |
| Won't | Team Collaboration | Shared skill libraries |
| Won't | Skill Development Tools | Built-in skill editor/debugger |

---

## 4. User Personas

### Persona A: 林小白 (Novice Developer)

| Attribute | Detail |
|-----------|--------|
| **Profile** | Career changer, 6 months frontend experience, uses Claude Code daily |
| **Pain Points** | Doesn't understand `.claude/skills` directory structure, fears "breaking something" |
| **Needs** | One-click install, zero configuration, clear guidance |
| **JTBD** | "When I encounter repetitive tasks, I want a ready-made solution so I can focus on valuable code." |

### Persona B: 陈工 (Team Lead)

| Attribute | Detail |
|-----------|--------|
| **Profile** | 5 years backend experience, manages team infrastructure, team members have varying skill levels |
| **Pain Points** | Team coding standards inconsistent, no unified skill distribution mechanism |
| **Needs** | Batch management, version control, distribution capabilities |
| **JTBD** | "When team has new coding standards, I want to quickly package and distribute so everyone stays aligned." |

---

## 5. User Journeys

### Journey A: 林小白 - First Time User

#### Phase 1: Discovery

| Step | Touchpoint | Thought/Emotion | Pain Point | Success Metric |
|------|------------|-----------------|------------|----------------|
| 1.1 | GitHub PR comment | "What is this? Can I use it?" | Don't know where to start | — |
| 1.2 | Search finds CSM | "There's a GUI tool, let me try" | Unsure if safe/reliable | Find official docs |
| 1.3 | Download & install | "Hope it's not too complex" | >3 steps = abandonment | Complete in < 2 min |

#### Phase 2: First Use

| Step | Touchpoint | Thought/Emotion | Pain Point | Success Metric |
|------|------------|-----------------|------------|----------------|
| 2.1 | Open app, see empty library | "What should I do?" | No guidance | Show onboarding |
| 2.2 | Click "Import Skill" | "I have some skills downloaded" | Don't know which folder | Folder picker with hints |
| 2.3 | Select skill folder | "This looks right" | Validation needed | Format check passes |
| 2.4 | See skill in library | "It worked!" | — | Skill appears in list |
| 2.5 | Click "Deploy to Project" | "How do I use it?" | Don't know target path | Project browser helps |

#### Phase 3: Daily Use

| Step | Touchpoint | Thought/Emotion | Pain Point | Success Metric |
|------|------------|-----------------|------------|----------------|
| 3.1 | Open CSM, see skill library | "All my skills in one place" | — | Library loads fast |
| 3.2 | Deploy skill to new project | "Quick setup" | — | Deploy in < 5s |
| 3.3 | Use skill in Claude Code | "This saves time!" | — | 50% task time reduction |

### Journey B: 陈工 - Team Distribution

| Step | Action | Success Metric |
|------|--------|----------------|
| 1 | Import team skill standards to library | Import succeeds on first try |
| 2 | Classify skills with AI | All skills categorized in < 30s |
| 3 | Deploy to team project | Deploy succeeds on first try |
| 4 | Share library via iCloud | Team members see same library |

---

## 6. Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│           Welcome to Claude Code Skills Manager              │
│                                                             │
│  [Video Demo: 30-second overview]                           │
│                                                             │
│  What would you like to do?                                 │
│  ○ Import existing skills from my computer                  │
│  ○ I'm new - show me how to find and import skills          │
│                                                             │
│  [Get Started]                                              │
└─────────────────────────────────────────────────────────────┘
```

**Import Path:**
1. Open file picker to select skill folder
2. Validate SKILL.md format
3. Import to library, show success
4. Suggest: "Deploy to a project?"

---

## 7. Functional Requirements

### FR-1: App Library Management (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-1.1 | Display skills in App Library | List loads in < 300ms for 1000 skills |
| FR-1.2 | View skill details | Show SKILL.md content with rich preview (see FR-10) |
| FR-1.3 | Delete skill from library | Skill removed from iCloud container, list updated |
| FR-1.4 | Organize with categories | Create, rename, delete custom categories |
| FR-1.5 | Organize with groups | Create, rename, delete custom groups (nested under categories) |
| FR-1.6 | Drag & drop organization | Move skills between categories/groups |
| FR-1.7 | Real-time library monitoring | List updates within 2s of iCloud sync |

### FR-2: Skill Import/Export (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-2.1 | Import from local folder | Select skill folder, validate SKILL.md exists at root |
| FR-2.2 | Import from .zip file | Select .zip containing skill folder, extract and validate |
| FR-2.3 | Batch import | Import multiple skills at once (multiple folders or .zip files) |
| FR-2.4 | Format validation | Validate: SKILL.md exists, folder name is valid, size ≤ 10MB |
| FR-2.5 | Duplicate handling | Prompt user: skip/replace/rename |
| FR-2.6 | Resource file handling | All files in skill folder are imported together |
| FR-2.7 | Export single skill | Export as .zip or folder (includes all resource files) |
| FR-2.8 | Export multiple skills | Batch export with selection (each skill as separate .zip) |
| FR-2.9 | Import progress indicator | Show progress bar with current/total count during batch import |
| FR-2.10 | Import status feedback | Show success/error count, allow retry failed imports |
| FR-2.11 | Cancel import | Allow user to cancel ongoing batch import operation |

### FR-3: Skill Deployment (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-3.1 | Deploy to Global scope | Copy skill from Library to `~/.claude/skills/` |
| FR-3.2 | Deploy to Project scope | Copy skill from Library to `<project>/.claude/skills/` |
| FR-3.3 | Deploy from Global to Project | Copy skill from Global to specific project |
| FR-3.4 | Quick deploy menu | Right-click → "Deploy to..." with recent projects |
| FR-3.5 | Deployment conflict handling | Prompt user: overwrite/skip/rename |
| FR-3.6 | Deployment tracking | Show where each Library skill is deployed |
| FR-3.7 | Remove deployed skill | Delete skill from Global/Project scope |
| FR-3.8 | Batch deploy progress | Show progress bar when deploying multiple skills |
| FR-3.9 | Deployment status feedback | Show success/error count for batch operations |
| FR-3.10 | Cancel deployment | Allow user to cancel ongoing batch deployment |

#### FR-3.6: Deployment Tracking UI Specification

**UI Display Requirements:**

| Location | Element | Content |
|----------|---------|---------|
| Skill Card | Deployment count badge | Badge with deployment count (e.g., "2" with icon), hidden if 0 |
| Skill Detail Panel | "Deployed to" section | List of all deployment locations |
| Skill Detail Panel | Global deployment | "✓ Global Scope" |
| Skill Detail Panel | Project deployment | "✓ {projectName}" |
| Skill Detail Panel | Missing deployment | Warning icon + "⚠ Location missing" (path no longer exists) |

**DeploymentStatus Interface:**

```typescript
interface DeploymentStatus {
  id: string;                      // Deployment record ID
  targetScope: 'global' | 'project';
  targetPath: string;              // Actual deployed path
  projectName?: string;            // Project name if project scope
  deployedAt: Date;
  exists: boolean;                 // Whether deployed folder still exists
  isValid: boolean;                // Whether deployment is valid (SKILL.md exists)
}

interface SkillDeploymentDisplay {
  skillId: string;
  totalCount: number;              // Total deployment count for badge
  locations: DeploymentStatus[];
  hasWarnings: boolean;            // True if any deployment is invalid/missing
}
```

**Badge Styling:**

| State | Appearance |
|-------|------------|
| No deployments | Badge hidden |
| 1-9 deployments | Small circular badge with count |
| 10+ deployments | Badge shows "9+" |
| Has warnings | Badge background changes to warning color |

**Acceptance Criteria:**
- Skill Card shows deployment count badge (hidden if count is 0)
- Skill Detail Panel displays full deployment list with scope icons
- Missing deployments show warning indicator
- Click on deployment item navigates to target scope view
- Badge updates within 500ms of deployment change

#### FR-3.7: Delete Synchronization with Library.deployments

**Synchronization Flow:**

When `global_delete` or `project_skill_delete` is executed:

```
1. Identify Deployment Record
   └─ Find matching Deployment in LibrarySkill.deployments[]
      └─ Match by: folderName + targetPath

2. Remove Deployment Record
   └─ Call IPC: deployment_remove
      └─ Parameters: { skillId, deploymentId }

3. Update Library State
   └─ Remove deployment from LibrarySkill.deployments[]
   └─ Update skill card badge count
   └─ If deployments array is now empty, hide badge

4. Emit State Update Event
   └─ dispatch('library:deployment-removed', { skillId, deploymentId })
```

**IPC Command Reference:**

| Command | Direction | Purpose |
|---------|-----------|---------|
| `deployment_remove` | Frontend → Rust | Remove deployment record from Library skill |
| `deployment_remove` params | — | `{ skillId: string, deploymentId: string }` |
| `deployment_remove` returns | — | `IpcResult<LibrarySkill>` (updated skill) |

**Rust Implementation:**

```rust
#[tauri::command]
async fn deployment_remove(
    skill_id: String,
    deployment_id: String,
    state: State<'_, AppState>,
) -> IpcResult<LibrarySkill> {
    // 1. Find skill in library
    let skill = state.library.find_skill(&skill_id)?;

    // 2. Remove deployment record
    skill.deployments.retain(|d| d.id != deployment_id);

    // 3. Persist updated library
    state.library.save().await?;

    // 4. Return updated skill
    IpcResult::success(skill)
}
```

**Acceptance Criteria:**
- Deleting from Global/Project removes corresponding Deployment record from Library
- Library skill badge updates immediately after delete
- If skill was deployed multiple times, only the specific deployment is removed
- Deployment record is removed even if target folder no longer exists
- Operation is atomic (both file delete and record update succeed or both fail)

#### FR-3.10: Cancel Deployment Rollback Behavior

**Rollback Strategy:**

| Strategy | Description | Default |
|----------|-------------|---------|
| **Preserve Completed** | Keep already-deployed skills, only skip remaining | Yes |
| **Undo All** | Remove all deployments made during this batch operation | Optional |

**Cancel Behavior Flow:**

```
User clicks Cancel on batch deploy:
│
├─ 1. Stop processing queue
│     └─ Mark remaining items as 'cancelled'
│
├─ 2. Keep completed deployments
│     └─ Already-deployed skills remain in target scope
│
├─ 3. Show Result Summary
│     └─ Success: X skills deployed
│     └─ Cancelled: Y skills skipped
│     └─ [Undo All Deployments] button (optional)
│
└─ 4. (Optional) User clicks "Undo All"
      └─ Call deployment_remove for each completed deployment
      └─ Update Library state
      └─ Show "All deployments undone" confirmation
```

**Cancel Result Summary UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  Deployment Cancelled                                        │
│                                                             │
│  ✓ 3 skills deployed successfully                           │
│  ⊘ 2 skills cancelled                                       │
│                                                             │
│  Deployed to:                                               │
│  • Global Scope                                             │
│  • Project: my-web-app                                      │
│  • Project: api-server                                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  [Undo All Deployments]  [Done]                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Undo All Implementation:**

```typescript
async function undoAllDeployments(completedDeployments: Deployment[]) {
  const results = { success: 0, failed: 0 };

  for (const deployment of completedDeployments) {
    try {
      // Remove deployed skill files
      await invoke('skill_delete', {
        scope: deployment.targetScope,
        path: deployment.targetPath
      });

      // Remove deployment record from Library
      await invoke('deployment_remove', {
        skillId: deployment.skillId,
        deploymentId: deployment.id
      });

      results.success++;
    } catch {
      results.failed++;
    }
  }

  return results;
}
```

**Acceptance Criteria:**
- Cancel immediately stops processing (within 100ms)
- Completed deployments are preserved by default (safe behavior)
- Result summary shows clear counts of success/cancelled
- "Undo All" button is optional, shown only if there are completed deployments
- Clicking "Undo All" removes all deployments from this batch operation
- Undo operation shows its own progress indicator if > 1 skill
- Partial undo failures are reported with retry option
- User can close summary dialog without undoing (deployments remain)

### FR-4: Global Skills View (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-4.1 | List Global skills | Display all skills in `~/.claude/skills/` |
| FR-4.2 | View Global skill details | Show SKILL.md content with rich preview (see FR-10) |
| FR-4.3 | Delete from Global | Remove skill from `~/.claude/skills/` |
| FR-4.4 | Pull to Library | Import Global skill to App Library |
| FR-4.5 | Real-time monitoring | Detect changes when skills added/removed externally |

### FR-5: Project Skills View (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-5.1 | Add project to watch list | Browse and select project directory |
| FR-5.2 | List watched projects | Show all added projects in sidebar |
| FR-5.3 | View project skills | Display skills in `<project>/.claude/skills/` |
| FR-5.4 | View skill details | Show SKILL.md content with rich preview (see FR-10) |
| FR-5.5 | Delete from project | Remove skill from project scope |
| FR-5.6 | Pull to Library | Import project skill to App Library |
| FR-5.7 | Remove project from list | Stop watching a project (doesn't delete skills) |
| FR-5.8 | Project status indicator | Show if project exists/missing |
| FR-5.9 | Auto-refresh on page open | When user navigates to Project Skills view, automatically scan and update skill list |
| FR-5.10 | Periodic background refresh | Scan watched projects every 5 minutes (configurable in Settings) for skill changes |
| FR-5.11 | Refresh indicator | Show subtle loading indicator when refresh is in progress |
| FR-5.12 | Manual refresh | Allow user to manually trigger refresh for specific project or all projects |

### FR-6: Unified Search (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-6.1 | Search scope selector | Filter by: App Library / Global / Specific Project / All. Uses `project_list` IPC command to populate "Specific Project" dropdown menu. |
| FR-6.2 | Search by name | Match skill name, real-time filtering with 300ms debounce for performance optimization. Query sent after user stops typing. |
| FR-6.3 | Search by description | Match content in SKILL.md. Returns `SearchResult` (see Section 10.7) with `matchedSnippet` showing context around match and `highlightRanges` for character-level highlighting. |
| FR-6.4 | Search by category | Filter by category in App Library. Uses `library_categories_list` IPC command. Dropdown shows all categories plus "All Categories" option; selected category filters search scope. |
| FR-6.5 | Search results grouping | Group results by scope using `GroupedSearchResults` (see Section 10.7). Library results in "App Library" group, Global results in "Global Skills" group, Project results grouped by `projectName`. Empty groups hidden or show "No results" message. |
| FR-6.6 | Quick actions from search | Deploy/delete directly from search results |

#### FR-6.3: SearchResult Rendering Specification

**Data Model Reference:** `SearchResult` interface defined in Section 10.7

| Field | Type | Purpose |
|-------|------|---------|
| `skill` | `LibrarySkill \| InstalledSkill` | The matched skill entity |
| `matchedSnippet` | `string` | Context window around matched text (±50 characters) |
| `highlightRanges` | `[number, number][]` | Character ranges to apply highlight styling |
| `scope` | `'library' \| 'global' \| 'project'` | Where the skill resides |
| `matchType` | `'name' \| 'description' \| 'content'` | What field matched |

**Rendering Rules:**
- Display `matchedSnippet` with characters at `highlightRanges` emphasized (bold + accent color)
- Show skill name as primary text, snippet as secondary context
- Include scope badge (Library/Global/Project name)
- Click navigates to skill detail view

#### FR-6.4: Category Filter UI Specification

**IPC Command:** `library_categories_list` (defined in Section 9.3)

**UI Structure:**
```
┌─────────────────────────────────────┐
│ Category Filter          [▼]        │
├─────────────────────────────────────┤
│ ○ All Categories                    │
│ ○ Development                       │
│ ○ Productivity                      │
│ ○ Custom Category A                 │
│ ...                                 │
└─────────────────────────────────────┘
```

**Behavior:**
- Default selection: "All Categories" (no filter applied)
- Selecting a category filters search to skills in that category
- Only applies to App Library scope
- Category list fetched via `library_categories_list` on search panel open

#### FR-6.5: GroupedSearchResults Rendering Specification

**Data Model Reference:** `GroupedSearchResults` interface defined in Section 10.7

**Group Display Rules:**

| Group | Condition | Display |
|-------|-----------|---------|
| Library Results | `library.length > 0` | Show under "App Library" header with iCloud icon |
| Global Results | `global.length > 0` | Show under "Global Skills" header with globe icon |
| Project Results | `projects.size > 0` | Each project as sub-group with project name header |
| Empty Group | `length === 0` | Hide group entirely OR show "No results in [scope]" |

**UI Structure:**
```
┌─────────────────────────────────────────────────────────┐
│ Search Results (12 total, 45ms)                         │
├─────────────────────────────────────────────────────────┤
│ 📦 App Library (5)                                      │
│   ├─ skill-a  [matched snippet with highlights]        │
│   ├─ skill-b  [matched snippet with highlights]        │
│   └─ ...                                               │
├─────────────────────────────────────────────────────────┤
│ 🌐 Global Skills (3)                                    │
│   ├─ skill-c  [matched snippet with highlights]        │
│   └─ ...                                               │
├─────────────────────────────────────────────────────────┤
│ 📁 Project A (2)                                        │
│   ├─ skill-d  [matched snippet with highlights]        │
│   └─ skill-e  [matched snippet with highlights]        │
├─────────────────────────────────────────────────────────┤
│ 📁 Project B (2)                                        │
│   └─ ...                                               │
└─────────────────────────────────────────────────────────┘
```

**Group Toggle:**
- Each group header is collapsible
- Collapse state persisted in user preferences
- Expanded by default for groups with results

#### FR-6.1: Project Scope Selector Specification

**IPC Command:** `project_list` (defined in Section 9.3)

**"Specific Project" Dropdown:**
```
┌─────────────────────────────────────┐
│ Search Scope                        │
│ ○ All Scopes                        │
│ ○ App Library                       │
│ ○ Global Skills                     │
│ ○ Specific Project: [Project A ▼]   │
│   ├─ Project A                      │
│   ├─ Project B                      │
│   └─ Project C                      │
└─────────────────────────────────────┘
```

**Behavior:**
- Project list fetched via `project_list` when search panel opens
- Selecting a project filters search to that project's skills only
- Project status indicator (exists/missing) shown in dropdown

#### FR-6.2: Debounce Strategy

**Performance Optimization:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Debounce delay | 300ms | Balance between responsiveness and reducing IPC calls |
| Minimum query length | 2 characters | Avoid searching on single character |
| Cache TTL | 60 seconds | Reuse results for repeated queries |

**Debounce Implementation:**
```typescript
const debouncedSearch = debounce((query: string) => {
  if (query.length < 2) return;
  invoke('search', { query, scope: currentScope });
}, 300);
```

**Performance Notes:**
- Queries shorter than 2 characters show "Type at least 2 characters" hint
- Cached results keyed by `query + scope + category` composite key
- Loading state shown after 150ms if results not yet returned

### FR-7: iCloud Sync (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-7.1 | iCloud container setup | App Library stored in iCloud Documents container |
| FR-7.2 | Automatic sync | Sync initiates within 30s of change in App Library |
| FR-7.3 | Conflict resolution | User choice respected when conflicts occur |
| FR-7.4 | Offline fallback | Local cache when iCloud unavailable |
| FR-7.5 | Sync status indicator | Real-time sync progress displayed |
| FR-7.6 | Scope clarity | Only App Library syncs; Global/Project skills are NOT synced |

### FR-8: Localization (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-8.1 | English UI (default) | All UI text in English by default |
| FR-8.2 | Chinese UI | Full Simplified Chinese translation available |
| FR-8.3 | System language detection | Auto-select language based on macOS system locale on first launch |
| FR-8.4 | Language toggle | User can switch language in Settings, preference persisted |
| FR-8.5 | Instant language switch | UI updates immediately without app restart |
| FR-8.6 | Locale-aware formatting | Dates, numbers formatted according to selected locale |

### FR-9: Theme Support (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-9.1 | Light mode | Full light theme with proper contrast ratios |
| FR-9.2 | Dark mode | Full dark theme with proper contrast ratios |
| FR-9.3 | System preference detection | Auto-follow macOS appearance setting on first launch |
| FR-9.4 | Manual theme toggle | User can override system preference in Settings |
| FR-9.5 | Theme persistence | User's theme preference saved across sessions |
| FR-9.6 | Instant theme switch | Theme updates immediately without app restart |
| FR-9.7 | Glassmorphism adaptation | Glass effects adjust opacity/blur for light/dark contexts |

### FR-10: Skill Content Preview (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-10.1 | Markdown rendering | Render SKILL.md as formatted rich text (not raw markdown) |
| FR-10.2 | Code syntax highlighting | Code blocks highlighted with language-specific colors (180+ languages) |
| FR-10.3 | Frontmatter display | Parse YAML frontmatter, display as structured metadata card |
| FR-10.4 | GFM support | Support GitHub Flavored Markdown (tables, task lists, strikethrough) |
| FR-10.5 | Table of contents | Auto-generate clickable TOC for long documents (> 500 lines) |
| FR-10.6 | View mode toggle | Switch between Preview mode and Raw markdown view |
| FR-10.7 | Resource file preview | Preview other files in skill folder (templates, prompts, configs) |
| FR-10.8 | File type detection | Auto-detect file type and apply appropriate preview (md, json, yaml, code) |
| FR-10.9 | Copy code button | One-click copy for code blocks |
| FR-10.10 | Preview performance | Render preview in < 200ms for typical SKILL.md (≤ 50KB) |

#### FR-10.5: Table of Contents (Detailed)

**Data Structure Reference:** See Section 10.8 for `TableOfContents` and `HeadingNode` interface definitions.

**TOC Generation Trigger:**
- Condition: Document line count > 500 lines
- Generation: Parse markdown headings (h1-h6) on initial load
- Caching: Cache TOC in skill metadata for subsequent loads

**TOC Rendering Specification:**

| Aspect | Specification |
|--------|---------------|
| Position | Sidebar panel (collapsible) |
| Navigation | Click heading to scroll to position |
| Active Tracking | Current heading highlighted via `activeId` (based on scroll position) |
| Hierarchy | Indentation based on heading level (h1-h6) |
| Animation | Smooth scroll to target heading |

**Line Count Detection:**

| Method | Use Case | Performance |
|--------|----------|-------------|
| Stream Parse | Initial load | O(n) single pass, extracts headings while counting |
| Cached Count | Subsequent loads | O(1) read from skill metadata |
| Incremental | Edit mode | Re-count only changed sections |

#### FR-10.7: Resource File Preview (Detailed)

**IPC Command Reference:** `skill_file_read` (defined in Section 9.3)

**Resource File Preview Flow:**

```
User clicks resource file
    ↓
Frontend calls skill_file_read IPC
    ↓
Rust reads file content from skill folder
    ↓
Return FileContent with detected FileType
    ↓
Frontend selects appropriate preview component
    ↓
Render preview with syntax highlighting/raw display
```

**Error Handling:**

| Error Type | Code | User Message | Recovery |
|------------|------|--------------|----------|
| File not found | E001 | "File does not exist in skill folder" | Refresh skill list |
| File too large | E203 | "File exceeds preview size limit (1MB)" | Download to view externally |
| Permission denied | E002 | "Cannot read file due to permissions" | Check file permissions |
| Binary file | — | Show file info only, no preview | Download to view externally |

#### FR-10.8: FileType Preview Mapping (Detailed)

**FileType Enum Reference:** Defined in Section 10.8

**Preview Component Mapping:**

| FileType | Preview Component | Features | Notes |
|----------|-------------------|----------|-------|
| skill-md | MarkdownPreview | Full markdown rendering, TOC, frontmatter | Primary preview for SKILL.md |
| template | CodePreview | Syntax highlighting, line numbers | Template files (.tmpl, .hbs, .mustache) |
| prompt | MarkdownPreview | Markdown rendering | Prompt templates are often markdown |
| config | CodePreview | JSON/YAML syntax highlighting | Configuration files |
| asset | RawPreview | Raw text with line wrap | Text-based assets |
| image | ImagePreview | Image display, zoom controls | PNG, JPG, SVG, GIF |
| code | CodePreview | Multi-language syntax highlighting | JS, TS, Python, Rust, etc. |
| other | RawPreview | Raw text display, line numbers | Fallback for unknown types |

**File Type Detection Logic:**

```
Detection Priority:
1. Known extension mapping (.md → skill-md, .json/.yaml → config, etc.)
2. Content analysis (first 512 bytes)
   - Check for markdown patterns (#, *, -, backticks)
   - Check for JSON/YAML structure
   - Check for image magic bytes (PNG: 89 50 4E 47, JPG: FF D8 FF)
3. Fallback to 'other' type

Extension Mappings:
- skill-md: SKILL.md (exact match)
- template: .tmpl, .hbs, .mustache, .ejs, .pug
- prompt: .prompt.md, prompts/*.md
- config: .json, .yaml, .yml, .toml, .ini
- image: .png, .jpg, .jpeg, .gif, .svg, .webp
- code: .js, .ts, .jsx, .tsx, .py, .rs, .go, .java, etc.
```

### FR-11: Auto-Update (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-11.1 | Check for updates on launch | Query GitHub Releases API silently, compare version with current |
| FR-11.2 | Update notification | Show notification badge when update available, include release notes |
| FR-11.3 | User consent dialog | Prompt user before downloading: "Update to vX.X.X?" with release notes |
| FR-11.4 | Background download with progress | Download update in background, stream progress via IPC event |
| FR-11.5 | Install and restart | Install update on user confirmation, restart app automatically |
| FR-11.6 | Skip update option | User can skip this version, won't be prompted again until next version |
| FR-11.7 | Auto-update toggle | User can disable auto-update check in Settings |
| FR-11.8 | Update check interval | Check at most once per 24 hours, cache last check timestamp |
| FR-11.9 | Offline handling | Skip update check if offline, retry on next launch |
| FR-11.10 | Rollback support | Keep previous version backup, allow rollback if update fails |

#### FR-11.4: Download Progress Stream (Detailed)

**IPC Event Reference:** `update_progress_event` (defined in Section 9.3)

**Progress Event Structure:**

```typescript
interface UpdateProgressEvent {
  progress: number;        // 0-100 percentage
  status: 'downloading' | 'verifying' | 'installing' | 'complete' | 'error';
  downloadedBytes: number;
  totalBytes: number;
  downloadSpeed?: number;  // Bytes per second
  estimatedTimeRemaining?: number;  // Seconds
  errorMessage?: string;   // If status is 'error'
}
```

**Frontend Listening Specification:**

```typescript
import { listen } from '@tauri-apps/api/event';

// Subscribe to progress events
const unlisten = await listen<UpdateProgressEvent>('update_progress_event', (event) => {
  const { progress, status, downloadedBytes, totalBytes } = event.payload;

  // Update progress bar UI
  updateProgressBar(progress);

  // Display download speed
  if (event.payload.downloadSpeed) {
    const speedMB = (event.payload.downloadSpeed / 1024 / 1024).toFixed(2);
    setDownloadSpeed(`${speedMB} MB/s`);
  }

  // Handle status changes
  switch (status) {
    case 'verifying':
      setStatusMessage(i18n.t('update.verifying'));
      break;
    case 'complete':
      showInstallPrompt();
      break;
    case 'error':
      showError(event.payload.errorMessage);
      break;
  }
});

// Cleanup on component unmount
useEffect(() => {
  return () => { unlisten(); };
}, []);
```

**Progress UI Requirements:**
- Progress bar: 0-100% with smooth animation
- Status text: Localized status message (downloading/verifying/installing)
- Download speed: Display MB/s when available
- ETA: Show estimated time remaining when available
- Cancel button: Allow user to cancel download mid-progress

#### FR-11.5: Restart Mechanism (Detailed)

**Tauri Restart Methods:**

```rust
use tauri::Manager;

// Method 1: App restart (recommended)
#[tauri::command]
async fn restart_app(app: tauri::AppHandle) -> Result<(), AppError> {
    app.restart();
    Ok(())
}

// Method 2: Process relaunch (alternative)
use tauri::process::restart;

#[tauri::command]
async fn relaunch_app() -> Result<(), AppError> {
    restart();
    Ok(())
}
```

**Installation Flow:**

```
1. Verify Download Completeness
   ├── Calculate SHA256 checksum of downloaded file
   ├── Compare with checksum from GitHub Release
   └── Reject if mismatch, trigger re-download

2. Backup Current Version
   ├── Source: /Applications/Claude Code Skills Manager.app
   ├── Destination: /tmp/CSM-backup-{current-version}/
   └── Preserve all files including resources

3. Replace App Bundle
   ├── Unmount running app (macOS requirement)
   ├── Copy new .app bundle to /Applications/
   └── Preserve user data (iCloud container untouched)

4. Restart Application
   ├── Call app.restart() or tauri.process.relaunch()
   └── User sees updated app within 2 seconds
```

**Failure Handling & Rollback:**

| Failure Stage | Action |
|---------------|--------|
| Checksum verification failed | Delete download, retry from step 1, max 3 retries |
| Backup creation failed | Abort install, show error, keep current version |
| Bundle replacement failed | Restore from backup, show error, keep current version |
| Restart failed | Manual restart prompt, rollback on next launch |

**Installation Code Example:**

```rust
#[tauri::command]
async fn update_install(app: tauri::AppHandle) -> IpcResult<()> {
    // Step 1: Verify checksum
    let downloaded_path = get_download_path()?;
    let expected_checksum = get_release_checksum()?;
    let actual_checksum = calculate_sha256(&downloaded_path)?;

    if actual_checksum != expected_checksum {
        return IpcResult::error(AppError::Validation {
            code: "E201".to_string(),
            message: "Download checksum mismatch".to_string(),
            field: Some("checksum".to_string()),
            value: Some(actual_checksum),
        });
    }

    // Step 2: Backup current version
    let current_version = app.config().version.clone();
    let backup_path = PathBuf::from(format!("/tmp/CSM-backup-{}/", current_version));
    backup_app_bundle(&backup_path)?;

    // Step 3: Replace app bundle
    replace_app_bundle(&downloaded_path)?;

    // Step 4: Restart
    app.restart();

    IpcResult::success(())
}
```

#### FR-11.9: Network Status Detection (Detailed)

**Network Detection Method:**

```rust
use reqwest::Client;

#[tauri::command]
async fn check_network_available() -> IpcResult<bool> {
    let client = Client::builder()
        .timeout(Duration::from_secs(5))
        .build()?;

    // Try GitHub API endpoint
    match client.get("https://api.github.com").send().await {
        Ok(response) => IpcResult::success(response.status().is_success()),
        Err(_) => IpcResult::success(false),
    }
}
```

**Offline Handling Flow:**

```
App Launch
    │
    ├── Check if lastUpdateCheck < 24 hours ago
    │   └── YES → Skip update check
    │
    ├── Check network availability (HTTP request)
    │   ├── Request fails (timeout/connection error)
    │   │   ├── Log network status: offline
    │   │   ├── Skip update check silently
    │   │   ├── Record lastUpdateCheck = now()
    │   │   └── Continue with cached version
    │   │
    │   └── Request succeeds
    │       ├── Log network status: online
    │       ├── Proceed with update check
    │       └── Record lastUpdateCheck = now()
    │
    └── Next launch → Retry update check
```

**Retry Logic:**

| Scenario | Behavior |
|----------|----------|
| First offline launch | Skip silently, record timestamp |
| Consecutive offline launches | Skip silently, no repeated logging |
| Back online after offline | Resume normal update check |
| Network timeout during download | Pause download, resume on reconnect or restart |

**Network Status Storage:**

```typescript
interface UpdateCheckState {
  lastUpdateCheck: Date | null;      // Last check timestamp
  lastNetworkStatus: 'online' | 'offline' | 'unknown';
  pendingUpdate: {                   // If download interrupted
    version: string;
    downloadedBytes: number;
    totalBytes: number;
  } | null;
}
```

#### FR-11.10: Rollback Strategy (Detailed)

**IPC Command Reference:** `update_rollback` (defined in Section 9.3)

**Backup Strategy:**

| Aspect | Specification |
|--------|---------------|
| Backup Path | `/tmp/CSM-backup-{current-version}/` |
| Backup Content | Entire app bundle (.app directory) |
| Backup Timing | Before each update installation |
| Cleanup Timing | 24 hours after successful app startup |
| Max Backups | 1 (previous version only) |

**Backup Creation Code:**

```rust
fn create_backup(current_version: &str) -> Result<PathBuf, AppError> {
    let backup_path = PathBuf::from(format!("/tmp/CSM-backup-{}/", current_version));
    let app_path = PathBuf::from("/Applications/Claude Code Skills Manager.app");

    // Remove old backup if exists
    if backup_path.exists() {
        fs::remove_dir_all(&backup_path)?;
    }

    // Create new backup
    fs::create_dir_all(&backup_path)?;
    fs::copy(&app_path, &backup_path.join("Claude Code Skills Manager.app"))?;

    // Set cleanup timer (24 hours)
    schedule_backup_cleanup(&backup_path, Duration::from_secs(24 * 60 * 60));

    Ok(backup_path)
}
```

**Rollback Trigger Conditions:**

| Trigger | Detection Method | Action |
|---------|------------------|--------|
| Installation failure | Error during replace_app_bundle | Automatic rollback |
| Startup crash | Crash loop detection (3 crashes in 5 min) | Prompt user on 4th launch |
| User manual trigger | Settings → "Rollback to previous version" | User-initiated rollback |

**Crash Detection Logic:**

```rust
struct CrashTracker {
    crash_timestamps: Vec<DateTime<Utc>>,
    max_crashes: usize,
    window_seconds: i64,
}

impl CrashTracker {
    fn record_crash(&mut self) {
        let now = Utc::now();
        self.crash_timestamps.push(now);

        // Keep only crashes within the time window
        let cutoff = now - chrono::Duration::seconds(self.window_seconds);
        self.crash_timestamps.retain(|t| t > &cutoff);
    }

    fn should_prompt_rollback(&self) -> bool {
        self.crash_timestamps.len() >= self.max_crashes
    }
}

// Configuration
const MAX_CRASHES: usize = 3;
const CRASH_WINDOW_SECONDS: i64 = 300; // 5 minutes
```

**Rollback Flow:**

```
Rollback Triggered (automatic or manual)
    │
    ├── Check backup exists at /tmp/CSM-backup-{version}/
    │   ├── NOT found → Show error: "No backup available"
    │   └── Found → Continue
    │
    ├── Restore backup
    │   ├── Unmount current (possibly broken) app
    │   ├── Copy backup to /Applications/
    │   └── Verify restoration completed
    │
    ├── Restart application
    │   ├── Call app.restart()
    │   └── User sees previous version
    │
    └── Show rollback notification
        ├── "Restored to version X.X.X"
        └── "The update was rolled back due to [reason]"
```

**Rollback IPC Implementation:**

```rust
#[tauri::command]
async fn update_rollback(app: tauri::AppHandle) -> IpcResult<()> {
    // Find backup
    let backup_dir = find_latest_backup()?;

    if !backup_dir.exists() {
        return IpcResult::error(AppError::FileSystem {
            code: "E001".to_string(),
            message: "No backup found to rollback".to_string(),
            path: Some("/tmp/CSM-backup-*".to_string()),
            source: None,
        });
    }

    // Restore backup
    let backup_app = backup_dir.join("Claude Code Skills Manager.app");
    let target_path = PathBuf::from("/Applications/Claude Code Skills Manager.app");

    fs::remove_dir_all(&target_path)?;
    fs::copy(&backup_app, &target_path)?;

    // Restart
    app.restart();

    IpcResult::success(())
}
```

**Rollback Notification UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  Rollback: Update Rolled Back                               │
│                                                             │
│  The app has been restored to version X.X.X                 │
│                                                             │
│  Reason: [crash detected / installation failed / user]      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  What happened?                                      │   │
│  │  The update to X.X.X encountered issues and was      │   │
│  │  automatically rolled back. Your data is safe.       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌───────────────────────────────────┐   │
│  │   Dismiss   │  │  Report this issue on GitHub      │   │
│  └─────────────┘  └───────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-P1 | Cold start time | < 1 second | Time from launch to interactive |
| NFR-P2 | Skill list load (1000 items) | < 300ms | P95 latency |
| NFR-P3 | Search response time | < 3 seconds | P95 latency |
| NFR-P4 | Memory footprint (idle) | < 50MB | Activity Monitor measurement |
| NFR-P5 | Memory footprint (active) | < 150MB | With 1000 skills loaded |
| NFR-P6 | UI response time | < 100ms | Click to visual feedback |
| NFR-P7 | App bundle size | < 5MB | Installed app size (Tauri native) |

#### NFR-P2: Virtualization Strategy (Detailed)

**Virtualization Specification:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Library | react-window or react-virtualized | Industry-standard, minimal bundle overhead |
| Trigger condition | Skills > 100 items | Below threshold, native rendering is faster |
| Virtualization scope | Skill Card Grid | Main list view only |
| Overscan (buffer) | 5 items | Smooth scrolling without visible gaps |
| Estimated row height | 80px | Based on card design spec |

**Performance Verification Method:**

| Test Scenario | Measurement | Target |
|---------------|-------------|--------|
| 1000 skills loaded | First render time | < 300ms |
| 1000 skills scroll | Frame rate (FPS) | > 55fps sustained |
| 1000 skills search | Filter + render | < 500ms total |
| Rapid scroll (fast swipe) | No jank/tearing | 60fps target |

**Virtualization Implementation:**

```typescript
import { FixedSizeList as List } from 'react-window';

const SkillCardList = ({ skills }: { skills: LibrarySkill[] }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <SkillCard skill={skills[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={skills.length}
      itemSize={80}
      overscanCount={5}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### NFR-P3: Search Index Strategy (Detailed)

**Search Index Specification:**

| Index Setting | Value | Description |
|---------------|-------|-------------|
| Index type | In-memory inverted index | Fast lookups, minimal latency |
| Indexed content | skill name, description, SKILL.md content | Full-text search coverage |
| Update trigger | Library change, Project refresh | Incremental update on data change |
| Storage | Memory + localStorage cache | Persist for fast app restart |

**Index Structure:**

```typescript
interface SearchIndex {
  nameIndex: Map<string, Set<string>>;     // token → skillIds (name matches)
  contentIndex: Map<string, Set<string>>;  // token → skillIds (content matches)
  skillMetadata: Map<string, SkillMeta>;   // skillId → lightweight metadata
  lastUpdated: Date;                       // Timestamp for cache validation
}

interface SkillMeta {
  id: string;
  name: string;
  description: string;
  scope: 'library' | 'global' | 'project';
  projectId?: string;
}
```

**Index Rebuild Strategy:**

| Trigger | Action | Scope |
|---------|--------|-------|
| App startup | Check cache validity | If lastUpdated > 24h, full rebuild |
| Library change | Incremental update | Add/remove/update affected skills only |
| Project refresh | Update project section | Re-index project skills, keep library/global intact |
| Manual rebuild | Full rebuild | User-triggered via Settings |

**Cache Validation:**

```typescript
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldRebuildIndex(cachedIndex: SearchIndex | null): boolean {
  if (!cachedIndex) return true;
  const age = Date.now() - cachedIndex.lastUpdated.getTime();
  return age > CACHE_MAX_AGE_MS;
}
```

#### NFR-P4: Memory Management Strategy (Detailed)

**Idle State Memory Management:**

| Setting | Value | Description |
|---------|-------|-------------|
| Idle detection | 5 min no user interaction | Mouse/keyboard activity tracking |
| Cleanup trigger | Idle threshold reached | Automatic cleanup begins |

**Cleanup Actions:**

| Action | Description | Memory Impact |
|--------|-------------|---------------|
| Release SKILL.md content cache | Clear parsed markdown cache | ~10-30MB reduction |
| Clear search index (partial) | Keep nameIndex, clear contentIndex | ~5-10MB reduction |
| Unmount inactive views | Unload non-visible components | ~5-15MB reduction |
| Target idle memory | 50MB | Post-cleanup target |

**Recovery on User Interaction:**

```typescript
// On first user interaction after idle
function resumeFromIdle(): void {
  // Rebuild contentIndex from nameIndex + file scan
  rebuildContentIndex();
  // Remount active view
  remountCurrentView();
  // Resume SKILL.md caching for visible skills
  cacheVisibleSkillContent();
}
```

**Memory Threshold Adjustment:**

| Metric | Threshold | Context |
|--------|-----------|---------|
| NFR-M2 warningThreshold | 120MB | Active state monitoring |
| NFR-P4 idle target | 50MB | Post-cleanup target |
| Peak allowance | 150MB | Maximum during heavy operations |

**Rationale:** Idle cleanup reduces memory to 50MB, active use allows up to 120MB sustained before warning, peak operations may reach 150MB temporarily.

#### NFR-P5: Skill Data Virtualization (Detailed)

**Clarification:** "1000 skills loaded" refers to metadata only, not full content.

**Metadata Size Estimation:**

| Data | Size per Skill | Total (1000 skills) |
|------|----------------|---------------------|
| SkillMeta object | ~2KB | ~2MB |
| SearchIndex entry | ~100 bytes | ~100KB |
| Total metadata | ~2.1KB | ~2.1MB |

**SKILL.md Content Loading Strategy:**

| Strategy | Description |
|----------|-------------|
| No preloading | SKILL.md content loaded on-demand only |
| Cache limit | Max 10 parsed SKILL.md in memory at once |
| LRU eviction | Least-recently-used evicted when limit reached |
| Estimated size | ~5-10KB per SKILL.md (average) |

**Memory Budget:**

| Component | Memory |
|-----------|--------|
| Metadata (1000 skills) | 2MB |
| SKILL.md cache (10 items) | 100KB |
| SearchIndex | 100KB |
| React components | 50-80MB |
| Total active | < 150MB |

#### NFR-P6: React Performance Optimization (Detailed)

**Optimization Pattern Specification:**

| Pattern | Use Case | Example |
|---------|----------|---------|
| useMemo | Derived computations | Skill list filtering, search result ranking |
| useCallback | Event handlers passed to children | IPC command handlers, card click actions |
| React.memo | Component memoization | SkillCard, SkillDetail components |

**Implementation Examples:**

```typescript
// useMemo for skill filtering
const filteredSkills = useMemo(() => {
  return skills.filter(skill =>
    skill.name.toLowerCase().includes(query.toLowerCase())
  );
}, [skills, query]);

// useCallback for IPC handlers
const handleDeploy = useCallback(async (skillId: string, target: string) => {
  await invoke('deploy_to_project', { skillId, targetProject: target });
}, [skillId, target]);

// React.memo for SkillCard
const SkillCard = React.memo(({ skill }: { skill: LibrarySkill }) => {
  return <Card>...</Card>;
}, (prev, next) => prev.skill.id === next.skill.id);
```

**Main Thread Protection:**

| Operation Type | Threshold | Strategy |
|----------------|-----------|----------|
| Long operations | > 50ms | Move to Web Worker |
| Search index build | ~100-200ms for 1000 skills | Background thread |
| File parsing | > 50ms | Worker thread |

**Web Worker Implementation:**

```typescript
// src/workers/searchIndex.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { skills } = e.data;
  const index = buildSearchIndex(skills);
  self.postMessage({ index });
};

// Main thread usage
const buildIndexAsync = async (skills: SkillMeta[]) => {
  const worker = new Worker(new URL('./searchIndex.worker', import.meta.url));
  worker.postMessage({ skills });
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data.index);
  });
};
```

#### NFR-P7: Bundle Size Verification (Detailed)

**CI Check Specification:**

| Setting | Value | Description |
|---------|-------|-------------|
| Check trigger | Post-build (CI pipeline) | Automated size check |
| Threshold | 5MB | Maximum bundle size |
| Failure action | Build fails + notification | Alert developers |
| Measurement | Total bundle + assets | JS + CSS + images |

**CI Configuration Example:**

```yaml
# .github/workflows/build.yml
- name: Check bundle size
  run: |
    SIZE=$(du -sb dist/ | cut -f1)
    MAX=$((5 * 1024 * 1024))  # 5MB
    if [ $SIZE -gt $MAX ]; then
      echo "Bundle size ($SIZE bytes) exceeds threshold ($MAX bytes)"
      exit 1
    fi
```

**Optimization Strategies:**

| Strategy | Implementation | Impact |
|----------|----------------|--------|
| Tree-shaking | Phosphor Icons: import specific icons, not entire library | ~50KB reduction |
| Code splitting | Settings, Preview modules: React.lazy() | Load on-demand |
| Asset optimization | Images: compress, SVG preferred | Smaller assets |
| Dynamic imports | react-syntax-highlighter: load languages on-demand | ~20KB per language |

**Code Splitting Example:**

```typescript
// Lazy load Settings module
const Settings = React.lazy(() => import('./views/Settings'));

// Lazy load Preview module
const SkillPreview = React.lazy(() => import('./components/SkillPreview'));

// Usage with Suspense
<Suspense fallback={<SkeletonPreview />}>
  <SkillPreview skill={selectedSkill} />
</Suspense>
```

**Icon Tree-shaking:**

```typescript
// Bad: imports entire icon set
import { PhosphorIcons } from '@phosphor-icons/react';

// Good: import specific icons
import { Plus, Trash, Gear, MagnifyingGlass } from '@phosphor-icons/react';
```

### 8.2 Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-S1 | Skill content sanitization | Strip dangerous commands before display |
| NFR-S2 | IPC communication | Tauri capability-based permissions |
| NFR-S3 | Skill validation on import | SKILL.md format validation |
| NFR-S4 | iCloud data protection | NSFileProtectionComplete for sensitive files |

#### NFR-S1: Skill Content Sanitization (Detailed)

**Dangerous Commands Classification:**

| Category | Patterns | Risk Level |
|----------|----------|------------|
| **Shell Injection** | `rm -rf`, `sudo`, `chmod 777`, `eval()`, `exec()`, `| sh`, `&& rm` | Critical |
| **Script Injection** | `<script>`, `javascript:`, `data:text/html`, `onerror=`, `onload=` | High |
| **File System** | Absolute path writes outside sandbox, symlink attacks, `../` traversal | High |
| **Code Injection** | Backticks with interpolation, `${}` in shell context | Medium |

**Sanitization Libraries:**

| Layer | Library | Purpose |
|-------|---------|---------|
| Frontend | DOMPurify v3.x | HTML/XSS sanitization before rendering |
| Backend | Rust `sanitize` crate | Command pattern filtering, path validation |

**Sanitization Pipeline:**

```
SKILL.md Content → Rust sanitize crate → IPC → DOMPurify → React Render
```

**Acceptance Criteria:**
- All SKILL.md content passes through sanitizer before rendering
- No raw HTML rendered without sanitization
- Shell command patterns in code blocks are escaped, not executed
- File paths are validated against allowed directories

#### NFR-S2: IPC Capability Mapping (Detailed)

**Permission Requirements by Command Group:**

| Command Group | Commands | Required Capabilities |
|---------------|----------|----------------------|
| `library_*` | library_list, library_get, library_delete, library_import, library_export, library_organize | `fs:read`, `fs:write` (iCloud container) |
| `global_*` | global_list, global_get, global_delete, global_pull | `fs:read`, `fs:write` (`~/.claude/skills/`) |
| `project_*` | project_list, project_add, project_remove, project_skills, project_skill_*, project_refresh* | `fs:read`, `fs:write` (project directories) |
| `icloud_*` | icloud_sync_status, icloud_resolve_conflict | `fs:read`, `fs:write`, `network` (sync) |
| `update_*` | update_check, update_download, update_install, update_get_status | `network` (GitHub API), `shell:execute` (install) |
| `config_*` | config_get, config_set | `fs:read`, `fs:write` (app config) |
| `locale_*/theme_*` | locale_*, theme_* | `fs:read` (system detection), `fs:write` (preference) |

**Tauri Configuration Example:**

```json
{
  "permissions": [
    {
      "identifier": "fs:read",
      "allow": [
        { "path": "$APPCONFIG/**" },
        { "path": "$HOME/.claude/skills/**" },
        { "path": "$HOME/Library/Mobile Documents/com~apple~CloudDocs/**" }
      ]
    },
    {
      "identifier": "fs:write",
      "allow": [
        { "path": "$APPCONFIG/**" },
        { "path": "$HOME/.claude/skills/**" },
        { "path": "$HOME/Library/Mobile Documents/com~apple~CloudDocs/**" }
      ]
    },
    {
      "identifier": "network",
      "allow": [
        { "url": "https://api.github.com/repos/*/releases/*" }
      ]
    },
    {
      "identifier": "shell:execute",
      "allow": [
        { "name": "open", "args": ["-a", "Claude Code Skills Manager"] }
      ]
    }
  ]
}
```

**Acceptance Criteria:**
- Each IPC command has explicit capability definition
- No command can access paths outside allowed scope
- Network access limited to GitHub Releases API
- Shell execution limited to app self-restart

#### NFR-S4: iCloud Data Protection (Detailed)

**Sensitive Files Definition:**

| Category | Includes | Excludes |
|----------|----------|----------|
| **App Library Skills** | All skill content in iCloud container | — |
| **Skill Metadata** | SKILL.md frontmatter (name, version, description, author) | Body content (user-authored) |
| **User Configuration** | categories.json, groups.json, preferences.json | System config |
| **Deployment Records** | deployments.json (skill → target mappings) | — |
| **NOT Protected** | Global skills (`~/.claude/skills/`), Project skills | User has direct file access |

**NSFileProtectionComplete Implementation:**

```rust
use security_framework::file_key_metadata::{FileKeyMetadata, FileProtectionLevel};

fn set_protection_complete(path: &Path) -> Result<()> {
    let metadata = FileKeyMetadata::new()
        .with_protection_level(FileProtectionLevel::Complete);
    metadata.apply_to_path(path)?;
    Ok(())
}

// Applied to:
// - ~/Library/Mobile Documents/com~apple~CloudDocs/[App ID]/skills/**/*
// - ~/Library/Mobile Documents/com~apple~CloudDocs/[App ID]/config/*.json
```

**Protection Behavior:**
- Files are encrypted at rest
- Decryption keys only available when device is unlocked
- Files inaccessible when device is locked or after restart (until user unlocks)
- Backups to iCloud Drive include encryption (not readable without device key)

**Acceptance Criteria:**
- All App Library skill files have NSFileProtectionComplete attribute
- User config files have NSFileProtectionComplete attribute
- Global/Project skills NOT protected (user has direct access)
- Protection verified via `xattr -l <file>` showing `com.apple.metadata:kMDItemWhereFroms`

### 8.3 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A1 | Uptime (local app) | 99.9% (crash-free sessions) |
| NFR-A2 | Offline capability | Full local management without network |
| NFR-A3 | Error recovery | Automatic state restoration after crash |

#### NFR-A1: Crash Session Tracking

**Session Tracking Mechanism:**

| Event | Action | Data Recorded |
|-------|--------|---------------|
| App launch | Record session_start | timestamp, sessionId |
| App quit | Record session_end | timestamp, duration |
| App crash | Detect unclean session | Mark session as crashed |

**Crash-Free Rate Calculation:**

```
crash-free rate = (total sessions - crashed sessions) / total sessions * 100
Target: > 99.9% (SC-3)
```

**IPC Commands:**

| Command | Direction | Description |
|---------|-----------|-------------|
| `session_start()` | Frontend → Rust | Initialize new session, returns sessionId |
| `session_end(sessionId)` | Frontend → Rust | Mark session as cleanly ended |

**Session Storage:**

| Property | Value |
|----------|-------|
| Storage path | `~/Library/Application Support/CSM/sessions.json` |
| Format | `{ sessions: SessionRecord[], lastCrash: Date }` |
| Retention | Last 30 days of data |

**SessionRecord Interface:**

```typescript
interface SessionRecord {
  id: string;
  startTime: Date;
  endTime?: Date;        // undefined if crashed
  durationMs?: number;
  crashed: boolean;
  crashType?: 'panic' | 'freeze' | 'kill';
}
```

#### NFR-A3: State Recovery Mechanism

**IPC Commands Reference:**

| Command | Reference |
|---------|-----------|
| `state_snapshot` | Defined in Section 9.3 |
| `state_restore` | Defined in Section 9.3 |

**AppState Interface Reference:** Defined in Section 10.10

**State Snapshot Strategy:**

| Trigger | Description |
|---------|-------------|
| Auto-snapshot | Every 30 seconds |
| Post-operation | After import, deploy, delete |
| Pre-quit | Before app terminates |

| Property | Value |
|----------|-------|
| Storage path | `~/Library/Application Support/CSM/state.json` |
| Format | AppState JSON |

**State Recovery Flow:**

1. App launch → Detect if last session crashed
2. If crashed → Load last state snapshot
3. Show recovery dialog: "Restore previous session?"
4. User confirms → Apply state
5. User declines → Clear snapshot, normal startup

**Recovery UI Specification:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  App closed unexpectedly                                 │
│                                                             │
│  Restore your last session?                                 │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │    Restore      │  │   Start Fresh   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

**Post-Recovery Display:**

- Restore active view (last opened page)
- Restore selected skill/project
- Restore sidebar expanded sections
- Restore search state (query, scope)
- Highlight last action performed

**State Snapshot Content:**

| Field | Type | Description |
|-------|------|-------------|
| activeView | string | Current view identifier |
| selectedSkillId | string? | Selected skill UUID |
| selectedProjectId | string? | Selected project UUID |
| sidebarState | object | Expanded sections, selected category/group |
| searchState | object? | Query string, search scope |
| lastAction | string? | Last action identifier |

### 8.4 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U1 | Import completion rate | > 95% |
| NFR-U2 | First skill import time | < 2 minutes |
| NFR-U3 | Task success rate | > 85% |
| NFR-U4 | Error recovery rate | > 70% |
| NFR-U5 | NPS (30-day) | > 40 |

### 8.5 Loading States

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-L1 | Skeleton screens | Unified skeleton components for all data loading scenarios |
| NFR-L2 | Skill list loading | Show skeleton cards matching actual card layout |
| NFR-L3 | Skill detail loading | Show skeleton matching content structure (metadata + content blocks) |
| NFR-L4 | Sidebar loading | Show skeleton for navigation items |
| NFR-L5 | Search results loading | Show skeleton cards in results area |
| NFR-L6 | Skeleton animation | Subtle pulse animation (1.5s ease-in-out infinite) |
| NFR-L7 | Skeleton transition | Fade out skeleton when content ready, < 150ms transition |
| NFR-L8 | No loading spinners | Use skeleton screens instead of spinners for content areas |

#### NFR-L1: Skeleton Trigger Conditions

**Trigger Conditions Mapping:**

| IPC Command | Skeleton Type | Trigger |
|-------------|---------------|---------|
| library_list | SkillCardSkeleton | View mount / refresh |
| global_list | SkillCardSkeleton | View mount |
| project_skills | SkillCardSkeleton | Project selection |
| library_get | SkillDetailSkeleton | Skill selection |
| global_get | SkillDetailSkeleton | Skill selection |
| project_skill_get | SkillDetailSkeleton | Skill selection |
| search | SearchResultSkeleton | Search query submit |
| project_list | SidebarSkeleton | App launch |
| library_categories_list | SidebarSkeleton | App launch |

**Loading State Machine:**

```
States: idle → loading → success/error → transition

Loading:    显示骨架屏
Success:    淡出骨架屏，显示内容
Error:      淡出骨架屏，显示错误 UI
Transition: 150ms fade animation
```

**State Machine Transitions:**

| From | To | Trigger | Animation |
|------|-----|---------|-----------|
| idle | loading | IPC call initiated | None (instant) |
| loading | success | IPC returns data | 150ms fade out |
| loading | error | IPC returns error | 150ms fade out |
| success | loading | Refresh/reload | None (instant) |
| error | loading | Retry button clicked | None (instant) |

#### NFR-L4: Sidebar Loading Specification

**Sidebar Data Sources:**

| Sidebar Section | IPC Source | Display Data |
|-----------------|------------|--------------|
| App Library | library_list | Skill count |
| Categories | library_categories_list | Category list |
| Groups | library_categories_list | Nested groups |
| Global Skills | global_list | Skill count |
| Projects | project_list | Skill count, exists status |

**Sidebar Loading Flow:**

1. App launch → 显示 SidebarSkeleton
2. 并行调用: project_list, library_categories_list
3. 数据返回 → 渲染侧边栏
4. 过渡动画 → 骨架屏淡出

**Sidebar Skeleton Structure:**

```
┌─────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Library section (1 item)
│                             │
│  ░░░░░░░░                   │  ← Categories header
│  ░░░░░░░░░░░░░░             │  ← Category item 1
│  ░░░░░░░░░░░░░░             │  ← Category item 2
│  ░░░░░░░░░░░░░░             │  ← Category item 3
│                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Global section (1 item)
│                             │
│  ░░░░░░░░                   │  ← Projects header
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Project item 1
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← Project item 2
└─────────────────────────────┘
```

**Skeleton Item Counts:**

| Section | Skeleton Count | Notes |
|---------|----------------|-------|
| Library | 1 | Single "App Library" item |
| Categories | 3 | Placeholder category items |
| Global | 1 | Single "Global Skills" item |
| Projects | 2 | Placeholder project items |

#### NFR-L7: Content Ready Detection

**IPC Response → Content Ready Transition:**

| Step | Action | Duration |
|------|--------|----------|
| 1 | IPC returns data | - |
| 2 | Set loading = false | Immediate |
| 3 | Trigger transition animation | 150ms |
| 4 | Display actual content | After transition |

**Error State Handling:**

| Step | Action | Duration |
|------|--------|----------|
| 1 | IPC returns error | - |
| 2 | Set error state | Immediate |
| 3 | 骨架屏淡出 | 150ms |
| 4 | 显示 ErrorFallback | After transition |

**Loading State Interface:**

```typescript
interface LoadingState<T = unknown> {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: AppError;
  data?: T;
  transitionMs: 150;
}

interface LoadingActions {
  startLoading: () => void;
  setData: (data: T) => void;
  setError: (error: AppError) => void;
  retry: () => void;
}
```

**Zustand Store Integration:**

```typescript
interface SkillListState {
  skills: LoadingState<Skill[]>;
  fetchSkills: (scope: Scope) => Promise<void>;
  retryFetch: () => Promise<void>;
}
```

#### Loading Error Handling

**Error State Skeleton Behavior:**

| Phase | Behavior |
|-------|----------|
| IPC Pending | 保持骨架屏显示 |
| Error Detected | 触发骨架屏淡出 (150ms) |
| Error UI Ready | 显示 ErrorFallback |
| Retry Clicked | 重新进入 loading 状态 |

**Error UI Specifications:**

| State | Message | Actions |
|-------|---------|---------|
| Empty | "No skills found" | Import 按钮 |
| Error | 错误消息 | Retry 按钮 |
| Network | "Network unavailable" | Retry 按钮 |

**ErrorFallback Component:**

```typescript
interface ErrorFallbackProps {
  type: 'empty' | 'error' | 'network';
  message?: string;
  onRetry?: () => void;
  onImport?: () => void;
}
```

**ErrorFallback UI:**

```
┌─────────────────────────────────────────┐
│                                         │
│           {icon}                         │
│                                         │
│     {message / "No skills found"}       │
│                                         │
│     ┌─────────────┐ ┌─────────────┐    │
│     │   Retry     │ │   Import    │    │
│     └─────────────┘ └─────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

### 8.6 Operation Progress

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-O1 | Progress dialog | Modal dialog with progress bar for long-running operations |
| NFR-O2 | Progress details | Show current operation, current/total count, elapsed time |
| NFR-O3 | Batch import progress | Progress bar with "Importing skill X of Y" label |
| NFR-O4 | Batch deploy progress | Progress bar with "Deploying skill X of Y" label |
| NFR-O5 | Export progress | Progress bar with "Exporting skill X of Y" label |
| NFR-O6 | Cancel button | Allow canceling operation, rollback completed items |
| NFR-O7 | Operation result summary | Show success/warning/error counts after completion |
| NFR-O8 | Error details | Click error count to see detailed error list |
| NFR-O9 | Retry failed | Option to retry only failed operations |
| NFR-O10 | Progress animation | Smooth progress bar animation, no jank |

#### NFR-O6: Rollback Strategy Definition

**Rollback Strategy by Operation Type:**

| Operation Type | Rollback Action | Notes |
|----------------|-----------------|-------|
| Import | Delete imported skills from Library | Safe, reversible |
| Deploy | Remove deployed skills from target | Destructive, ask user |
| Export | Delete partial .zip files | Safe, no user data affected |

**Rollback Decision Flow:**

1. User clicks Cancel button
2. System shows confirmation dialog: "X items already processed. Keep them or undo?"
3. User selects: Keep / Undo All
4. System executes corresponding action
5. System displays result summary

**Rollback IPC Command:**

```typescript
// Cancel operation with optional rollback
operation_cancel(operationId: string, rollback: boolean): Promise<{
  cancelled: boolean;
  processedCount: number;
  rolledBack: boolean;
}>
```

#### NFR-O8: Error Details Data Model

**OperationError Interface:**

```typescript
interface OperationError {
  id: string;
  operationId: string;
  operationType: 'import' | 'deploy' | 'export';
  skillName: string;
  skillPath: string;
  errorCode: string;          // e.g., 'E001'
  errorMessage: string;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}
```

**Error Storage Mechanism:**

| Property | Value |
|----------|-------|
| Storage Location | Memory (operation state) |
| Lifecycle | Cleared after operation completes |
| Export Option | Can export as JSON |

**Error Details UI:**

- Click error count → Expand error list
- Each item shows: skillName, errorCode, errorMessage
- Actions: Single item Retry button

#### NFR-O9: Retry Mechanism Definition

**Retry Strategy Table:**

| Operation | Retry Action | Max Retries | Backoff |
|-----------|--------------|-------------|---------|
| Import | Re-import failed skill | 3 | None |
| Deploy | Re-deploy failed skill | 3 | None |
| Export | Re-export failed skill | 3 | None |
| Network ops | Retry with exponential backoff | 5 | 1s, 2s, 4s, 8s, 16s |

**Retry Flow:**

1. User clicks "Retry Failed"
2. System identifies recoverable errors
3. System retries each failed item
4. System updates result summary
5. Loop until success or max retries reached

**Retry IPC Command:**

```typescript
// Retry failed operations
operation_retry(operationId: string, errorIds?: string[]): Promise<{
  retriedCount: number;
  successCount: number;
  stillFailed: OperationError[];
}>
```

**Retry UI:**

- "Retry Failed" button (only for recoverable errors)
- Options: "Retry All" vs "Retry Selected"
- Retry progress display

### 8.7 Error Handling

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-E1 | Global error boundary | React error boundary catches unhandled errors, shows fallback UI |
| NFR-E2 | Error logging | All errors logged to local file with timestamp, context, stack trace |
| NFR-E3 | User-friendly error messages | Technical errors translated to actionable user messages |
| NFR-E4 | Error recovery options | Offer retry/ignore/abort options for recoverable errors |
| NFR-E5 | Graceful degradation | App remains functional when non-critical features fail |
| NFR-E6 | IPC error handling | All Rust→Frontend calls return Result type with error details |
| NFR-E7 | File operation errors | Handle permission denied, disk full, file not found with specific messages |
| NFR-E8 | iCloud sync errors | Detect and report iCloud quota exceeded, network unavailable, conflict |

#### NFR-E1: ErrorBoundary UI Specification

**Component Path:** `src/components/ErrorBoundary.tsx`

**Fallback UI Structure:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Something went wrong                                    │
│                                                             │
│  {error.description}                                        │
│                                                             │
│  Error Code: {error.code}                                   │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Reload Page │  │  Go Home    │  │  Report Issue     │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**UI Elements:**

| Element | Type | Description |
|---------|------|-------------|
| Title | Text | "Something went wrong" (localized) |
| Description | Text | Brief, user-friendly error description |
| Error Code | Badge | Formatted error code (e.g., E101) |
| Reload Page | Button | Refreshes the page, retries last action |
| Go Home | Button | Navigates to App Library view |
| Report Issue | Button | Opens GitHub issue template with error details |

**ErrorBoundary Props:**

```typescript
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: AppError; reset: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface AppError {
  code: string;           // e.g., "E101"
  message: string;        // User-friendly message
  technical: string;      // Technical details for debugging
  timestamp: Date;
  recoverable: boolean;
  context?: Record<string, unknown>;
}
```

#### NFR-E2: Error Logging Specification

**Log Path:** `~/Library/Logs/CSM/errors.log`

**Log Format:** JSON Lines (one JSON object per line)

**Log Entry Schema:**

```json
{
  "timestamp": "2026-04-26T10:30:45.123Z",
  "level": "error",
  "code": "E101",
  "message": "Failed to connect to iCloud",
  "context": {
    "operation": "library_sync",
    "scope": "library",
    "skillId": "abc-123"
  },
  "stackTrace": "Error: Failed to connect...\n    at iCloudBridge.sync..."
}
```

**Log Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | ISO 8601 string | Yes | UTC timestamp of error occurrence |
| level | string | Yes | Log level: `error`, `warn`, `info` |
| code | string | Yes | Error code (e.g., E101) |
| message | string | Yes | Human-readable error message |
| context | object | No | Additional context (operation, scope, IDs) |
| stackTrace | string | No | Stack trace for debugging |

**Log Rotation:**

| Setting | Value |
|---------|-------|
| Max file size | 10 MB per file |
| Max files | 5 files retained |
| Rotation naming | `errors.log`, `errors.log.1`, `errors.log.2`, ... |
| Compression | Not compressed (for debugging accessibility) |

#### NFR-E3: Error Code Classification

**Error Code Ranges:**

| Range | Category | Description |
|-------|----------|-------------|
| E001-E099 | File System | Disk I/O, file access, permission errors |
| E100-E199 | Network | Connection, timeout, API errors |
| E200-E299 | Validation | Format, schema, constraint violations |
| E300-E399 | IPC | Inter-process communication errors |
| E400-E499 | iCloud | Sync, quota, conflict errors |

**Error Code Examples:**

| Code | Name | Message (EN) | Message (ZH) | Severity |
|------|------|--------------|--------------|----------|
| E001 | FILE_NOT_FOUND | File not found | 文件未找到 | Error |
| E002 | FILE_PERMISSION_DENIED | Permission denied | 权限被拒绝 | Error |
| E003 | FILE_DISK_FULL | Disk is full | 磁盘已满 | Error |
| E004 | FILE_LOCKED | File is locked by another process | 文件被其他进程锁定 | Warn |
| E005 | FILE_READ_ERROR | Failed to read file | 读取文件失败 | Error |
| E006 | FILE_WRITE_ERROR | Failed to write file | 写入文件失败 | Error |
| E101 | NETWORK_TIMEOUT | Connection timed out | 连接超时 | Warn |
| E102 | NETWORK_UNAVAILABLE | No internet connection | 无网络连接 | Warn |
| E103 | NETWORK_DNS_ERROR | DNS resolution failed | DNS 解析失败 | Error |
| E104 | NETWORK_SSL_ERROR | SSL certificate error | SSL 证书错误 | Error |
| E201 | VALIDATION_INVALID_SKILL | Invalid skill format | 技能格式无效 | Error |
| E202 | VALIDATION_MISSING_SKILL_MD | SKILL.md not found | 未找到 SKILL.md | Error |
| E203 | VALIDATION_SIZE_EXCEEDED | Skill size exceeds limit | 技能大小超出限制 | Warn |
| E204 | VALIDATION_INVALID_NAME | Invalid skill name | 技能名称无效 | Error |
| E301 | IPC_COMMAND_FAILED | Command execution failed | 命令执行失败 | Error |
| E302 | IPC_TIMEOUT | IPC call timed out | IPC 调用超时 | Error |
| E303 | IPC_SERIALIZATION_ERROR | Data serialization failed | 数据序列化失败 | Error |
| E401 | ICLOUD_NOT_SIGNED_IN | Not signed in to iCloud | 未登录 iCloud | Warn |
| E402 | ICLOUD_QUOTA_EXCEEDED | iCloud storage full | iCloud 存储已满 | Error |
| E403 | ICLOUD_SYNC_CONFLICT | Sync conflict detected | 检测到同步冲突 | Warn |
| E404 | ICLOUD_UNAVAILABLE | iCloud is not available | iCloud 不可用 | Error |

#### NFR-E4: Error Recovery Classification

**Recovery Types:**

| Type | Description | Examples |
|------|-------------|----------|
| **Recoverable** | User action can resolve the error | Network timeout, file locked, disk temporarily full |
| **Fatal** | Application cannot continue | Memory overflow, data corruption, permanent permission denial |

**Recovery Options Mapping:**

| Error Code | Recovery Type | Options | Auto-Retry |
|------------|---------------|---------|------------|
| E001 FILE_NOT_FOUND | Fatal | Go Home, Report Issue | No |
| E002 FILE_PERMISSION_DENIED | Recoverable | Retry with elevated permissions, Go Home | No |
| E003 FILE_DISK_FULL | Recoverable | Open Storage Settings, Retry | No |
| E004 FILE_LOCKED | Recoverable | Wait & Retry, Skip | Yes (30s) |
| E101 NETWORK_TIMEOUT | Recoverable | Retry, Work Offline | Yes (3x) |
| E102 NETWORK_UNAVAILABLE | Recoverable | Retry, Work Offline | No |
| E201 VALIDATION_INVALID_SKILL | Fatal | View Details, Report Issue | No |
| E401 ICLOUD_NOT_SIGNED_IN | Recoverable | Open System Settings, Work Offline | No |
| E402 ICLOUD_QUOTA_EXCEEDED | Recoverable | Open iCloud Settings, Use Local | No |
| E403 ICLOUD_SYNC_CONFLICT | Recoverable | Keep Local, Keep Remote, Merge | No |

**Recovery Action Types:**

```typescript
type RecoveryAction =
  | 'retry'           // Retry the failed operation
  | 'retry_delayed'   // Retry after delay (with countdown)
  | 'skip'            // Skip this operation, continue with others
  | 'abort'           // Cancel operation, rollback changes
  | 'go_home'         // Navigate to home, clear error state
  | 'open_settings'   // Open relevant settings page
  | 'work_offline'    // Switch to offline mode
  | 'report_issue'    // Open GitHub issue template
  | 'view_details'    // Show detailed error modal
  | 'manual_resolve'; // User must take external action
```

#### NFR-E5: Feature Criticality Matrix

| Level | Features | Behavior on Failure |
|-------|----------|---------------------|
| **Critical** | Library, Import, Deploy | App shows error boundary, cannot continue |
| **Important** | Search, Preview, Sync | Feature disabled, shows fallback UI, rest of app functional |
| **Optional** | Theme, Localization, Auto-update | Feature silently fails, default fallback used |

**Detailed Matrix:**

| Feature | Criticality | Fallback Behavior | User Impact |
|---------|-------------|-------------------|-------------|
| App Library CRUD | Critical | Error boundary | App unusable |
| Skill Import | Critical | Error boundary | App unusable |
| Skill Deployment | Critical | Error boundary | App unusable |
| Global Skills View | Important | Empty state with message | Degraded experience |
| Project Skills View | Important | Empty state with message | Degraded experience |
| Unified Search | Important | Search disabled, show message | Degraded experience |
| Skill Preview | Important | Raw markdown display | Degraded experience |
| iCloud Sync | Important | Local-only mode, sync indicator | Degraded experience |
| Localization | Optional | Default to English | Minor inconvenience |
| Theme Support | Optional | Default to system theme | Minor inconvenience |
| Auto-Update | Optional | Manual update available | Minor inconvenience |

#### NFR-E6: Rust Error Type Definition

**AppError Enum:**

```rust
#[derive(Debug, Clone, Serialize)]
#[serde(tag = "type")]
pub enum AppError {
    FileSystem {
        code: String,       // E001-E099
        message: String,
        path: Option<String>,
        source: Option<String>,
    },
    Network {
        code: String,       // E100-E199
        message: String,
        url: Option<String>,
        timeout_ms: Option<u64>,
    },
    Validation {
        code: String,       // E200-E299
        message: String,
        field: Option<String>,
        value: Option<String>,
    },
    Ipc {
        code: String,       // E300-E399
        message: String,
        command: Option<String>,
    },
    ICloud {
        code: String,       // E400-E499
        message: String,
        container_id: Option<String>,
    },
    Unknown {
        code: String,       // E999
        message: String,
    },
}

impl AppError {
    pub fn is_recoverable(&self) -> bool {
        match self {
            AppError::FileSystem { code, .. } => {
                matches!(code.as_str(), "E004" | "E005" | "E006")
            }
            AppError::Network { .. } => true,
            AppError::Validation { .. } => false,
            AppError::Ipc { code, .. } => {
                matches!(code.as_str(), "E301" | "E302")
            }
            AppError::ICloud { code, .. } => {
                matches!(code.as_str(), "E401" | "E403")
            }
            AppError::Unknown { .. } => false,
        }
    }

    pub fn recovery_actions(&self) -> Vec<RecoveryAction> {
        // Returns available recovery actions based on error type
    }
}
```

**Error Type Conversions:**

| From Type | To AppError Variant | Mapping Logic |
|-----------|---------------------|---------------|
| `std::io::Error` | FileSystem | Match `io::ErrorKind` to code |
| `reqwest::Error` | Network | Parse status code, timeout |
| `serde_json::Error` | Validation | Extract path, expected type |
| `tauri::ipc::InvokeError` | Ipc | Parse error message |
| `objc2_foundation::NSError` | ICloud | Parse domain and code |

**IPC Response Type:**

```rust
#[derive(Serialize)]
pub struct IpcResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<AppError>,
}

// Usage in Tauri commands
#[tauri::command]
async fn library_list() -> IpcResult<Vec<LibrarySkill>> {
    match list_skills().await {
        Ok(skills) => IpcResult::success(skills),
        Err(e) => IpcResult::error(e.into()),
    }
}
```

#### NFR-E7: OS Error Mapping

**errno to User Message Mapping:**

| errno | Code | User Message (EN) | User Message (ZH) | i18n Key |
|-------|------|-------------------|-------------------|----------|
| ENOENT (2) | E001 | "The file or folder does not exist" | "文件或文件夹不存在" | `error.file.not_found` |
| EACCES (13) | E002 | "You don't have permission to access this file" | "您没有权限访问此文件" | `error.file.permission_denied` |
| ENOSPC (28) | E003 | "Your disk is full. Free up space and try again" | "磁盘已满，请释放空间后重试" | `error.file.disk_full` |
| EBUSY (16) | E004 | "This file is being used by another app" | "此文件正被其他应用使用" | `error.file.locked` |
| EIO (5) | E005 | "A disk error occurred. Try again" | "发生磁盘错误，请重试" | `error.file.io_error` |
| ENOTDIR (20) | E006 | "Expected a folder but found a file" | "预期是文件夹但找到的是文件" | `error.file.not_directory` |
| ENAMETOOLONG (63) | E007 | "The name is too long" | "名称过长" | `error.file.name_too_long` |
| EROFS (30) | E008 | "The disk is read-only" | "磁盘为只读状态" | `error.file.read_only` |

**i18n Key Structure:**

```
error.{category}.{specific_error}
error.file.not_found
error.file.permission_denied
error.network.timeout
error.validation.invalid_skill
error.icloud.quota_exceeded
```

#### NFR-E8: iCloud Error Detection

**NSUbiquityIdentityError Code Mapping:**

| NSUbiquityIdentityError Code | App Code | Message (EN) | Message (ZH) |
|------------------------------|----------|--------------|--------------|
| NSUbiquityIdentityDidChange | E405 | "iCloud account changed. Please restart the app." | "iCloud 账户已更改，请重启应用" |
| NSUbiquitousKeyValueStoreAccountChange | E406 | "iCloud account changed. Sync will resume shortly." | "iCloud 账户已更改，同步将稍后恢复" |
| NSUbiquitousKeyValueStoreQuotaViolation | E402 | "iCloud storage full. Free up space or upgrade." | "iCloud 存储已满，请释放空间或升级" |
| NSUbiquitousKeyValueStoreSynchronizationConflict | E403 | "Sync conflict detected. Please choose which version to keep." | "检测到同步冲突，请选择保留哪个版本" |

**Quota Detection Mechanism:**

```rust
struct ICloudQuotaInfo {
    total_bytes: u64,
    used_bytes: u64,
    available_bytes: u64,
    library_size_bytes: u64,
}

impl ICloudBridge {
    async fn check_quota(&self) -> Result<ICloudQuotaInfo, AppError> {
        // Query NSFileManager.ubiquityIdentityToken
        // Calculate available space
        // Warn if library_size > available * 0.9
    }

    fn quota_warning_threshold(&self) -> f32 {
        0.9  // Warn at 90% of available quota
    }
}
```

**Conflict Notification UI:**

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Sync Conflict Detected                                  │
│                                                             │
│  "my-skill" was modified on another device.                 │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Local Version          │  Remote Version            │   │
│  │ Modified: 10:30 AM     │  Modified: 10:35 AM        │   │
│  │ [Preview]              │  [Preview]                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Which version do you want to keep?                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌───────────────────┐   │
│  │ Keep Local  │  │ Keep Remote │  │ Keep Both         │   │
│  └─────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Conflict Resolution Options:**

| Option | Action | Result |
|--------|--------|--------|
| Keep Local | Overwrite remote | Local version synced to all devices |
| Keep Remote | Overwrite local | Remote version downloaded to this device |
| Keep Both | Rename local | Local renamed to "skill-name (conflict copy)" |

**iCloud Status Indicator:**

| Status | Icon | Color | Tooltip |
|--------|------|-------|---------|
| Synced | ✓ | Green | "All changes synced" |
| Syncing | ⟳ | Blue | "Syncing changes..." |
| Pending | ⏳ | Yellow | "Waiting to sync" |
| Conflict | ⚠️ | Orange | "Conflict detected" |
| Error | ✕ | Red | "Sync failed" |
| Offline | ○ | Gray | "Working offline" |

### 8.8 Performance Monitoring

#### 8.8.1 Overview

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-M1 | Startup time tracking | Log cold/warm startup time, alert if > 1.5s for 3 consecutive sessions |
| NFR-M2 | Memory monitoring | Track memory usage every 30s, warn if > 120MB sustained |
| NFR-M3 | Operation latency | Track FR operation durations (import, deploy, search), log slow ops (> 1s) |
| NFR-M4 | Crash reporting | Capture crash logs with context, store locally for user review |
| NFR-M5 | Performance dashboard | Settings page shows performance metrics (startup time, memory, operations) |

---

#### 8.8.2 NFR-M1: Startup Time Tracking

**IPC Command Reference:** `performance_get_startup` (Section 9.3)

**Interface Reference:** `StartupMetrics` (Section 10.9)

**Implementation Details:**

| Component | Implementation |
|-----------|----------------|
| Start Time Recording | Rust: Record `start_time` in app initialization (`setup()` hook) |
| End Time Recording | WebView ready event - record `end_time` when frontend signals ready |
| Cold Start | First launch after system reboot or app termination |
| Warm Start | Launch when app was already in memory (cached) |
| Calculation | `duration = end_time - start_time` in milliseconds |

**Alert Mechanism:**

| Condition | Action |
|-----------|--------|
| Single session > 1.5s | Log warning (INFO level) |
| 3 consecutive sessions > 1.5s | Trigger alert: Log (WARN level) + UI Toast notification |
| Alert notification | "Startup performance degraded. Recent sessions: [times]" |

**Data Storage:**

| Property | Value |
|----------|-------|
| Storage Path | `~/Library/Application Support/CSM/metrics/startup.json` |
| Format | JSON array of startup records |
| Retention | Last 30 sessions |

**Storage Schema:**

```json
{
  "sessions": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "duration": 1250,
      "type": "cold"
    },
    {
      "timestamp": "2024-01-15T14:22:00Z",
      "duration": 450,
      "type": "warm"
    }
  ]
}
```

---

#### 8.8.3 NFR-M2: Memory Monitoring

**IPC Command Reference:** `performance_get_memory` (Section 9.3)

**Interface Reference:** `MemoryMetrics` (Section 10.9)

**Implementation Details:**

| Component | Implementation |
|-----------|----------------|
| Memory Source | Rust: `sysinfo` crate - `System::new_all().process_by_pid()` |
| Sampling Interval | Every 30 seconds (configurable) |
| Metrics Tracked | `currentMB`, `peakMB`, timestamp per sample |
| Sampling Trigger | Background task spawned in app setup |

**Alert Thresholds:**

| Threshold | Value | Action |
|-----------|-------|--------|
| Warning | 120MB (configurable) | Log warning + UI Toast |
| Critical | 200MB | Log error + UI Alert dialog |
| Sustained | > Warning for 5+ samples | Highlight in Performance Dashboard |

**Sampling Data Structure:**

```typescript
interface MemorySample {
  timestamp: Date;
  currentMB: number;
  isWarning: boolean;
}

interface MemoryStorage {
  samples: MemorySample[];
  peakMB: number;
  warningThreshold: number;
  criticalThreshold: number;
}
```

**Storage Path:** `~/Library/Application Support/CSM/metrics/memory.json`

---

#### 8.8.4 NFR-M3: Operation Latency Tracking

**IPC Command Reference:** `performance_get_operations` (Section 9.3)

**Interface Reference:** `OperationMetrics` (Section 10.9)

**Implementation Details:**

| Component | Implementation |
|-----------|----------------|
| Timing Wrapper | Rust: Middleware pattern wrapping IPC command handlers |
| Measurement | Record `start_time` before operation, `end_time` after completion |
| Data Recorded | `operation`, `duration`, `timestamp`, `success` |
| Aggregation | Calculate `avgMs`, `p95Ms`, `slowCount` on request |

**Slow Operation Definition:**

| Metric | Threshold | Action |
|--------|-----------|--------|
| Slow Operation | > 1000ms | Log WARN with operation details |
| Very Slow | > 3000ms | Log ERROR + record in slow operations list |
| Operation Failure | Error thrown | Log ERROR + include in metrics |

**Tracked Operations:**

| Operation | Category | Expected Max |
|-----------|----------|--------------|
| `library_import` | Library | 500ms |
| `library_export` | Library | 300ms |
| `deploy_to_global` | Deployment | 200ms |
| `deploy_to_project` | Deployment | 200ms |
| `search` | Search | 100ms |
| `search_with_snippets` | Search | 200ms |

**Storage Schema:**

```json
{
  "operations": {
    "library_import": {
      "samples": [
        { "timestamp": "2024-01-15T10:30:00Z", "duration": 350, "success": true }
      ],
      "slowOps": [
        { "timestamp": "2024-01-15T09:15:00Z", "duration": 1200 }
      ]
    }
  }
}
```

**Storage Path:** `~/Library/Application Support/CSM/metrics/operations.json`

---

#### 8.8.5 NFR-M4: Crash Reporting

**IPC Command Reference:** `performance_get_crashes` (Section 9.3)

**Interface Reference:** `CrashReport` (Section 10.9)

**Implementation Details:**

| Component | Implementation |
|-----------|----------------|
| Panic Handler | Rust: `std::panic::set_hook()` to capture panic info |
| Error Capture | Panic message + formatted stack trace |
| Context Capture | Serialize current `AppState` (partial) |
| Thread Safety | Main thread + spawned tasks both captured |

**Crash Storage:**

| Property | Value |
|----------|-------|
| Storage Path | `~/Library/Application Support/CSM/crashes/` |
| File Naming | `{timestamp}-{type}.json` (e.g., `20240115-103000-panic.json`) |
| Retention | Last 10 crash reports (FIFO cleanup) |

**Crash Report File Format:**

```json
{
  "id": "crash-20240115-103000",
  "timestamp": "2024-01-15T10:30:00Z",
  "type": "panic",
  "message": "index out of bounds: the len is 3 but the index is 4",
  "stackTrace": "   0: rust_begin_unwind\n   1: core::panicking::panic_fmt\n   ...",
  "appState": {
    "version": "1.0.0",
    "activeView": "library",
    "selectedSkillId": "skill-123"
  },
  "recovered": false
}
```

**Next Launch Notification:**

| Trigger | Condition |
|---------|-----------|
| Detect Crash | File exists in crashes directory with `recovered: false` |
| Display | Modal dialog on app launch |
| Message | "CSM unexpectedly quit last time" |
| Actions | "View Details" button → Opens crash log viewer |

---

#### 8.8.6 NFR-M5: Performance Dashboard

**Location:** Settings → Performance (new tab)

**Dashboard Components:**

| Component | Content | Refresh Rate |
|-----------|---------|--------------|
| Startup Time Chart | Line graph of last 7 days startup times | On load |
| Memory Usage Curve | Real-time memory usage (last 60 samples) | 30s |
| Operation Latency Table | Aggregated metrics per operation | On load |
| Crash Reports List | Last 10 crash reports with details | On load |

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Performance                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─ Startup Time (Last 7 Days) ────────────────────────┐    │
│  │  ▲                                                    │    │
│  │  │     ●──●                                          │    │
│  │  │  ●─●     ●──●                                     │    │
│  │  └─────────────────────────────────────────────▶     │    │
│  │  Cold: avg 1200ms  Warm: avg 400ms  ⚠️ 2 alerts     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Memory Usage (Real-time) ───────────────────────────┐    │
│  │  ▲                                                    │    │
│  │  │              ●●●●●                                │    │
│  │  │         ●●●●●    ●●●                              │    │
│  │  │    ●●●●●            ●●●●                          │    │
│  │  └─────────────────────────────────────────────▶     │    │
│  │  Current: 85MB  Peak: 112MB  Threshold: 120MB       │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Operation Latency ───────────────────────────────────┐   │
│  │  Operation        │ Count │ Avg  │ P95  │ Slow      │   │
│  │  ─────────────────┼───────┼──────┼──────┼───────────│   │
│  │  library_import   │ 45    │ 180ms│ 350ms│ 0         │   │
│  │  deploy_to_global │ 120   │ 95ms │ 180ms│ 0         │   │
│  │  search           │ 890   │ 45ms │ 85ms │ 0         │   │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─ Crash Reports ───────────────────────────────────────┐   │
│  │  Date           │ Type  │ Message                     │   │
│  │  ───────────────┼───────┼────────────────────────────│   │
│  │  Jan 15, 10:30  │ panic │ index out of bounds...     │   │
│  │  Jan 10, 14:22  │ error │ network timeout...         │   │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  [Clear Metrics]                    [Export Report]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Action Buttons:**

| Button | Action | Confirmation |
|--------|--------|--------------|
| Clear Metrics | Delete all stored metrics files | Yes, confirm dialog |
| Export Report | Generate JSON report with all metrics | No (direct download) |

**Export Report Format:**

```json
{
  "exportedAt": "2024-01-15T15:00:00Z",
  "appVersion": "1.0.0",
  "startup": { /* StartupMetrics */ },
  "memory": { /* MemoryMetrics */ },
  "operations": { /* OperationMetrics[] */ },
  "crashes": { /* CrashReport[] */ }
}
```

---

## 9. Architecture Decisions

### 9.1 Technology Stack

| Decision | Choice | Latest Version | Rationale | Trade-offs |
|----------|--------|----------------|-----------|------------|
| Framework | Tauri | **v2.0** | Native macOS performance, minimal footprint (600KB), Rust backend | Rust learning curve, macOS-only scope |
| Frontend | React | **v19.2.5** | Component reusability, concurrent rendering | Bundle size overhead |
| Backend | Rust | **Latest stable** | Memory safety, native performance, Tauri core | Requires Rust expertise |
| Type System | TypeScript | **v6.0.3** | Type safety, better IDE support | Compilation overhead |
| Styling | CSS Modules + Sass | **Latest** | Scoped styles, CSS preprocessing, no runtime overhead | Additional build step |
| Build Tool | Vite | **v8.0.10** | Fast HMR, native ESM | Less mature than Webpack |
| State Management | Zustand | **v5.0.12** | Lightweight, no boilerplate | Smaller ecosystem than Redux |
| Linting | ESLint | **v10.2.1** | Code quality enforcement | Configuration complexity |
| Formatting | Prettier | **v3.8.3** | Consistent code style | Opinionated defaults |
| Testing | Vitest | **v4.1.5** | Fast unit testing, Vite-native, ESM-first | Less mature than Jest |
| Storage | JSON files + iCloud | — | Native iCloud Documents integration | Apple ecosystem dependency |
| macOS Integration | Swift/Kotlin | — | Deep system integration via Tauri plugins | Platform-specific code |
| Internationalization | i18next | **v26.0.8** | Industry-standard i18n for React, lazy loading | Bundle size for translations |
| Markdown Rendering | react-markdown | **v10.1.0** | Lightweight markdown to React, plugin ecosystem | No built-in syntax highlighting |
| Code Highlighting | react-syntax-highlighter | **v16.1.1** | 180+ languages, multiple themes | Bundle size for language definitions |
| Frontmatter Parser | gray-matter | **v4.0.3** | Parse YAML/JSON frontmatter from markdown | Additional parsing step |
| GFM Support | remark-gfm | **v4.0.1** | GitHub Flavored Markdown extensions | — |
| Icon Library | Phosphor Icons | **v2.1.10** | 9,072 icons, 6 weight variants, Apple-style minimalist | Bundle size for all icons |

### 9.1.1 Full Dependency List

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-shell": "^2.0.0",
    "@tauri-apps/plugin-fs": "^2.0.0",
    "@tauri-apps/plugin-dialog": "^2.0.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "zustand": "^5.0.12",
    "react-router-dom": "^7.14.2",
    "i18next": "^26.0.8",
    "react-i18next": "^17.0.4",
    "i18next-browser-languagedetector": "^8.2.1",
    "react-markdown": "^10.1.0",
    "react-syntax-highlighter": "^16.1.1",
    "gray-matter": "^4.0.3",
    "remark-gfm": "^4.0.1",
    "@phosphor-icons/react": "^2.1.10"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^6.0.3",
    "sass": "^1.99.0",
    "vite": "^8.0.10",
    "vitest": "^4.1.5",
    "eslint": "^10.2.1",
    "prettier": "^3.8.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3"
  }
}
```

### 9.1.2 Version Notes

| Package | Notes |
|---------|-------|
| Tauri 2.0 | Uses OS native webview (WKWebView on macOS), ~600KB app size, Rust backend |
| React 19.x | New concurrent features, improved SSR |
| Sass | CSS preprocessing with variables, mixins, nesting; CSS Modules for scoped styles |
| TypeScript 6.x | Improved type inference, faster compilation |
| Vite 8.x | Rolldown-based bundler, native Sass support, significant performance improvements |
| Vitest 4.x | Vite-native testing, fast HMR, ESM-first, Jest-compatible API |
| Rust | Native performance, memory safety, seamless macOS integration |
| Zustand | Lightweight state management for React |
| react-markdown | Markdown rendering with plugin support, no dangerouslySetInnerHTML |
| react-syntax-highlighter | Syntax highlighting with theme support (light/dark mode compatible) |
| gray-matter | Extracts YAML frontmatter from SKILL.md for metadata display |
| @phosphor-icons/react | 9,072 Apple-style icons with 6 weight variants (thin/light/regular/medium/bold/fill), tree-shakable |

### 9.2 Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Rust Core Process                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ File System │  │   iCloud    │  │    Native macOS     │  │
│  │   Access    │  │   Bridge    │  │      APIs           │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    IPC Channel                               │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    WebView Process                           │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                    React UI Layer                        │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────┐ │ │
│  │  │ Sidebar │  │  Cards  │  │ Search  │  │  Settings   │ │ │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────────┘ │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                   State Management                       │ │
│  │              (React Context + useReducer)                │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Tauri Architecture Benefits:**
- Uses macOS native WKWebView (no bundled Chromium)
- App size as low as 600KB vs Electron's ~150MB
- Rust backend for native performance and memory safety
- Direct macOS API access via Swift/Kotlin plugins

### 9.3 IPC Channel Design (Tauri Commands)

| Command | Direction | Purpose |
|---------|-----------|---------|
| **App Library** |||
| `library_list` | Frontend → Rust | List skills in App Library |
| `library_get` | Frontend → Rust | Get skill details from Library |
| `library_delete` | Frontend → Rust | Remove skill from Library |
| `library_import` | Frontend → Rust | Import skill to Library from file/folder |
| `library_export` | Frontend → Rust | Export skill from Library |
| `library_organize` | Frontend → Rust | Move skill to category/group |
| **Global Scope** |||
| `global_list` | Frontend → Rust | List skills in `~/.claude/skills/` |
| `global_get` | Frontend → Rust | Get skill details from Global |
| `global_delete` | Frontend → Rust | Remove skill from Global |
| `global_pull` | Frontend → Rust | Import Global skill to Library |
| **Project Scope** |||
| `project_list` | Frontend → Rust | List watched projects |
| `project_add` | Frontend → Rust | Add project to watch list |
| `project_remove` | Frontend → Rust | Remove project from watch list |
| `project_skills` | Frontend → Rust | List skills in specific project |
| `project_skill_get` | Frontend → Rust | Get skill details from project |
| `project_skill_delete` | Frontend → Rust | Remove skill from project |
| `project_skill_pull` | Frontend → Rust | Import project skill to Library |
| `project_refresh` | Frontend → Rust | Manually refresh skill list for specific project |
| `project_refresh_all` | Frontend → Rust | Refresh skill list for all watched projects |
| **Deployment** |||
| `deploy_to_global` | Frontend → Rust | Deploy Library skill to Global |
| `deploy_to_project` | Frontend → Rust | Deploy skill to specific project |
| `deploy_from_global` | Frontend → Rust | Deploy Global skill to project |
| **Search** |||
| `search` | Frontend → Rust | Unified search across scopes |
| **Config & iCloud** |||
| `config_get` | Frontend → Rust | Get configuration |
| `config_set` | Frontend → Rust | Update configuration |
| `icloud_sync_status` | Frontend → Rust | Check iCloud sync status |
| `icloud_resolve_conflict` | Frontend → Rust | Resolve sync conflicts |
| **Localization & Theme** |||
| `locale_get` | Frontend → Rust | Get current locale setting |
| `locale_set` | Frontend → Rust | Set locale (en/zh-CN) |
| `locale_detect_system` | Frontend → Rust | Detect macOS system locale |
| `theme_get` | Frontend → Rust | Get current theme setting |
| `theme_set` | Frontend → Rust | Set theme (light/dark/system) |
| `theme_detect_system` | Frontend → Rust | Detect macOS appearance |
| **Auto-Update** |||
| `update_check` | Frontend → Rust | Check for available updates |
| `update_download` | Frontend → Rust | Download update package |
| `update_install` | Frontend → Rust | Install downloaded update |
| `update_get_status` | Frontend → Rust | Get current update status/progress |
| `update_rollback` | Frontend → Rust | Rollback to previous version |
| **Security & Error** |||
| `security_sanitize_content` | Frontend → Rust | Sanitize skill content, strip dangerous patterns |
| `error_get_logs` | Frontend → Rust | Retrieve error log entries |
| `error_report` | Frontend → Rust | Report error to local log and optional telemetry |
| **Library Management (Extended)** |||
| `library_categories_list` | Frontend → Rust | List all categories |
| `library_category_create` | Frontend → Rust | Create new category |
| `library_category_rename` | Frontend → Rust | Rename category |
| `library_category_delete` | Frontend → Rust | Delete category (unassign skills) |
| `library_group_create` | Frontend → Rust | Create group under category |
| `library_group_rename` | Frontend → Rust | Rename group |
| `library_group_delete` | Frontend → Rust | Delete group (unassign skills) |
| `library_validate_deployments` | Frontend → Rust | Validate and sync deployment records with actual files |
| **Skill Operations (Extended)** |||
| `skill_file_read` | Frontend → Rust | Read resource file from skill folder |
| **Search (Extended)** |||
| `search_with_snippets` | Frontend → Rust | Search with matched snippet highlighting |
| **Deployment (Extended)** |||
| `deployment_remove` | Frontend → Rust | Remove deployment record from Library skill |
| **Performance Monitoring** |||
| `performance_get_startup` | Frontend → Rust | Get startup time metrics |
| `performance_get_memory` | Frontend → Rust | Get current memory usage |
| `performance_get_operations` | Frontend → Rust | Get operation latency stats |
| `performance_get_crashes` | Frontend → Rust | Get crash report list |
| **State Management** |||
| `state_snapshot` | Frontend → Rust | Snapshot current app state |
| `state_restore` | Frontend → Rust | Restore app from snapshot |
| **IPC Events (Rust → Frontend)** |||
| `update_progress_event` | Rust → Frontend | Real-time update download progress |
| `theme_changed_event` | Rust → Frontend | System theme change notification |
| `icloud_sync_event` | Rust → Frontend | iCloud sync status change |

---

## 10. Data Models

### 10.1 Storage Scopes

```typescript
type SkillScope = 'library' | 'global' | 'project';

interface StorageLocation {
  scope: SkillScope;
  path: string;              // File system path
  exists: boolean;           // Directory exists
  skillCount: number;        // Number of skills
  lastScanned: Date;         // Last scan timestamp
}
```

### 10.2 Skill Entity (App Library)

```typescript
interface LibrarySkill {
  id: string;                    // UUID
  name: string;                  // Skill name (from folder name)
  folderName: string;            // Original folder name (skill identifier)
  version: string;               // Semantic version
  description: string;           // Short description
  path: string;                  // Folder path in iCloud container
  skillMdPath: string;           // Path to SKILL.md file
  categoryId?: string;           // Assigned category
  groupId?: string;              // Assigned group (nested under category)
  importedAt: Date;              // Import timestamp
  updatedAt?: Date;              // Last update timestamp
  size: number;                  // Total size in bytes (all files)
  fileCount: number;             // Number of files in skill folder
  hasResources: boolean;         // True if skill has files beyond SKILL.md
  deployments: Deployment[];     // Where this skill is deployed
}

interface SkillFile {
  name: string;                  // File name
  path: string;                  // Relative path within skill folder
  size: number;                  // File size in bytes
  type: 'skill-md' | 'template' | 'prompt' | 'config' | 'asset' | 'other';
}

interface Deployment {
  id: string;
  skillId: string;               // Reference to Library skill
  targetScope: 'global' | 'project';
  targetPath: string;            // Where skill folder was deployed
  projectName?: string;          // Project name (if project scope)
  deployedAt: Date;              // Deployment timestamp
}
```

### 10.3 Skill Entity (Global/Project)

```typescript
interface InstalledSkill {
  id: string;                    // UUID (generated by app)
  name: string;                  // Skill name (from folder name)
  folderName: string;            // Folder name (skill identifier)
  version: string;               // Semantic version
  description: string;           // Short description
  path: string;                  // Skill folder path
  skillMdPath: string;           // Path to SKILL.md file
  scope: 'global' | 'project';   // Where skill is installed
  projectId?: string;            // Reference to project (if project scope)
  installedAt?: Date;            // When detected by app
  size: number;                  // Total size in bytes
  fileCount: number;             // Number of files in skill folder
  hasResources: boolean;         // True if skill has files beyond SKILL.md
  sourceLibrarySkillId?: string; // Reference to Library skill (if deployed from Library)
}
```

### 10.4 Project Entity

```typescript
interface Project {
  id: string;                    // UUID
  name: string;                  // Project name
  path: string;                  // Project directory path
  skillsPath: string;            // .claude/skills/ path
  exists: boolean;               // Directory still exists
  skillCount: number;            // Number of skills
  addedAt: Date;                 // When added to watch list
  lastAccessed?: Date;           // Last time project was opened
}
```

### 10.5 Category & Group Entities

```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  groups: Group[];               // Nested groups
  skillCount: number;            // Total skills in category
  isCustom: boolean;
  createdAt: Date;
}

interface Group {
  id: string;
  categoryId: string;            // Parent category
  name: string;
  skillCount: number;            // Skills in this group
  isCustom: boolean;
  createdAt: Date;
}
```

### 10.6 Error Types

```typescript
interface AppError {
  code: string;                    // e.g., 'E001', 'E101'
  category: 'filesystem' | 'network' | 'validation' | 'ipc' | 'icloud' | 'unknown';
  message: string;                 // Technical message
  userMessage: string;             // i18n key for user-facing message
  details?: Record<string, unknown>;
  recoverable: boolean;
  recoveryOptions?: ('retry' | 'ignore' | 'abort')[];
  timestamp: Date;
  context?: string;                // Operation context
  stackTrace?: string;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  error: AppError;
  context: string;
  stackTrace?: string;
}
```

### 10.7 Search Types

```typescript
interface SearchResult {
  skill: LibrarySkill | InstalledSkill;
  matchedSnippet: string;          // Highlighted match context
  highlightRanges: [number, number][];  // Character ranges to highlight
  scope: 'library' | 'global' | 'project';
  projectName?: string;            // If project scope
  matchType: 'name' | 'description' | 'content';
}

interface GroupedSearchResults {
  library: SearchResult[];
  global: SearchResult[];
  projects: Map<string, SearchResult[]>;  // projectId → results
  totalCount: number;
  queryTimeMs: number;
}
```

### 10.8 Content Preview Types

```typescript
interface TableOfContents {
  headings: HeadingNode[];
  activeId?: string;               // Currently scrolled to heading
}

interface HeadingNode {
  id: string;                      // Generated anchor ID
  level: number;                   // 1-6 for h1-h6
  text: string;
  line: number;                    // Source line number
  children: HeadingNode[];
}

type FileType = 'skill-md' | 'template' | 'prompt' | 'config' | 'asset' | 'image' | 'code' | 'other';

interface FileContent {
  content: string | ArrayBuffer;   // Binary for images
  type: FileType;
  size: number;
  encoding: 'utf-8' | 'binary';
  mimeType?: string;               // For binary files
}
```

### 10.9 Performance Types

```typescript
interface StartupMetrics {
  coldStartMs: number;
  warmStartMs: number;
  lastThreeSessions: number[];     // For trend detection
  alertThreshold: number;          // 1500ms default
}

interface MemoryMetrics {
  currentMB: number;
  peakMB: number;
  warningThreshold: number;        // 120MB default
  samples: { timestamp: Date, mb: number }[];
}

interface OperationMetrics {
  operation: string;               // e.g., 'library_import', 'deploy_to_project'
  count: number;
  avgMs: number;
  p95Ms: number;
  slowCount: number;               // Operations > 1000ms
  lastSlowOps: { timestamp: Date, durationMs: number }[];
}

interface CrashReport {
  id: string;
  timestamp: Date;
  type: 'panic' | 'error' | 'freeze';
  message: string;
  stackTrace: string;
  appState: Partial<AppState>;
  recovered: boolean;
}
```

### 10.10 State Management Types

```typescript
interface AppState {
  version: string;
  activeView: string;
  selectedSkillId?: string;
  selectedProjectId?: string;
  sidebarState: {
    expandedSections: string[];
    selectedCategory?: string;
    selectedGroup?: string;
  };
  searchState?: {
    query: string;
    scope: SearchScope;
  };
  lastAction?: string;
  lastActionTimestamp?: Date;
}
```

---

## 11. Competitive Analysis

| Feature | CSM | Claude CLI | LobeHub Web | VS Code Extension |
|---------|-----|------------|-------------|-------------------|
| Visual UI | ✅ Native macOS | ❌ CLI only | ✅ Web | ✅ IDE panel |
| App Library | ✅ iCloud synced | ❌ None | ❌ None | ❌ None |
| Global Skills View | ✅ Full | ❌ Manual ls | ❌ None | ❌ None |
| Multi-Project View | ✅ All projects | ❌ Per-project | ❌ None | ⚠️ Current only |
| Unified Search | ✅ All scopes | ❌ None | ✅ Web search | ❌ None |
| Skill Deployment | ✅ One-click | ❌ Manual copy | ❌ None | ❌ None |
| Localization (i18n) | ✅ EN + ZH-CN | ❌ None | ✅ Multi-language | ⚠️ Limited |
| Theme Support | ✅ Light/Dark | ❌ None | ✅ Yes | ✅ IDE theme |
| Offline Capable | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| App Size | ✅ < 5MB | — | — | — |
| Memory Usage | ✅ < 150MB | — | — | — |
| Cost | Free | Free | Free | Free |

**Competitive Advantage:** CSM is the only tool providing unified visibility across App Library, Global, and Project skills with iCloud sync and one-click deployment.

---

## 12. Timeline & Milestones

### Phase 1: Foundation (Week 1-3)

| Week | Deliverable |
|------|-------------|
| 1 | Project setup, Tauri scaffold, Rust backend structure, basic UI shell |
| 2 | App Library management (list, view, delete, categories/groups), iCloud container setup |
| 3 | Skill import/export flow, format validation, iCloud sync implementation |

### Phase 2: Core Features (Week 4-6)

| Week | Deliverable |
|------|-------------|
| 4 | Global Skills view, Project Skills view, project watch list |
| 5 | Skill deployment (Library→Global/Project, Global→Project), unified search |
| 6 | Settings, iCloud sync polish, error handling |

### Phase 3: Polish & Release (Week 7-8)

| Week | Deliverable |
|------|-------------|
| 7 | Onboarding flow, keyboard shortcuts, accessibility |
| 8 | Internal testing, bug fixes, public beta release |

---

## 13. UI/UX Design Specifications

### 13.1 Design Principles

- **macOS 26 Native Feel:** Glassmorphism + lightweight tech aesthetic
- **High Information Density:** Every element earns its place
- **Keyboard-First:** Full keyboard navigation support

### 13.2 Key Screens

| Screen | Layout | Key Elements |
|--------|--------|--------------|
| Main | Sidebar + Card Grid + Top Bar | Scope selector (Library/Global/Projects), categories, skill cards |
| Skill Detail | Single-pane | Content viewer, deploy button |
| Import | Modal with file picker | Folder/file selection, validation feedback, target category |
| Deploy | Modal with scope selector | Library/Global → Project selector, conflict handling |
| Search | Overlay with scope filters | Scope tabs, results grouped by scope |
| Settings | Grouped sections | iCloud status, language, theme, preferences |

### 13.3 Sidebar Structure

```
┌─────────────────────────────┐
│ 🔍 Search...                │
├─────────────────────────────┤
│ 📦 App Library              │  ← iCloud synced
│   ├─ All Skills             │
│   ├─ Categories             │
│   │   ├─ Development        │
│   │   ├─ Productivity       │
│   │   └─ Custom...          │
│   └─ Groups                 │
├─────────────────────────────┤
│ 🌐 Global Skills            │  ← ~/.claude/skills/
│   └─ (flat list)            │
├─────────────────────────────┤
│ 📁 Projects                 │
│   ├─ Project A              │
│   ├─ Project B              │
│   └─ + Add Project          │
└─────────────────────────────┘
```

### 13.3 Visual Specifications

| Element | Specification |
|---------|---------------|
| Card border-radius | 12px |
| Sidebar glass blur | 20px |
| Primary color | System accent (adapts to theme) |
| Font | SF Pro (system default) |
| Animation duration | 150-200ms |
| CSS Architecture | CSS Modules (.module.scss) + Sass variables/mixins |

---

## 14. Risk Assessment

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Rust learning curve | Medium | Medium | Comprehensive documentation, gradual adoption |
| iCloud sync conflicts | Medium | Medium | Conflict resolution UI, local backup |
| macOS API changes | Low | Low | Tauri version pinning, compatibility testing |
| Tauri plugin availability | Low | Low | Native Rust implementation fallback |
| Skill format variations | Medium | Medium | Flexible parser, user feedback on validation |

---

## 15. Acceptance Criteria Summary

| Module | Key Metric | Target |
|--------|------------|--------|
| App Library | List load time | < 300ms (1000 skills) |
| Skill Import | Import time | < 5s per skill |
| Skill Deployment | Deploy time | < 3s |
| Unified Search | Search response | < 500ms |
| iCloud Sync | Sync initiation | < 30s after change |
| Overall | Crash rate | < 0.1% |

---

## 16. Appendix

### A. Reference Documents

- Tauri 2.0 Documentation (https://v2.tauri.app/)
- Claude Code Skills Documentation
- LobeHub Skills Specification
- Sass Documentation
- CSS Modules Specification
- Apple iCloud Documents Integration Guide

### B. Glossary

| Term | Definition |
|------|------------|
| Skill | A Claude Code extension defined in SKILL.md |
| Global Scope | Skills available across all projects |
| Project Scope | Skills specific to a single project |
| Source Label | Origin marker (official/lobehub/local) |

---

*Document Version: 3.0*
*Last Updated: 2026-04-26*
*Classification: Developer Tools / Desktop Application / macOS-only / Tauri*
