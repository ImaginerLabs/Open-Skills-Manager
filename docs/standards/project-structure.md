# 项目结构规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 目录结构

```
claude-skills-manager/
├── electron/                    # Electron 主进程
│   ├── main.ts                  # 主进程入口
│   ├── preload.ts               # 预加载脚本
│   ├── ipc/                     # IPC 处理模块
│   │   ├── index.ts             # IPC 注册中心
│   │   ├── skillHandlers.ts     # 技能相关 IPC
│   │   ├── searchHandlers.ts    # 搜索相关 IPC
│   │   └── ...
│   ├── services/                # 主进程服务
│   │   ├── FileService.ts
│   │   ├── KeychainService.ts
│   │   └── ...
│   ├── utils/                   # 主进程工具
│   └── types/                   # 主进程类型
├── src/                         # 渲染进程 (React)
│   ├── main.tsx                 # React 入口
│   ├── App.tsx                  # 根组件
│   ├── components/              # UI 组件
│   │   ├── ui/                  # shadcn/ui 组件
│   │   ├── common/              # 通用组件
│   │   ├── layout/              # 布局组件
│   │   ├── features/            # 功能组件
│   │   └── icons/               # 图标组件
│   ├── pages/                   # 页面组件
│   ├── hooks/                   # 自定义 Hooks
│   ├── stores/                  # Zustand 状态管理
│   ├── services/                # 前端服务层
│   ├── types/                   # TypeScript 类型
│   ├── utils/                   # 工具函数
│   └── styles/                  # 全局样式
├── public/                      # 静态资源
├── tests/                       # 测试文件
└── docs/                        # 文档
```

---

## 模块职责

| 目录 | 职责 | 示例 |
|------|------|------|
| `components/ui` | shadcn/ui 基础组件 | Button, Dialog, Input |
| `components/common` | 可复用的 UI 原子组件 | EmptyState, ThemeProvider |
| `components/layout` | 页面布局结构组件 | Sidebar, TopBar, MainLayout |
| `components/features` | 业务功能组件 | SkillCard, SearchOverlay |
| `components/icons` | SVG 图标封装组件 | SearchIcon, InstallIcon |
| `pages` | 路由页面入口组件 | HomePage, SettingsPage |
| `hooks` | 可复用的状态逻辑 | useSkills, useSearch |
| `stores` | 全局状态管理 | skillStore, settingsStore |
| `services` | 外部交互封装 | ipcService |
| `types` | 类型定义 | Skill, Category |
| `utils` | 纯函数工具 | formatters, validators |

---

## 文件命名规则

| 文件类型 | 命名规范 | 示例 |
|----------|----------|------|
| 组件文件 | PascalCase.tsx | `SkillCard.tsx` |
| 图标文件 | PascalCase.tsx | `SearchIcon.tsx` |
| Hook 文件 | camelCase.ts | `useSkills.ts` |
| Store 文件 | camelCase + Store.ts | `skillStore.ts` |
| 服务文件 | camelCase + Service.ts | `ipcService.ts` |
| 类型文件 | camelCase.ts | `skill.ts` |
| 工具文件 | camelCase.ts | `formatters.ts` |
| 测试文件 | 源文件名 + .test.ts(x) | `Button.test.tsx` |

---

## 文件大小与复杂度限制

| 类型 | 行数限制 | 圈复杂度 | 说明 |
|------|----------|----------|------|
| 组件文件 | ≤ 400 行 | ≤ 20 | 逻辑清晰可放宽 |
| Hook 文件 | ≤ 200 行 | ≤ 15 | 单一职责 |
| Store 文件 | ≤ 300 行 | - | 按功能域拆分 |
| 工具文件 | ≤ 200 行 | ≤ 10 | 纯函数集合 |

> **注意**: 行数是参考指标，逻辑复杂度和可读性更重要。逻辑清晰的 400 行组件优于强行拆分的碎片化代码。

---

## 单文件 vs 文件夹组件

| 条件 | 结构 | 示例 |
|------|------|------|
| 组件 ≤ 300 行，无子组件 | 单文件 | `SkillCard.tsx` |
| 组件 > 300 行，或有子组件 | 文件夹 | `SkillCard/index.tsx` |
| 组件有独立样式/资源 | 文件夹 | `SkillCard/styles.css` |
| 组件有复杂类型定义 | 文件夹 | `SkillCard/types.ts` |

### 文件夹组件结构

```
components/features/SkillCard/
├── index.tsx           # 主组件，导出入口
├── SkillCardHeader.tsx # 子组件
├── SkillCardBody.tsx   # 子组件
├── types.ts            # 类型定义 (>50行时拆分)
├── hooks.ts            # 私有 Hook (>80行时拆分)
└── utils.ts            # 私有工具函数 (>50行时拆分)
```

### 导出规范

```tsx
// 文件夹组件统一从 index 导出
// components/features/SkillCard/index.tsx
export { SkillCard } from './SkillCard';
export type { SkillCardProps } from './types';

// 使用时
import { SkillCard, type SkillCardProps } from '@/components/features/SkillCard';
```

---

## 模块内部结构

```
模块目录/
├── index.ts            # 公共导出入口 (必须)
├── types.ts            # 类型定义 (>50行时拆分)
├── constants.ts        # 常量定义 (如有)
├── hooks/              # Hooks 目录 (>2个 Hook 时)
│   ├── useModuleA.ts
│   └── useModuleB.ts
├── components/         # 子组件 (>2个时)
│   ├── ComponentA.tsx
│   └── ComponentB.tsx
└── utils/              # 工具函数 (>2个时)
    ├── helperA.ts
    └── helperB.ts
```
