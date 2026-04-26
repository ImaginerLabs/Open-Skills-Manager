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
| FR-6.1 | Search scope selector | Filter by: App Library / Global / Specific Project / All |
| FR-6.2 | Search by name | Match skill name, real-time filtering |
| FR-6.3 | Search by description | Match content in SKILL.md |
| FR-6.4 | Search by category | Filter by category in App Library |
| FR-6.5 | Search results grouping | Group results by scope (Library/Global/Project) |
| FR-6.6 | Quick actions from search | Deploy/delete directly from search results |

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

### FR-11: Auto-Update (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-11.1 | Check for updates on launch | Query GitHub Releases API silently, compare version with current |
| FR-11.2 | Update notification | Show notification badge when update available, include release notes |
| FR-11.3 | User consent dialog | Prompt user before downloading: "Update to vX.X.X?" with release notes |
| FR-11.4 | Background download | Download update in background, show progress indicator |
| FR-11.5 | Install and restart | Install update on user confirmation, restart app automatically |
| FR-11.6 | Skip update option | User can skip this version, won't be prompted again until next version |
| FR-11.7 | Auto-update toggle | User can disable auto-update check in Settings |
| FR-11.8 | Update check interval | Check at most once per 24 hours, cache last check timestamp |
| FR-11.9 | Offline handling | Skip update check if offline, retry on next launch |
| FR-11.10 | Rollback support | Keep previous version, allow rollback if update fails |

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

### 8.2 Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-S1 | Skill content sanitization | Strip dangerous commands before display |
| NFR-S2 | IPC communication | Tauri capability-based permissions |
| NFR-S3 | Skill validation on import | SKILL.md format validation |
| NFR-S4 | iCloud data protection | NSFileProtectionComplete for sensitive files |

### 8.3 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A1 | Uptime (local app) | 99.9% (crash-free sessions) |
| NFR-A2 | Offline capability | Full local management without network |
| NFR-A3 | Error recovery | Automatic state restoration after crash |

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

### 8.8 Performance Monitoring

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-M1 | Startup time tracking | Log cold/warm startup time, alert if > 1.5s for 3 consecutive sessions |
| NFR-M2 | Memory monitoring | Track memory usage every 30s, warn if > 120MB sustained |
| NFR-M3 | Operation latency | Track FR operation durations (import, deploy, search), log slow ops (> 1s) |
| NFR-M4 | Crash reporting | Capture crash logs with context, store locally for user review |
| NFR-M5 | Performance dashboard | Settings page shows performance metrics (startup time, memory, operations) |

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

*Document Version: 2.8*
*Last Updated: 2026-04-26*
*Classification: Developer Tools / Desktop Application / macOS-only / Tauri*
