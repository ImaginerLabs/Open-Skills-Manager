# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

Claude Code Skills Manager (CSM) - macOS 原生 Tauri 应用，用于可视化管理 Claude Code Skills。

**技术栈**: Tauri 2 + React 19 + TypeScript 6 + CSS Modules + Sass + Vite 8 + Zustand

## 设计系统

> **重要:** 所有 UI 开发必须遵循设计系统规范。

**设计系统源文件:** `design-system/claude-code-skills-manager/MASTER.md`

### 核心风格
- **Glassmorphism** - 三级毛玻璃效果（light/medium/heavy）
- **macOS Native** - 系统字体、圆角、阴影
- **交互动画** - 弹性缓动、悬停抬起、交错入场

### 页面特定规则
构建特定页面时，先检查 `design-system/pages/[page-name].md`，存在则覆盖 MASTER.md。

### 开发规范引用
`docs/standards/design-tokens.md` - 设计令牌精简版（与 MASTER.md 同步）

## 开发规范

前端开发规范位于 `docs/standards/` 目录：

### 架构与结构
- `project-structure.md` - 目录结构与文件命名
- `naming-conventions.md` - 命名约定
- `security-standards.md` - 安全规范

### 前端开发
- `react-standards.md` - React 组件规范
- `typescript-standards.md` - TypeScript 类型规范
- `hooks-standards.md` - Hook 抽离规范
- `state-management.md` - Zustand 状态管理
- `component-library.md` - 组件库复用规范

### UI 设计
- `design-tokens.md` - 设计令牌（与设计系统同步）

### 通信与调试
- `ipc-standards.md` - IPC 通信规范
- `debugging-standards.md` - Tauri 调试规范

### 工程化
- `testing-standards.md` - 测试规范
- `git-standards.md` - Git 提交规范

## BMad 框架

项目使用 BMad 进行开发流程管理：

- 配置文件: `_bmad/config.toml`
- 输出目录: `_bmad-output/`
- Skills 目录: `.claude/skills/`

### 开发流程规范

详细流程请参考 `docs/standards/bmad-workflow.md`，包含：

- **Phase 1: 发现阶段** - 产品简报、PRD、市场研究
- **Phase 2: 规划阶段** - UX 设计、架构决策、Epic/Story 分解
- **Phase 3: 准备阶段** - 完整性检查、Sprint 规划、Story 上下文填充
- **Phase 4: 实现阶段** - Story 开发、测试、代码审查
- **Phase 5: 回顾阶段** - Epic 回顾、经验提取、下一迭代准备

### 快速参考

```bash
# 典型开发流程
/bmad-product-brief      # 创建产品简报
/bmad-create-prd         # 创建 PRD
/bmad-create-architecture # 架构设计
/bmad-create-epics-and-stories # 分解 Epic/Story
/bmad-sprint-planning    # Sprint 规划
/bmad-create-story       # 创建 Story
/bmad-dev-story          # 实现 Story
/bmad-code-review        # 代码审查
/bmad-retrospective      # Epic 回顾
```
