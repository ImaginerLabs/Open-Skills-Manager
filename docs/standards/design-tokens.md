# 设计令牌规范

**版本:** 2.0
**最后更新:** 2026-04-26
**风格:** Glassmorphism + macOS Native + Modern Tech

> **设计系统源文件:** `design-system/claude-code-skills-manager/MASTER.md`
> 页面特定规则存放在 `design-system/pages/[page-name].md`

---

## 设计哲学

1. **macOS Native Feel** - 遵循 macOS 设计语言，毛玻璃、圆角、微妙阴影
2. **High Information Density** - 每个元素都有其存在价值
3. **Fluid Interactions** - 流畅的交互动画，响应迅速
4. **Dark-First** - 以深色模式为主，浅色模式为辅

---

## 颜色系统

### 主色调 (Dark Mode - 默认)

| 令牌 | Hex | 用途 |
|------|-----|------|
| `--color-bg-base` | `#1C1C1E` | 主背景 |
| `--color-bg-elevated` | `#2C2C2E` | 侧边栏、面板 |
| `--color-bg-glass` | `rgba(44,44,46,0.72)` | 毛玻璃表面 |
| `--color-primary` | `#0A84FF` | 主色调、链接 |
| `--color-primary-hover` | `#409CFF` | 主色调悬停 |
| `--color-success` | `#30D158` | 成功状态、CTA |
| `--color-warning` | `#FFD60A` | 警告 |
| `--color-error` | `#FF453A` | 错误 |
| `--color-text-primary` | `#F5F5F7` | 主文字 |
| `--color-text-secondary` | `#A1A1A6` | 次要文字 |
| `--color-text-tertiary` | `#636366` | 辅助文字 |
| `--color-border` | `rgba(255,255,255,0.1)` | 边框 |
| `--color-border-hover` | `rgba(255,255,255,0.2)` | 边框悬停 |

### 浅色模式

| 令牌 | Hex |
|------|-----|
| `--color-bg-base` | `#F5F5F7` |
| `--color-bg-elevated` | `#FFFFFF` |
| `--color-bg-glass` | `rgba(255,255,255,0.72)` |
| `--color-primary` | `#007AFF` |
| `--color-text-primary` | `#1D1D1F` |
| `--color-text-secondary` | `#86868B` |
| `--color-border` | `rgba(0,0,0,0.1)` |

### 信任颜色

| 等级 | 颜色 | 用途 |
|------|------|------|
| Official | `#0A84FF` | 官方认证 |
| Verified | `#30D158` | 已验证贡献者 |
| Community | `#8E8E93` | 社区来源 |
| Unverified | `#FFD60A` | 未验证来源 |

---

## 毛玻璃效果

### 三级深度

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

---

## 字体系统

### 字体栈

```css
/* 系统字体栈 - macOS 原生 */
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
  "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
```

### 字号规范

| 令牌 | 大小 | 行高 | 用途 |
|------|------|------|------|
| `--text-xs` | 11px | 1.4 | 标签、元数据 |
| `--text-sm` | 13px | 1.5 | 小号正文 |
| `--text-base` | 15px | 1.6 | 正文 |
| `--text-lg` | 17px | 1.5 | 卡片标题 |
| `--text-xl` | 20px | 1.4 | 页面标题 |

---

## 间距系统

基于 4px 基准单位：

| 令牌 | 值 | 用途 |
|------|---|------|
| `--space-1` | 4px | 紧凑间距 |
| `--space-2` | 8px | 组件内间距 |
| `--space-3` | 12px | 相关元素间距 |
| `--space-4` | 16px | 标准内间距 |
| `--space-6` | 24px | 区块间距 |
| `--space-8` | 32px | 大区块分隔 |

---

## 圆角系统

| 令牌 | 值 | 用途 |
|------|---|------|
| `--radius-sm` | 6px | 小按钮、徽章、输入框 |
| `--radius-md` | 10px | 按钮、下拉菜单项 |
| `--radius-lg` | 14px | 卡片 |
| `--radius-xl` | 20px | 大卡片、模态框 |
| `--radius-full` | 9999px | 圆形头像 |

---

## 阴影系统

```css
/* macOS 风格阴影 */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 12px 28px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 20px 40px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15);

/* 发光阴影 */
--shadow-glow-primary: 0 0 20px rgba(10, 132, 255, 0.3);
--shadow-glow-success: 0 0 20px rgba(48, 209, 88, 0.3);
```

---

## 动画系统

### 缓动函数

```css
/* macOS 风格缓动 */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);      /* 快出慢停 */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);     /* 平滑减速 */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);    /* 弹性效果 */
```

### 时长规范

| 类型 | 时长 | 用途 |
|------|------|------|
| `--duration-fast` | 150ms | 按钮悬停、开关 |
| `--duration-normal` | 200ms | 卡片悬停、展开 |
| `--duration-slow` | 300ms | 页面切换、模态框 |

### 交互动画

```css
/* 1. 悬停抬起效果 */
.card:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: var(--shadow-lg);
}

/* 2. 按钮点击效果 */
.btn:active {
  transform: scale(0.97);
}

/* 3. 列表项交错入场 */
@keyframes stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Z-Index 层级

| 层级 | 值 | 用途 |
|------|---|------|
| `--z-base` | 0 | 默认内容 |
| `--z-elevated` | 10 | 悬浮卡片 |
| `--z-sticky` | 20 | 粘性头部 |
| `--z-sidebar` | 30 | 侧边栏 |
| `--z-overlay` | 40 | 遮罩层 |
| `--z-modal` | 50 | 模态框 |
| `--z-toast` | 60 | 通知 |

---

## CSS 变量完整定义

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

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 禁止使用的模式

- ❌ **Emoji 作为图标** — 使用 SVG 图标 (Lucide, Heroicons, SF Symbols)
- ❌ **纯色背景** — 使用毛玻璃或微妙渐变增加深度
- ❌ **硬边框** — 使用半透明边框 `rgba(255,255,255,0.1)`
- ❌ **缺少 cursor:pointer** — 所有可点击元素必须有
- ❌ **布局偏移的悬停** — 避免 scale 导致布局跳动
- ❌ **即时状态变化** — 必须使用过渡动画 (150-300ms)
- ❌ **低对比度文字** — 对比度至少 4.5:1

---

## 交付前检查清单

- [ ] 无 emoji 图标（使用 SVG）
- [ ] 毛玻璃效果正确应用
- [ ] 所有可点击元素有 `cursor-pointer`
- [ ] 悬停状态有平滑过渡
- [ ] 焦点状态可见
- [ ] 尊重 `prefers-reduced-motion`
- [ ] 文字对比度 ≥ 4.5:1
- [ ] 响应式：375px, 768px, 1024px, 1440px
