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
  - '.firecrawl/search-electron.json'
  - '.firecrawl/search-claude-code.json'
  - '.firecrawl/search-lobehub.json'
  - '.firecrawl/search-tailwind.json'
  - '.firecrawl/search-openai.json'
stepsCompleted: ['step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
lastEdited: '2026-04-25'
editHistory:
  - date: '2026-04-25'
    changes: 'Full BMAD restructure: added Executive Summary, Success Criteria, Product Scope, User Personas, User Journeys, NFRs, MoSCoW priorities, Competitive Analysis, Architecture Decisions, Data Models, Timeline, Onboarding Flow'
  - date: '2026-04-25'
    changes: 'Updated technology stack with latest NPM versions: Electron 41.3.0, React 19.2.5, TypeScript 6.0.3, TailwindCSS 4.2.4, Vite 8.0.10, OpenAI SDK 6.34.0'
---

# Claude Code Skills Manager - Product Requirements Document

## 1. Executive Summary

### Vision

Claude Code Skills Manager (CSM) is a macOS-native visual management tool for Claude Code Skills. It transforms CLI-only skill management into an intuitive graphical experience, enabling developers to discover, install, organize, and synchronize skills without terminal commands.

### Differentiator

| Competitor | Gap | CSM Solution |
|------------|-----|--------------|
| Claude Code CLI | No GUI, steep learning curve | Native macOS visual interface |
| LobeHub Web | Browser-based, no local management | Local-first with remote sync |
| Manual file management | No version tracking, no updates | Automatic version detection & updates |

### Target Users

- **Primary:** Chinese macOS developers using Claude Code CLI who struggle with English skill documentation
- **Secondary:** Team leads managing shared skill libraries across multiple Macs

### Core Value Proposition

> "Discover, install, and manage Claude Code Skills in seconds—not minutes of terminal commands."

---

## 2. Success Criteria

| ID | Metric | Target | Measurement Method |
|----|--------|--------|-------------------|
| SC-1 | First skill installation time | < 3 minutes | From app launch to first skill installed |
| SC-2 | Skill search success rate | > 85% | User finds target skill within 3 search attempts |
| SC-3 | Translation accuracy satisfaction | > 80% | User rating of bilingual translation quality |
| SC-4 | App crash rate | < 0.1% | Crashes per 1000 sessions |
| SC-5 | Daily active users (30-day) | 500+ | Unique users opening app daily |

---

## 3. Product Scope

### MVP (V1.0)

| Priority | Module | Description |
|----------|--------|-------------|
| Must | Local Skill Management | View, enable/disable, uninstall skills |
| Must | Remote Source Search | Search Claude official + LobeHub sources |
| Must | Basic Installation | Copy-mode installation from remote |
| Should | Source Tracing | Label skills by origin (official/lobehub) |
| Should | Bilingual Translation | Auto-translate English skills to Chinese |

### Growth (V1.1)

| Priority | Module | Description |
|----------|--------|-------------|
| Should | Smart Categorization | AI-powered skill classification |
| Should | Symlink Installation | Lightweight mounting without copying |
| Could | Multi-model Support | Claude, MiniMax integration |

### Vision (V2.0+)

| Priority | Module | Description |
|----------|--------|-------------|
| Won't | iCloud Sync | Cross-device skill synchronization |
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
| 2.1 | Open app, see empty list | "What should I do?" | No guidance | Show onboarding |
| 2.2 | Click "Browse Skills" | "What's available?" | Disorganized categories | Find target in ≤3 clicks |
| 2.3 | See "Git Commit Helper" | "This looks useful" | Description too technical | "Is this for me?" label |
| 2.4 | Click Install | "That's it?" | — | 1-click complete |
| 2.5 | Test in Claude Code | "Does it work?" | Don't know how to invoke | Show usage example |

#### Phase 3: Daily Use

| Step | Touchpoint | Thought/Emotion | Pain Point | Success Metric |
|------|------------|-----------------|------------|----------------|
| 3.1 | Type `/git-commit` in Claude Code | "Let me try" | Forget skill name | Auto-complete available |
| 3.2 | Skill executes successfully | "Wow, this saves time!" | — | 50% task time reduction |

### Journey B: 陈工 - Team Distribution

| Step | Action | Success Metric |
|------|--------|----------------|
| 1 | Create custom skill for team coding standards | Skill created in < 10 min |
| 2 | Export skill package | Export completes in < 30 sec |
| 3 | Share via team channel | Package size < 500KB |
| 4 | Team members import | Import succeeds on first try |

---

## 6. Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│           Welcome to Claude Code Skills Manager              │
│                                                             │
│  [Video Demo: 30-second overview of what skills can do]     │
│                                                             │
│  Choose your role:                                          │
│  ○ I'm new to Skills - help me get started                  │
│  ○ I manage a team - I want to distribute skills            │
│  ○ I'm a developer - I want to create my own skills         │
│                                                             │
│  [Start Exploring]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Novice Path:**
1. Show 3 most popular beginner skills
2. One-click install "Git Commit Helper"
3. Open sample project, demonstrate invocation
4. Done!

---

## 7. Functional Requirements

### FR-1: Local Skill Management (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-1.1 | Display skills by scope (global/project) | List loads in < 500ms for 1000 skills |
| FR-1.2 | Enable/disable single skill | Status change reflects in < 200ms |
| FR-1.3 | Batch enable/disable | Process 100 skills in < 2s |
| FR-1.4 | Uninstall skill with confirmation | Skill removed from disk, list updated |
| FR-1.5 | Open skill directory in Finder | Directory opens in < 1s |
| FR-1.6 | Real-time directory monitoring | List updates within 2s of file change |

### FR-2: Remote Source Search (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-2.1 | Search Claude official source | Results return in < 3s |
| FR-2.2 | Search LobeHub community source | Results return in < 3s |
| FR-2.3 | Mixed source search | Both sources queried in parallel |
| FR-2.4 | Sort by popularity/stars | Sort completes in < 500ms |
| FR-2.5 | Chinese-to-English query translation | Translation in < 2s via OpenAI |

### FR-3: Skill Installation (Must)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-3.1 | One-click install from remote | Download + install in < 10s (1MB skill) |
| FR-3.2 | Format validation before install | Invalid skills rejected with specific error |
| FR-3.3 | Conflict handling (overwrite/skip/rename) | User choice respected |
| FR-3.4 | Source label assignment | Label applied on successful install |

### FR-4: Source Tracing & Updates (Should)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-4.1 | Display source label on skill card | Label visible at all times |
| FR-4.2 | Filter by source | Filter applies in < 200ms |
| FR-4.3 | Check for updates (daily default) | Check completes in < 5s |
| FR-4.4 | One-click update | Update completes in < 15s |
| FR-4.5 | Ignore/skip specific updates | Preference persisted |

### FR-5: Bilingual Translation (Should)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-5.1 | Auto-detect English skills | Detection in < 100ms |
| FR-5.2 | Translate SKILL.md content | Translation in < 5s per 1000 words |
| FR-5.3 | Dual-pane display (original + translation) | Synced scrolling supported |
| FR-5.4 | Cache translations locally | Cache hit rate > 85% |
| FR-5.5 | Manual translation refresh | Refresh completes in < 5s |

### FR-6: Smart Categorization (Could - V1.1)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-6.1 | Auto-classify by name/description | Classification in < 2s per skill |
| FR-6.2 | Manual category reassignment | Change persists immediately |
| FR-6.3 | Custom category creation | Category visible in sidebar |

### FR-7: Third-Party Model Integration (Should)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-7.1 | Configure OpenAI API key | Key stored in macOS Keychain |
| FR-7.2 | Custom API endpoint | Endpoint validated on save |
| FR-7.3 | Model selection (gpt-3.5/gpt-4) | Selection persists across sessions |
| FR-7.4 | Rate limit handling | Graceful degradation with user notice |
| FR-7.5 | Token usage display | Usage updated in real-time |

### FR-8: Backup & Sync (Won't - V1.0)

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-8.1 | Export skills to ZIP | Export 100 skills in < 30s |
| FR-8.2 | Import from ZIP | Import validates before applying |
| FR-8.3 | iCloud sync setup | Sync initiates within 30s of change |

---

## 8. Non-Functional Requirements

### 8.1 Performance

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-P1 | Cold start time | < 3 seconds | Time from launch to interactive |
| NFR-P2 | Skill list load (1000 items) | < 500ms | P95 latency |
| NFR-P3 | Search response time | < 3 seconds | P95 latency |
| NFR-P4 | Memory footprint (idle) | < 200MB | Activity Monitor measurement |
| NFR-P5 | Memory footprint (active) | < 500MB | With 1000 skills loaded |
| NFR-P6 | UI response time | < 100ms | Click to visual feedback |

### 8.2 Security

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-S1 | API key storage | macOS Keychain integration |
| NFR-S2 | Skill content sanitization | Strip dangerous commands before display |
| NFR-S3 | IPC communication | Context-isolated renderer process |
| NFR-S4 | Remote skill validation | SHA-256 checksum verification |
| NFR-S5 | User data encryption | AES-256 for cached translations |

### 8.3 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A1 | Uptime (local app) | 99.9% (crash-free sessions) |
| NFR-A2 | Offline capability | Full local management without network |
| NFR-A3 | Error recovery | Automatic state restoration after crash |

### 8.4 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-U1 | Installation completion rate | > 90% |
| NFR-U2 | First skill install time | < 3 minutes |
| NFR-U3 | Task success rate | > 85% |
| NFR-U4 | Error recovery rate | > 70% |
| NFR-U5 | NPS (30-day) | > 40 |

---

## 9. Architecture Decisions

### 9.1 Technology Stack

| Decision | Choice | Latest Version | Rationale | Trade-offs |
|----------|--------|----------------|-----------|------------|
| Framework | Electron | **v41.3.0** | Cross-platform web tech, rapid development | Higher memory than native Swift |
| Frontend | React | **v19.2.5** | Component reusability, concurrent rendering | Bundle size overhead |
| Type System | TypeScript | **v6.0.3** | Type safety, better IDE support | Compilation overhead |
| Styling | TailwindCSS | **v4.2.4** | CSS-first config, 5x faster builds | Learning curve for utility classes |
| Build Tool | Vite | **v8.0.10** | Fast HMR, native ESM | Less mature than Webpack |
| State Management | Zustand | **v5.0.12** | Lightweight, no boilerplate | Smaller ecosystem than Redux |
| Linting | ESLint | **v10.2.1** | Code quality enforcement | Configuration complexity |
| Formatting | Prettier | **v3.8.3** | Consistent code style | Opinionated defaults |
| Translation API | OpenAI SDK | **v6.34.0** | Best translation quality | Cost, network dependency |
| Storage | JSON files + macOS Keychain | — | Simple, portable, secure key storage | No query capabilities |

### 9.1.1 Full Dependency List

```json
{
  "dependencies": {
    "electron": "^41.3.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "zustand": "^5.0.12",
    "openai": "^6.34.0",
    "react-router-dom": "^7.14.2"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "tailwindcss": "^4.2.4",
    "vite": "^8.0.10",
    "eslint": "^10.2.1",
    "prettier": "^3.8.3",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@electron/packager": "^20.0.0",
    "@electron/rebuild": "^3.2.9"
  }
}
```

### 9.1.2 Version Notes

| Package | Notes |
|---------|-------|
| Electron 41.x | Latest stable, Chromium 134, Node.js 22.x |
| React 19.x | New concurrent features, improved SSR |
| TailwindCSS 4.x | New engine, CSS-first configuration, no `tailwind.config.js` needed |
| TypeScript 6.x | Improved type inference, faster compilation |
| Vite 8.x | Rolldown-based bundler, significant performance improvements |

### 9.2 Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Main Process                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ File System │  │   iCloud    │  │    Node.js Native   │  │
│  │   Access    │  │   Bridge    │  │      Modules        │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │              │
│         └────────────────┼────────────────────┘              │
│                          │                                   │
│                    IPC Channel                               │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
┌──────────────────────────┼───────────────────────────────────┐
│                    Renderer Process                          │
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

### 9.3 IPC Channel Design

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `skill:list` | Renderer → Main | Request skill list |
| `skill:enable` | Renderer → Main | Toggle skill status |
| `skill:uninstall` | Renderer → Main | Remove skill |
| `search:remote` | Renderer → Main | Search remote sources |
| `translate:request` | Renderer → Main | Request translation |
| `config:get` | Renderer → Main | Get configuration |
| `config:set` | Renderer → Main | Update configuration |

---

## 10. Data Models

### 10.1 Skill Entity

```typescript
interface Skill {
  id: string;                    // UUID
  name: string;                  // Skill name
  version: string;               // Semantic version
  description: string;           // Short description
  path: string;                  // Local file path
  scope: 'global' | 'project';   // Scope
  status: 'enabled' | 'disabled';// Current status
  source: 'local' | 'official' | 'lobehub'; // Origin
  category?: string;             // Assigned category
  installedAt: Date;             // Installation timestamp
  updatedAt?: Date;              // Last update timestamp
  translationCache?: string;     // Cached translation path
}
```

### 10.2 Category Entity

```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  skillCount: number;
  isCustom: boolean;
}
```

### 10.3 Translation Cache

```typescript
interface TranslationCache {
  skillId: string;
  originalHash: string;          // SHA-256 of original content
  translatedContent: string;
  translatedAt: Date;
  model: string;                 // Model used for translation
}
```

---

## 11. Competitive Analysis

| Feature | CSM | Claude CLI | LobeHub Web | VS Code Extension |
|---------|-----|------------|-------------|-------------------|
| Visual UI | ✅ Native macOS | ❌ CLI only | ✅ Web | ✅ IDE panel |
| Local Management | ✅ Full | ✅ Full | ❌ None | ⚠️ Limited |
| Remote Sources | ✅ Dual | ❌ Manual | ✅ Primary | ❌ None |
| Bilingual Support | ✅ Built-in | ❌ None | ⚠️ Partial | ❌ None |
| Version Updates | ✅ Auto | ❌ Manual | ✅ Auto | ❌ None |
| Offline Capable | ✅ Yes | ✅ Yes | ❌ No | ✅ Yes |
| Cost | Free | Free | Free | Free |

**Competitive Advantage:** CSM is the only tool combining native macOS UI, dual remote sources, and built-in bilingual support.

---

## 12. Timeline & Milestones

### Phase 1: Foundation (Week 1-3)

| Week | Deliverable |
|------|-------------|
| 1 | Project setup, Electron scaffold, basic UI shell |
| 2 | Local skill management (list, enable/disable) |
| 3 | Installation flow, format validation |

### Phase 2: Core Features (Week 4-6)

| Week | Deliverable |
|------|-------------|
| 4 | Remote source integration (Claude official) |
| 5 | LobeHub integration, source labels |
| 6 | Search functionality, Chinese query translation |

### Phase 3: Enhancement (Week 7-8)

| Week | Deliverable |
|------|-------------|
| 7 | Bilingual translation, caching |
| 8 | Settings, onboarding flow, polish |

### Phase 4: Release (Week 9-10)

| Week | Deliverable |
|------|-------------|
| 9 | Internal testing, bug fixes |
| 10 | Public beta release |

---

## 13. UI/UX Design Specifications

### 13.1 Design Principles

- **macOS 26 Native Feel:** Glassmorphism + lightweight tech aesthetic
- **High Information Density:** Every element earns its place
- **Bilingual-First:** Original + translation always accessible

### 13.2 Key Screens

| Screen | Layout | Key Elements |
|--------|--------|--------------|
| Main | Sidebar + Card Grid + Top Bar | Category nav, skill cards, search |
| Skill Detail | Dual-pane | Original content, translation |
| Search | Full-screen modal | Source tabs, filters, results |
| Settings | Grouped sections | API config, paths, preferences |

### 13.3 Visual Specifications

| Element | Specification |
|---------|---------------|
| Card border-radius | 12px |
| Sidebar glass blur | 20px |
| Primary color | System accent (adapts to theme) |
| Font | SF Pro (system default) |
| Animation duration | 150-200ms |

---

## 14. Risk Assessment

| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| OpenAI API rate limits | Medium | High | Local fallback, request queuing |
| LobeHub format incompatibility | Medium | Medium | Pre-install validation, user warning |
| Electron memory leaks | Medium | Medium | Periodic restart, memory monitoring |
| iCloud sync conflicts | Low | Medium | Conflict resolution UI, local backup |
| macOS API changes | Low | Low | Version pinning, compatibility testing |

---

## 15. Acceptance Criteria Summary

| Module | Key Metric | Target |
|--------|------------|--------|
| Local Management | List load time | < 500ms (1000 skills) |
| Remote Search | Search response | < 3s |
| Installation | Install time | < 10s (1MB skill) |
| Translation | Translation time | < 5s (1000 words) |
| Updates | Update check | < 5s |
| Overall | Crash rate | < 0.1% |

---

## 16. Appendix

### A. Reference Documents

- Electron 30.0 Release Notes
- Claude Code Skills Documentation
- LobeHub Skills Specification
- TailwindCSS v4.0 Documentation
- OpenAI API Reference

### B. Glossary

| Term | Definition |
|------|------------|
| Skill | A Claude Code extension defined in SKILL.md |
| Global Scope | Skills available across all projects |
| Project Scope | Skills specific to a single project |
| Source Label | Origin marker (official/lobehub/local) |

---

*Document Version: 2.0*
*Last Updated: 2026-04-25*
*Classification: Developer Tools / Desktop Application / macOS*
