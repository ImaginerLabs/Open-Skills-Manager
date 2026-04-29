---
name: interaction-trace-analyzer
description: |
  Analyze frontend page interaction chains by tracing all interactive elements through their complete execution paths. Use this skill when the user wants to understand how a frontend page works, debug interaction issues, analyze user flows, or document the complete behavior of UI elements. Triggers on requests like "analyze this page's interactions", "trace button click flow", "what happens when user clicks X", "document all interactive elements", "find issues in user flow", or any frontend interaction analysis task.
---

# Interaction Trace Analyzer

A systematic skill for analyzing frontend page interactions through multi-agent collaboration, tracing each interactive element through its complete execution chain.

## ⚠️ CRITICAL RULES

### 1. NO AUTO-CORRECTION - DOCUMENT ONLY
**绝对禁止自动修复代码问题**。
- ✅ 产出完整的链路分析文档
- ✅ 记录所有发现的问题和建议修复方案
- ❌ **绝不**直接修改代码
- ❌ **绝不**自动应用修复

### 2. ITERATE THROUGH ALL PAGES
必须循环遍历应用的所有页面：
- 发现所有路由/页面入口
- 对每个页面执行完整的元素发现和链路追踪
- 循环直到所有页面都被分析

### 3. TERMINATION = DOCUMENT OUTPUT
分析终止条件是**产出完整文档**：
- 所有页面分析完成
- 所有链路文档记录完成
- 产出最终报告供用户分析

## Agent Roles

| Agent | Role | Key Constraint |
|-------|------|----------------|
| **Main Agent** | Command, coordinate, document | Never explore chains or fix issues |
| **Page Discovery Agent** | Find all pages/routes | Never analyze elements |
| **Exploration Agent** | Scan page for interactive elements | Never explore chains |
| **Subagent (Chain Explorer)** | Trace single element's chain | Never apply fixes |

## Execution Process

```
Phase 0: Page Discovery → Phase 1: Element Discovery → Phase 2: Chain Analysis → Phase 3: Report
```

详细流程请参考：
- `references/phase-0-page-discovery.md` - 页面发现流程
- `references/phase-1-element-discovery.md` - 元素发现流程
- `references/phase-2-chain-exploration.md` - 链路追踪流程
- `references/phase-3-report-generation.md` - 报告生成流程
- `references/chain-record-schema.md` - 链路记录结构
- `references/grading-system.md` - 评级系统

## Output Location

所有分析报告输出到：
`_bmad-output/interaction-analysis/[application-name]-analysis-[timestamp].md`
