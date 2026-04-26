# Step 3: Linkage Validation

## Objective
Validate that all requirement chains are closed loops - every output connects to a valid input somewhere.

## Instructions

### 3.1 Build Dependency Graph

Create a dependency graph connecting requirements:

**Node Types:**
- Requirement nodes (FR-1.1, NFR-P1, etc.)
- Data flow nodes (inputs/outputs)
- External system nodes (iCloud, file system, etc.)

**Edge Types:**
- `produces` - Requirement A produces output X
- `consumes` - Requirement B consumes input X
- `depends_on` - Requirement A depends on Requirement B
- `triggers` - Requirement A triggers Requirement B

### 3.2 Identify Linkage Types

#### Type 1: Internal Linkage (Within PRD)
- Output of FR-A → Input of FR-B
- Example: FR-2.1 (Import) produces LibrarySkill → FR-1.1 (Display) consumes LibrarySkill

#### Type 2: External Linkage (Outside PRD)
- Input from external system (user, file system, iCloud)
- Output to external system (UI, file system, sync)

#### Type 3: Implicit Linkage (Assumed)
- Assumed inputs not explicitly stated
- Assumed outputs not captured

### 3.3 Validate Chain Closure

For each requirement, check:

**✅ CLOSED CHAIN:**
```
FR-2.1 (Import Skill)
  INPUT: Folder path (from user/file picker) ✅
  PROCESSING: Validate, copy, index ✅
  OUTPUT: LibrarySkill object ✅
           → Consumed by FR-1.1 (Display) ✅
           → Consumed by FR-3.1 (Deploy) ✅
  STATUS: CLOSED ✅
```

**⚠️ OPEN CHAIN:**
```
FR-5.9 (Auto-refresh on page open)
  INPUT: ??? (NOT SPECIFIED)
         - What triggers refresh? Navigation event?
         - How is refresh interval configured?
  PROCESSING: Scan watched projects ✅
  OUTPUT: Updated skill list ✅
  STATUS: OPEN - Missing input specification ⚠️
```

**❌ BROKEN CHAIN:**
```
FR-3.6 (Deployment tracking)
  INPUT: Deployment event ✅
  PROCESSING: ??? (NOT SPECIFIED)
         - How is deployment tracked?
         - Where is tracking data stored?
         - What data structure?
  OUTPUT: Deployment list ✅
          → But where is it displayed? NOT SPECIFIED
  STATUS: BROKEN - Processing logic incomplete ❌
```

### 3.4 Categorize Issues

#### 🔴 Critical Issues (Must Fix)
- Missing input specification
- Processing logic undefined
- Output not consumed anywhere
- Circular dependency without exit

#### 🟡 Warning Issues (Should Review)
- Implicit assumptions not documented
- External dependencies not specified
- Error handling not defined
- Edge cases not covered

#### 🟢 Informational (Nice to Have)
- Optimization opportunities
- Redundant specifications
- Alternative approaches

### 3.5 Generate Linkage Matrix

Create a matrix showing all connections:

```markdown
## Linkage Matrix

| Requirement | Inputs From | Outputs To | Status |
|-------------|-------------|------------|--------|
| FR-1.1 | User, Library Store | UI | ✅ Closed |
| FR-1.2 | User, Library Store | UI | ✅ Closed |
| FR-2.1 | User, File Picker | Library Store, UI | ✅ Closed |
| FR-2.2 | User, File Picker | Library Store, UI | ✅ Closed |
| FR-3.6 | Deployment Event | ??? | ❌ Broken |
| ... | ... | ... | ... |
```

### 3.6 Calculate Closure Metrics

```
📊 链路闭环统计

总需求数: 120
✅ 完全闭环: 95 (79.2%)
⚠️ 开环: 18 (15.0%)
❌ 断链: 7 (5.8%)

按模块:
- FR-1 (Library): 7/7 ✅
- FR-2 (Import): 10/11 ⚠️ (FR-2.11 missing cancel behavior)
- FR-3 (Deploy): 8/10 ❌ (FR-3.6, FR-3.9 broken)
- ...
```

### 3.7 Proceed to Next Step

**Frontmatter Update:**
```yaml
stepsCompleted: ['step-01-prd-discovery', 'step-02-requirement-extraction', 'step-03-linkage-validation']
closedChains: 95
openChains: 18
brokenChains: 7
```

Read and follow: `./steps/step-04-report-generation.md`
