# BMad 开发流程规范

本文档详细说明 BMad 框架的开发生命周期、各阶段对应的技能（Skills）以及最佳实践。

## 概述

BMad 是一套结构化的 AI 驱动开发方法论，通过明确的阶段划分和专用技能，确保从需求到交付的全流程质量。

### 核心配置

- **配置文件**: `_bmad/config.toml`
- **输出目录**: `_bmad-output/`
- **Skills 目录**: `.claude/skills/`

---

## 开发生命周期

BMad 开发流程分为 **5 个主要阶段**：

```
Phase 1: 发现阶段 → Phase 2: 规划阶段 → Phase 3: 准备阶段 → Phase 4: 实现阶段 → Phase 5: 回顾阶段
```

---

## Phase 1: 发现阶段 (Discovery)

**目标**: 理解产品意图、市场需求和技术可行性。

### 生命周期流程

```
产品构想 → 产品简报 → 需求文档
```

### 核心技能

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-product-brief` | "create product brief" | 创建产品简报，通过引导式发现定义产品愿景 |
| `bmad-market-research` | "conduct market research" | 市场研究与竞品分析 |
| `bmad-domain-research` | "conduct domain research" | 领域知识与行业研究 |
| `bmad-technical-research` | "conduct technical research" | 技术可行性研究 |
| `bmad-create-prd` | "create PRD" | 创建产品需求文档 (PRD) |
| `bmad-edit-prd` | "edit PRD" | 编辑现有 PRD |
| `bmad-validate-prd` | "validate PRD" | 验证 PRD 完整性与一致性 |

### 关键产出

- **产品简报** (`product-brief.md`): 1-2 页执行摘要
- **PRD** (`prd.md`): 完整产品需求文档
- **研究发现** (`_bmad-output/planning-artifacts/`): 市场/领域/技术研究报告

### 最佳实践

1. **意图优先**: 先理解 WHY，再探索 WHAT
2. **多源验证**: 结合用户输入、文档分析、Web 研究
3. **迭代细化**: 产品简报 → PRD 逐步深化

---

## Phase 2: 规划阶段 (Planning)

**目标**: 将需求转化为可执行的技术方案和用户故事。

### 生命周期流程

```
PRD → UX 设计 → 架构决策 → Epic/Story 分解
```

### 核心技能

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-create-ux-design` | "create UX design" | 创建 UX 设计方案与用户流程 |
| `bmad-create-architecture` | "create architecture" | 创建技术架构决策文档 |
| `bmad-create-epics-and-stories` | "create epics and stories" | 将需求分解为 Epic 和 Story |
| `bmad-prd-linkage-analysis` | "analyze PRD linkage" | 分析 PRD 需求的可追溯性 |

### 关键产出

- **UX 设计** (`ux-design.md`): 用户流程、线框图、交互规范
- **架构文档** (`architecture.md`): 技术栈、API 设计、数据模型
- **Epics 文档** (`epics.md`): 按 Epic 组织的用户故事集合

### 最佳实践

1. **对齐验证**: 架构决策必须追溯至 PRD 需求
2. **用户中心**: UX 设计优先，技术方案服务于用户体验
3. **合理分解**: Epic 应独立交付，Story 应可在单次迭代内完成

---

## Phase 3: 准备阶段 (Preparation)

**目标**: 验证规划完整性，准备开发环境与上下文。

### 生命周期流程

```
完整性检查 → Sprint 规划 → Story 上下文填充
```

