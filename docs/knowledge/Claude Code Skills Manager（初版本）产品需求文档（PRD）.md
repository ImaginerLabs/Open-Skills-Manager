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
---

# Claude Code Skills Manager - Product Requirements Document

## 1. Executive Summary

### Vision

Claude Code Skills Manager (CSM) is a macOS-native visual management tool for Claude Code CLI Skills. It provides a centralized skill library with iCloud sync, while also allowing users to view and manage skills deployed across global scope and multiple projects.

### Core Concepts

| Concept | Description |
|---------|-------------|
| **App Library** | User's personal skill collection stored in iCloud container. User manually imports/exports, organizes with categories/groups. iCloud syncs this space only. |
| **Global Skills** | Skills deployed to `~/.claude/skills/` (Claude Code CLI global scope) |
| **Project Skills** | Skills deployed to `.claude/skills/` in specific project directories |
| **Deployment** | Copying a skill from App Library to Global or Project scope |

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
| FR-1.2 | View skill details | Show SKILL.md content with syntax highlighting |
| FR-1.3 | Delete skill from library | Skill removed from iCloud container, list updated |
| FR-1.4 | Organize with categories | Create, rename, delete custom categories |
| FR-1.5 | Organize with groups | Create, rename, delete custom groups (nested under categories) |
| FR-1.6 | Drag & drop organization | Move skills between categories/groups |
| FR-1.7 | Real-time library monitoring | List updates within 2s of iCloud sync |

### FR-2: Skill Import/Export (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-2.1 | Import from local folder | Select folder, validate SKILL.md exists |
| FR-2.2 | Import from local file | Select SKILL.md file directly |
| FR-2.3 | Batch import | Import multiple skills at once |
| FR-2.4 | Format validation | Invalid skills rejected with specific error message |
| FR-2.5 | Duplicate handling | Prompt user: skip/replace/rename |
| FR-2.6 | Export single skill | Export as .zip or folder |
| FR-2.7 | Export multiple skills | Batch export with selection |

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

### FR-4: Global Skills View (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-4.1 | List Global skills | Display all skills in `~/.claude/skills/` |
| FR-4.2 | View Global skill details | Show SKILL.md content |
| FR-4.3 | Delete from Global | Remove skill from `~/.claude/skills/` |
| FR-4.4 | Pull to Library | Import Global skill to App Library |
| FR-4.5 | Real-time monitoring | Detect changes when skills added/removed externally |

### FR-5: Project Skills View (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-5.1 | Add project to watch list | Browse and select project directory |
| FR-5.2 | List watched projects | Show all added projects in sidebar |
| FR-5.3 | View project skills | Display skills in `<project>/.claude/skills/` |
| FR-5.4 | View skill details | Show SKILL.md content |
| FR-5.5 | Delete from project | Remove skill from project scope |
| FR-5.6 | Pull to Library | Import project skill to App Library |
| FR-5.7 | Remove project from list | Stop watching a project (doesn't delete skills) |
| FR-5.8 | Project status indicator | Show if project exists/missing |

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
    "react-router-dom": "^7.14.2"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "typescript": "^6.0.3",
    "sass": "^1.86.0",
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
  name: string;                  // Skill name
  version: string;               // Semantic version
  description: string;           // Short description
  path: string;                  // Path in iCloud container
  categoryId?: string;           // Assigned category
  groupId?: string;              // Assigned group (nested under category)
  importedAt: Date;              // Import timestamp
  updatedAt?: Date;              // Last update timestamp
  deployments: Deployment[];     // Where this skill is deployed
}

interface Deployment {
  id: string;
  skillId: string;               // Reference to Library skill
  targetScope: 'global' | 'project';
  targetPath: string;            // Where skill was deployed
  projectName?: string;          // Project name (if project scope)
  deployedAt: Date;              // Deployment timestamp
}
```

### 10.3 Skill Entity (Global/Project)

```typescript
interface InstalledSkill {
  id: string;                    // UUID (generated by app)
  name: string;                  // Skill name
  version: string;               // Semantic version
  description: string;           // Short description
  path: string;                  // File system path
  scope: 'global' | 'project';   // Where skill is installed
  projectId?: string;            // Reference to project (if project scope)
  installedAt?: Date;            // When detected by app
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
| Settings | Grouped sections | iCloud status, preferences |

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

*Document Version: 2.2*
*Last Updated: 2026-04-26*
*Classification: Developer Tools / Desktop Application / macOS-only / Tauri*
