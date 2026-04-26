# Chain Closure Verification

Verify development chain is closed (链路闭合) after each phase.

## What is Chain Closure?

- All components connect properly (imports, exports, dependencies)
- All IPC commands are wired up (frontend ↔ backend)
- All state flows are complete (store → component → UI)
- All routes are accessible and functional
- No orphaned code or broken references

## Verification Steps

### After Phase 1 (Foundation)

```
├── Utility files exist and export correctly
├── Component files exist and render without errors
├── No broken imports in foundation code
└── Run: npm run build (verify no compile errors)
```

### After Phase 2 (Core Development)

```
├── All feature modules import foundation correctly
├── All IPC commands are registered in Tauri
├── All stores are connected to components
├── All routes are registered in router
├── Run: npm run build (verify no compile errors)
└── Run: npm run dev (verify app starts)
```

### After Phase 3 (Quality)

```
├── All tests pass
├── No ESLint errors
├── No TypeScript errors
├── Run: npm run test
└── Run: npm run lint
```

## Chain Closure Agent Prompt

```javascript
Agent({
  name: "chain-closure-checker",
  description: "Verify development chain closure",
  subagent_type: "bmad-architect",
  run_in_background: false,
  prompt: `
## MANDATORY: Verify Development Chain Closure

### Step 1: Read ALL Standards
Read ALL files in docs/standards/, CLAUDE.md, design-system/MASTER.md

### Step 2: Verify Chain Closure

**Check 1: Import/Export Closure**
- Grep for all import statements in new files
- Verify all imported modules exist
- Verify all exports are correctly defined
- List any broken imports

**Check 2: IPC Command Closure** (for Tauri projects)
- Check src-tauri/src/commands/ for command definitions
- Check frontend for invoke() calls
- Verify all commands are registered in mod.rs
- List any unregistered commands

**Check 3: State Flow Closure**
- Check Zustand stores for correct exports
- Check components for correct store imports
- Verify state updates trigger UI updates
- List any broken state connections

**Check 4: Route Closure**
- Check router configuration
- Verify all routes have corresponding components
- Verify all route guards are properly configured
- List any broken routes

**Check 5: Build Verification**
- Run: npm run build (or pnpm build)
- Verify no TypeScript errors
- Verify no compile errors
- List any build errors

### Step 3: Output Report

\`\`\`markdown
## Chain Closure Report

### Summary
- Import/Export: ✅ PASS / ❌ FAIL (X broken)
- IPC Commands: ✅ PASS / ❌ FAIL (X unregistered)
- State Flow: ✅ PASS / ❌ FAIL (X broken)
- Routes: ✅ PASS / ❌ FAIL (X broken)
- Build: ✅ PASS / ❌ FAIL

### Issues Found (if any)
| Type | File | Issue | Fix Required |
|------|------|-------|--------------|
| ... | ... | ... | ... |

### Status: PASS / FAIL
\`\`\`

## Files to Check
[List of newly created/modified files]
`
})
```

## If Chain Closure FAILS

1. Spawn fix agent to resolve issues
2. Re-run chain closure verification
3. Do NOT proceed to next phase until chain is closed