### 核心技能

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-check-implementation-readiness` | "check implementation readiness" | 验证 PRD/UX/架构/Epics 完整性 |
| `bmad-sprint-planning` | "run sprint planning" | 生成 Sprint 状态跟踪文件 |
| `bmad-create-story` | "create next story" | 为 Story 填充完整开发上下文 |
| `bmad-generate-project-context` | "generate project context" | 生成项目上下文文档 |

### 关键产出

- **Sprint 状态** (`sprint-status.yaml`): 开发进度跟踪
- **Story 文件** (`{epic}-{story}-{title}.md`): 包含完整上下文的可执行 Story

### Story 状态流转

```
backlog → ready-for-dev → in-progress → review → done
```

### Epic 状态流转

```
backlog → in-progress → done
```

### 最佳实践

1. **前置验证**: 开发前必须通过 `check-implementation-readiness`
2. **上下文丰富**: Story 必须包含架构约束、前置学习、文件引用
3. **状态同步**: 通过 `sprint-status.yaml` 统一跟踪进度

---

## Phase 4: 实现阶段 (Implementation)

**目标**: 按 Story 规范实现功能，确保代码质量。

### 生命周期流程

```
Story 开发 → 测试编写 → 代码审查 → 状态更新
```

### 核心技能

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-dev-story` | "dev this story" | 执行 Story 实现 (红-绿-重构循环) |
| `bmad-code-review` | "run code review" | 多层并行代码审查 |
| `bmad-quick-dev` | "quick dev" | 快速实现小型功能（跳过完整流程） |

