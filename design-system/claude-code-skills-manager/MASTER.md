# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Claude Code Skills Manager
**Generated:** 2026-04-26
**Style:** Glassmorphism + macOS Native + Modern Tech
**Platform:** macOS Desktop App (Tauri)

---

## Design Philosophy

### Core Principles

1. **macOS Native Feel** - 遵循 macOS 设计语言，毛玻璃、圆角、微妙阴影
2. **High Information Density** - 每个元素都有其存在价值
3. **Fluid Interactions** - 流畅的交互动画，响应迅速
4. **Dark-First** - 以深色模式为主，浅色模式为辅

---

## Color System

### Primary Palette (Dark Mode - Default)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Background Base | `#1C1C1E` | `--color-bg-base` | 主背景 |
| Background Elevated | `#2C2C2E` | `--color-bg-elevated` | 侧边栏、面板 |
| Background Glass | `rgba(44,44,46,0.72)` | `--color-bg-glass` | 毛玻璃表面 |
| Primary | `#0A84FF` | `--color-primary` | 主色调、链接 |
| Primary Hover | `#409CFF` | `--color-primary-hover` | 主色调悬停 |
| Success | `#30D158` | `--color-success` | 成功状态、CTA |
| Warning | `#FFD60A` | `--color-warning` | 警告 |
| Error | `#FF453A` | `--color-error` | 错误 |
| Text Primary | `#F5F5F7` | `--color-text-primary` | 主文字 |
| Text Secondary | `#A1A1A6` | `--color-text-secondary` | 次要文字 |
| Text Tertiary | `#636366` | `--color-text-tertiary` | 辅助文字 |
| Border | `rgba(255,255,255,0.1)` | `--color-border` | 边框 |
| Border Hover | `rgba(255,255,255,0.2)` | `--color-border-hover` | 边框悬停 |

### Light Mode Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Background Base | `#F5F5F7` | `--color-bg-base` |
| Background Elevated | `#FFFFFF` | `--color-bg-elevated` |
| Background Glass | `rgba(255,255,255,0.72)` | `--color-bg-glass` |
| Primary | `#007AFF` | `--color-primary` |
| Text Primary | `#1D1D1F` | `--color-text-primary` |
| Text Secondary | `#86868B` | `--color-text-secondary` |
| Border | `rgba(0,0,0,0.1)` | `--color-border` |

### Semantic Colors (Trust Levels)

| Level | Color | Usage |
|-------|-------|-------|
| Official | `#0A84FF` | 官方认证 |
| Verified | `#30D158` | 已验证 |
| Community | `#8E8E93` | 社区来源 |
| Unverified | `#FFD60A` | 未验证 |

---

## Typography

### Font Stack

