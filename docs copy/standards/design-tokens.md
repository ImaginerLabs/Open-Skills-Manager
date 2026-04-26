# 设计令牌规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 颜色系统

### macOS 系统色

| 名称 | 浅色模式 | 深色模式 | 用途 |
|------|----------|----------|------|
| Primary | #007AFF | #0A84FF | 主色调、链接、按钮 |
| Success | #34C759 | #30D158 | 成功状态、已验证 |
| Warning | #FF9500 | #FFD60A | 警告、待更新 |
| Error | #FF3B30 | #FF453A | 错误、危险操作 |

### 语义色

| 令牌 | 浅色模式 | 深色模式 | 用途 |
|------|----------|----------|------|
| `--color-bg-primary` | #FFFFFF | #1E1E1E | 主背景 |
| `--color-bg-secondary` | #F5F5F7 | #2C2C2E | 侧边栏 |
| `--color-bg-tertiary` | #FFFFFF | #3A3A3C | 卡片 |
| `--color-text-primary` | #1D1D1F | #F5F5F7 | 主文字 |
| `--color-text-secondary` | #86868B | #A1A1A6 | 次要文字 |
| `--color-border-primary` | #D2D2D7 | #3A3A3C | 边框 |

### 信任颜色

| 等级 | 颜色 | 用途 |
|------|------|------|
| Official | #007AFF | 官方认证 |
| Verified | #34C759 | 已验证贡献者 |
| Community | #8E8E93 | 社区来源 |
| Unverified | #FF9500 | 未验证来源 |

---

## 间距系统

基于 4px 基准单位：

| 令牌 | 值 | Tailwind 类 | 用途 |
|------|---|-------------|------|
| `--space-1` | 4px | `p-1` | 紧凑间距 |
| `--space-2` | 8px | `p-2` | 组件内间距 |
| `--space-3` | 12px | `p-3` | 相关元素间距 |
| `--space-4` | 16px | `p-4` | 标准内间距 |
| `--space-6` | 24px | `p-6` | 区块间距 |
| `--space-8` | 32px | `p-8` | 大区块分隔 |

---

## 字体系统

```css
/* 字体栈 */
--font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
  "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
--font-mono: 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
```

| 令牌 | 大小 | 行高 | 用途 |
|------|------|------|------|
| `--text-xs` | 11px | 1.4 | 标签、元数据 |
| `--text-sm` | 13px | 1.5 | 小号正文 |
| `--text-base` | 15px | 1.6 | 正文 |
| `--text-lg` | 17px | 1.5 | 卡片标题 |
| `--text-xl` | 20px | 1.4 | 页面标题 |

---

## 圆角系统

| 令牌 | 值 | 用途 |
|------|---|------|
| `--radius-sm` | 4px | 小按钮、徽章 |
| `--radius-md` | 8px | 按钮 |
| `--radius-lg` | 12px | 卡片、模态框 |
| `--radius-full` | 9999px | 圆形头像 |

---

## 阴影系统

| 令牌 | 值 | 用途 |
|------|---|------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.04)` | 微阴影 |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` | 卡片悬浮 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.12)` | 模态框 |

---

## 动画时长

| 类型 | 时长 | 用途 |
|------|------|------|
| 快速 | 150ms | 按钮悬停 |
| 标准 | 200ms | 卡片悬停、面板展开 |
| 慢速 | 300ms | 页面切换、模态框 |

---

## TailwindCSS v4 配置

```css
@import "tailwindcss";

@theme {
  /* 颜色 */
  --color-primary: #007AFF;
  --color-success: #34C759;
  --color-warning: #FF9500;
  --color-error: #FF3B30;

  /* 信任颜色 */
  --color-source-official: #007AFF;
  --color-source-verified: #34C759;
  --color-source-community: #8E8E93;
  --color-source-unverified: #FF9500;

  /* 文字色 */
  --color-text-primary: #1D1D1F;
  --color-text-secondary: #86868B;

  /* 圆角 */
  --radius-card: 12px;
  --radius-button: 8px;
  --radius-input: 6px;

  /* 动画 */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
}

.dark {
  --color-primary: #0A84FF;
  --color-text-primary: #F5F5F7;
  --color-text-secondary: #A1A1A6;
}
```