### 测试相关技能 (TEA 模块)

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-tea` | "talk to Murat" | 测试架构师主入口 |
| `bmad-testarch-atdd` | - | 生成验收测试驱动开发测试 |
| `bmad-testarch-test-design` | - | 创建系统级测试设计 |
| `bmad-testarch-automate` | - | 扩展测试自动化覆盖 |
| `bmad-testarch-test-review` | - | 审查测试质量 |
| `bmad-testarch-trace` | - | 生成可追溯性矩阵 |
| `bmad-testarch-nfr` | - | 评估非功能性需求 |
| `bmad-testarch-ci` | - | 搭建 CI/CD 质量管道 |

### 开发循环 (Red-Green-Refactor)

```
1. RED:   编写失败测试
2. GREEN: 最小实现使测试通过
3. REFACTOR: 优化代码结构，保持测试通过
```

### 代码审查层级

- **Blind Hunter**: 发现隐藏缺陷
- **Edge Case Hunter**: 边界条件分析
- **Acceptance Auditor**: 验收标准核对

### 最佳实践

1. **测试先行**: 严格遵循 TDD 红绿重构
2. **完整验证**: 所有 AC 满足、测试通过、无回归
3. **审查分离**: 使用不同 LLM 进行代码审查
4. **状态同步**: 完成后更新 `sprint-status.yaml`

---

## Phase 5: 回顾阶段 (Retrospective)

**目标**: 提取经验教训，为下一迭代做准备。

### 生命周期流程

```
Epic 完成 → 回顾会议 → 行动项提取 → 下一 Epic 准备
```

### 核心技能

| 技能名称 | 触发命令 | 描述 |
|---------|---------|------|
| `bmad-retrospective` | "run retrospective" | Epic 回顾与经验提取 |
| `bmad-sprint-status` | "show sprint status" | 查看 Sprint 状态摘要 |
| `bmad-correct-course` | "correct course" | 处理重大变更或方向调整 |

### 回顾产出

- **回顾文档** (`epic-{N}-retro-{date}.md`): 经验总结
- **行动项**: 具体改进措施与责任人
- **下一 Epic 准备**: 技术准备、知识缺口、依赖检查

### 最佳实践

1. **无责文化**: 关注系统与流程，而非个人
2. **具体可行**: 行动项必须 SMART (具体、可衡量、可达成、相关、有时限)
3. **前后衔接**: 检查上一回顾的行动项执行情况

---

## 辅助技能

### 创意与问题解决 (CIS 模块)

| 技能名称 | 描述 |
|---------|------|
| `bmad-brainstorming` | 引导式头脑风暴 |
| `bmad-cis-design-thinking` | 设计思维流程 |
| `bmad-cis-problem-solving` | TRIZ 系统化问题解决 |
| `bmad-cis-innovation-strategy` | 创新战略分析 |
| `bmad-cis-storytelling` | 叙事与沟通 |

### 文档与知识管理

| 技能名称 | 描述 |
|---------|------|
| `bmad-document-project` | 棕地项目文档化 |
| `bmad-index-docs` | 文档索引生成 |
| `bmad-shard-doc` | 大文档分片 |
| `bmad-distillator` | LLM 优化压缩 |

### 质量与审查

| 技能名称 | 描述 |
|---------|------|
| `bmad-review-adversarial-general` | 对抗性审查 |
| `bmad-review-edge-case-hunter` | 边界条件审查 |
| `bmad-editorial-review-prose` | 文案审查 |
| `bmad-editorial-review-structure` | 结构审查 |

---

## Agent 角色

BMad 定义了以下专业 Agent 角色：

| Agent | 名称 | 角色 | 模块 |
|-------|------|------|------|
| `bmad-agent-analyst` | Mary | 业务分析师 | BMM |
| `bmad-agent-pm` | John | 产品经理 | BMM |
| `bmad-agent-ux-designer` | Sally | UX 设计师 | BMM |
| `bmad-agent-architect` | Winston | 系统架构师 | BMM |
| `bmad-agent-dev` | Amelia | 高级软件工程师 | BMM |
| `bmad-agent-tech-writer` | Paige | 技术文档专家 | BMM |
| `bmad-tea` | Murat | 测试架构师 | TEA |
| `bmad-cis-agent-storyteller` | Sophia | 故事讲述专家 | CIS |
| `bmad-cis-agent-design-thinking-coach` | Maya | 设计思维教练 | CIS |
| `bmad-cis-agent-brainstorming-coach` | Carson | 头脑风暴教练 | CIS |
| `bmad-cis-agent-creative-problem-solver` | Dr. Quinn | 问题解决专家 | CIS |
| `bmad-cis-agent-innovation-strategist` | Victor | 创新战略专家 | CIS |
| `bmad-cis-agent-presentation-master` | Caravaggio | 演示与沟通专家 | CIS |

---

## 工作流架构

BMad Skills 采用 **Step-File 架构**：

### 核心原则

- **微文件设计**: 每个步骤是独立的指令文件
- **即时加载**: 仅加载当前步骤文件
- **顺序强制**: 必须按序执行，不可跳过
- **状态跟踪**: 通过 frontmatter `stepsCompleted` 跟踪进度
- **追加构建**: 逐步追加内容构建文档

### 步骤处理规则

1. **完整读取**: 执行前完整读取步骤文件
2. **顺序执行**: 按编号顺序执行各部分
3. **等待输入**: 遇菜单时暂停等待用户选择
4. **保存状态**: 进入下一步前更新 frontmatter
5. **加载下一步**: 按指令加载并执行下一步文件

---

## 配置层叠

BMad 使用三层配置合并：

```
基础配置 → 团队配置 → 用户配置
```

1. `{skill-root}/customize.toml` — 默认配置
2. `{project-root}/_bmad/custom/{skill-name}.toml` — 团队覆盖
3. `{project-root}/_bmad/custom/{skill-name}.user.toml` — 个人覆盖

**合并规则**:
- 标量值覆盖
- 表深度合并
- 带 `code`/`id` 键的表数组替换匹配项并追加新项
- 其他数组追加

---

## 快速参考

### 典型开发流程

```bash
# Phase 1: 发现阶段
/bmad-product-brief      # 创建产品简报
/bmad-create-prd         # 创建 PRD

# Phase 2: 规划阶段
/bmad-create-ux-design   # UX 设计
/bmad-create-architecture # 架构设计
/bmad-create-epics-and-stories # 分解 Epic/Story

# Phase 3: 准备阶段
/bmad-check-implementation-readiness # 验证完整性
/bmad-sprint-planning    # Sprint 规划
/bmad-create-story       # 创建下一个 Story

# Phase 4: 实现阶段
/bmad-dev-story          # 实现 Story
/bmad-code-review        # 代码审查
/bmad-tea                # 测试架构（可选）

# Phase 5: 回顾阶段
/bmad-retrospective      # Epic 回顾
```

### 文件位置

| 类型 | 路径 |
|------|------|
| 规划产出 | `_bmad-output/planning-artifacts/` |
| 实现产出 | `_bmad-output/implementation-artifacts/` |
| 测试产出 | `_bmad-output/test-artifacts/` |
| Sprint 状态 | `_bmad-output/implementation-artifacts/sprint-status.yaml` |
| Story 文件 | `_bmad-output/implementation-artifacts/{epic}-{story}-{title}.md` |