```css
/* 系统字体栈 - macOS 原生 */
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
  "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;

/* 可选：科技感字体 */
--font-display: 'Space Grotesk', -apple-system, sans-serif;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `--text-xs` | 11px | 400 | 1.4 | 标签、元数据 |
| `--text-sm` | 13px | 400 | 1.5 | 小号正文、辅助信息 |
| `--text-base` | 15px | 400 | 1.6 | 正文 |
| `--text-lg` | 17px | 500 | 1.5 | 卡片标题 |
| `--text-xl` | 20px | 600 | 1.4 | 区块标题 |
| `--text-2xl` | 24px | 600 | 1.3 | 页面标题 |
| `--text-3xl` | 28px | 700 | 1.2 | 大标题 |

---

## Glassmorphism Effects

### Glass Surface Levels

```css
/* Level 1: 轻度毛玻璃 - 侧边栏、面板 */
.glass-light {
  background: rgba(44, 44, 46, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Level 2: 中度毛玻璃 - 卡片、模态框 */
.glass-medium {
  background: rgba(44, 44, 46, 0.85);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Level 3: 重度毛玻璃 - 浮层、下拉菜单 */
.glass-heavy {
  background: rgba(28, 28, 30, 0.92);
  backdrop-filter: blur(32px) saturate(220%);
  -webkit-backdrop-filter: blur(32px) saturate(220%);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}
```

### Light Mode Glass

```css
.light .glass-light {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.light .glass-medium {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.light .glass-heavy {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
```

---

## Spacing System

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | 紧凑间距 |
| `--space-2` | 8px | 组件内间距 |
| `--space-3` | 12px | 相关元素间距 |
| `--space-4` | 16px | 标准内间距 |
| `--space-5` | 20px | 中等间距 |
| `--space-6` | 24px | 区块间距 |
| `--space-8` | 32px | 大区块分隔 |
| `--space-10` | 40px | 章节间距 |
| `--space-12` | 48px | 大章节间距 |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | 小按钮、徽章、输入框 |
| `--radius-md` | 10px | 按钮、下拉菜单项 |
| `--radius-lg` | 14px | 卡片 |
| `--radius-xl` | 20px | 大卡片、模态框 |
| `--radius-full` | 9999px | 圆形元素 |

---

## Shadows

```css
/* 悬浮阴影 - macOS 风格 */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15);

/* 内阴影 - 用于按下状态 */
--shadow-inset: inset 0 1px 2px rgba(0, 0, 0, 0.15);

/* 发光阴影 - 用于强调 */
--shadow-glow-primary: 0 0 20px rgba(10, 132, 255, 0.3);
--shadow-glow-success: 0 0 20px rgba(48, 209, 88, 0.3);
```

---

## Animation System

### Timing Functions

```css
/* macOS 风格缓动函数 */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);      /* 快出慢停 */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);     /* 平滑减速 */
--ease-in-out-quart: cubic-bezier(0.76, 0, 0.24, 1); /* 平滑过渡 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);    /* 弹性效果 */
```

### Duration Scale

| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-instant` | 50ms | 即时反馈 |
| `--duration-fast` | 150ms | 按钮悬停、开关 |
| `--duration-normal` | 200ms | 卡片悬停、展开 |
| `--duration-slow` | 300ms | 页面切换、模态框 |
| `--duration-slower` | 400ms | 复杂动画 |

### Interactive Animations

```css
/* 1. 悬停抬起效果 - 卡片 */
.card {
  transition: transform var(--duration-fast) var(--ease-out-expo),
              box-shadow var(--duration-fast) var(--ease-out-expo);
}

.card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--shadow-lg);
}

/* 2. 按钮点击效果 */
.btn {
  transition: transform var(--duration-instant) var(--ease-out-quart),
              background-color var(--duration-fast) ease;
}

.btn:active {
  transform: scale(0.97);
}

/* 3. 毛玻璃模糊动画 */
.glass-panel {
  transition: backdrop-filter var(--duration-slow) var(--ease-out-expo),
              background-color var(--duration-slow) ease;
}

/* 4. 侧边栏展开/收起 */
.sidebar {
  transition: width var(--duration-slow) var(--ease-out-expo),
              opacity var(--duration-normal) ease;
}

/* 5. 列表项交错入场 */
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.list-item {
  animation: stagger-in var(--duration-normal) var(--ease-out-expo) backwards;
}

.list-item:nth-child(1) { animation-delay: 0ms; }
.list-item:nth-child(2) { animation-delay: 30ms; }
.list-item:nth-child(3) { animation-delay: 60ms; }
/* ... */

/* 6. 微妙的呼吸动画 - 加载状态 */
@keyframes breathe {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.loading {
  animation: breathe 2s ease-in-out infinite;
}

/* 7. 成功打勾动画 */
@keyframes checkmark {
  0% { stroke-dashoffset: 24; }
  100% { stroke-dashoffset: 0; }
}

.checkmark-path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: checkmark 0.3s var(--ease-out-expo) forwards;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Component Specifications

### Buttons

```css
/* Primary Button - macOS 风格 */
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-out-quart);
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-primary:active {
  transform: scale(0.97);
}

/* Secondary Button - 毛玻璃风格 */
.btn-secondary {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px);
  color: var(--color-text-primary);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-weight: 500;
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-out-quart);
  cursor: pointer;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--color-border-hover);
}

/* Ghost Button - 无背景 */
.btn-ghost {
  background: transparent;
  color: var(--color-text-secondary);
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 13px;
  transition: all var(--duration-fast) ease;
  cursor: pointer;
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}
```

### Cards

```css
/* Glass Card - 主要卡片样式 */
.card-glass {
  background: var(--color-bg-glass);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: var(--space-4);
  transition: all var(--duration-fast) var(--ease-out-expo);
  cursor: pointer;
}

.card-glass:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-lg);
}

/* Elevated Card - 浮起卡片 */
.card-elevated {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all var(--duration-fast) var(--ease-out-expo);
  cursor: pointer;
}

.card-elevated:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--shadow-lg);
}
```

### Sidebar

```css
/* macOS 风格侧边栏 */
.sidebar {
  background: var(--color-bg-glass);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid var(--color-border);
  width: 240px;
  padding: var(--space-3);
}

/* Sidebar Item */
.sidebar-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  transition: all var(--duration-fast) ease;
  cursor: pointer;
}

.sidebar-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

.sidebar-item.active {
  background: rgba(10, 132, 255, 0.15);
  color: var(--color-primary);
}
```

### Inputs

```css
/* Glass Input */
.input-glass {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  color: var(--color-text-primary);
  font-size: 13px;
  transition: all var(--duration-fast) ease;
}

.input-glass:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
}

.input-glass::placeholder {
  color: var(--color-text-tertiary);
}
```

### Modals

```css
/* Glass Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background: var(--color-bg-glass);
  backdrop-filter: blur(32px) saturate(200%);
  -webkit-backdrop-filter: blur(32px) saturate(200%);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  padding: var(--space-6);
  box-shadow: var(--shadow-xl);
  max-width: 480px;
  width: 90%;
  animation: modal-in var(--duration-slow) var(--ease-out-expo);
}

@keyframes modal-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```

### Badges

```css
/* Trust Badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 500;
}

.badge-official {
  background: rgba(10, 132, 255, 0.15);
  color: var(--color-primary);
}

.badge-verified {
  background: rgba(48, 209, 88, 0.15);
  color: var(--color-success);
}

.badge-community {
  background: rgba(142, 142, 147, 0.15);
  color: var(--color-text-secondary);
}
```

---

## Layout Patterns

### Main Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌─────────────────────────────────────────┐  │
│  │          │  │  ┌─────────────────────────────────┐    │  │
│  │ Sidebar  │  │  │         Top Bar                 │    │  │
│  │ (Glass)  │  │  └─────────────────────────────────┘    │  │
│  │          │  │                                           │  │
│  │  240px   │  │  ┌─────────────────────────────────┐    │  │
│  │          │  │  │                                 │    │  │
│  │          │  │  │      Main Content Area          │    │  │
│  │          │  │  │      (Card Grid / List)         │    │  │
│  │          │  │  │                                 │    │  │
│  │          │  │  └─────────────────────────────────┘    │  │
│  └──────────┘  └─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Z-Index Scale

| Level | Value | Usage |
|-------|-------|-------|
| `--z-base` | 0 | 默认内容 |
| `--z-elevated` | 10 | 悬浮卡片 |
| `--z-sticky` | 20 | 粘性头部 |
| `--z-sidebar` | 30 | 侧边栏 |
| `--z-overlay` | 40 | 遮罩层 |
| `--z-modal` | 50 | 模态框 |
| `--z-toast` | 60 | 通知 |

---

## Anti-Patterns (Do NOT Use)

### Visual Anti-Patterns

- ❌ **Emojis as icons** — 使用 SVG 图标 (Heroicons, Lucide, SF Symbols)
- ❌ **Flat backgrounds** — 使用毛玻璃或微妙渐变增加深度
- ❌ **Hard borders** — 使用半透明边框 `rgba(255,255,255,0.1)`
- ❌ **Pure black/white** — 使用带有色调的灰度色

### Interaction Anti-Patterns

- ❌ **Missing cursor:pointer** — 所有可点击元素必须有 cursor:pointer
- ❌ **Layout-shifting hovers** — 避免使用 scale 导致布局偏移
- ❌ **Instant state changes** — 必须使用过渡动画 (150-300ms)
- ❌ **Invisible focus states** — 焦点状态必须可见
- ❌ **Animations without reduced-motion** — 必须尊重 prefers-reduced-motion

### Accessibility Anti-Patterns

- ❌ **Low contrast text** — 文字对比度至少 4.5:1
- ❌ **Color-only indicators** — 不能仅用颜色表示状态
- ❌ **Missing alt text** — 图片必须有 alt 属性
- ❌ **Missing form labels** — 表单必须有 label

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

### Visual Quality
- [ ] No emojis used as icons (use SVG: Lucide/Heroicons/SF Symbols)
- [ ] Glassmorphism applied correctly (blur + saturation + border)
- [ ] Consistent border-radius usage
- [ ] Proper shadow depth hierarchy

### Interaction
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-200ms)
- [ ] Active states with scale feedback
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected

### Accessibility
- [ ] Text contrast 4.5:1 minimum
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] Color is not the only indicator
- [ ] Keyboard navigation works

### Performance
- [ ] No layout thrashing
- [ ] CSS animations use transform/opacity only
- [ ] Backdrop-filter used sparingly
- [ ] Images optimized (WebP, lazy loading)

---

## CSS Variables Summary

```css
:root {
  /* Colors - Dark Mode */
  --color-bg-base: #1C1C1E;
  --color-bg-elevated: #2C2C2E;
  --color-bg-glass: rgba(44, 44, 46, 0.72);
  --color-primary: #0A84FF;
  --color-primary-hover: #409CFF;
  --color-success: #30D158;
  --color-warning: #FFD60A;
  --color-error: #FF453A;
  --color-text-primary: #F5F5F7;
  --color-text-secondary: #A1A1A6;
  --color-text-tertiary: #636366;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-border-hover: rgba(255, 255, 255, 0.2);

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  --font-mono: 'SF Mono', Menlo, Monaco, monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;

  /* Animation */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* Z-Index */
  --z-base: 0;
  --z-elevated: 10;
  --z-sticky: 20;
  --z-sidebar: 30;
  --z-overlay: 40;
  --z-modal: 50;
  --z-toast: 60;
}

/* Light Mode */
.light {
  --color-bg-base: #F5F5F7;
  --color-bg-elevated: #FFFFFF;
  --color-bg-glass: rgba(255, 255, 255, 0.72);
  --color-primary: #007AFF;
  --color-text-primary: #1D1D1F;
  --color-text-secondary: #86868B;
  --color-border: rgba(0, 0, 0, 0.1);
}
```

---

*Document Version: 2.0*
*Style: Glassmorphism + macOS Native*
*Last Updated: 2026-04-26*
