# 组件库复用规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 优先级顺序

1. **shadcn/ui 组件** - 优先使用，已适配项目设计系统
2. **Radix UI 原语** - shadcn/ui 不满足时，直接使用 Radix UI
3. **自定义组件** - 以上都不满足时，自行实现

---

## 常用组件映射

| 需求 | shadcn/ui 组件 | 路径 |
|------|----------------|------|
| 按钮 | Button | `@/components/ui/button` |
| 输入框 | Input | `@/components/ui/input` |
| 对话框 | Dialog | `@/components/ui/dialog` |
| 下拉菜单 | DropdownMenu | `@/components/ui/dropdown-menu` |
| 徽章 | Badge | `@/components/ui/badge` |
| 进度条 | Progress | `@/components/ui/progress` |
| 开关 | Switch | `@/components/ui/switch` |
| 标签页 | Tabs | `@/components/ui/tabs` |
| 提示框 | Tooltip | `@/components/ui/tooltip` |
| 滚动区域 | ScrollArea | `@/components/ui/scroll-area` |
| 分隔线 | Separator | `@/components/ui/separator` |
| 骨架屏 | Skeleton | `@/components/ui/skeleton` |
| 弹出框 | Popover | `@/components/ui/popover` |
| 选择器 | Select | `@/components/ui/select` |
| 复选框 | Checkbox | `@/components/ui/checkbox` |

---

## 使用规范

### 禁止重复造轮子

```tsx
// ❌ 错误: 自定义 Button 组件
export function Button({ children, onClick }) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ 正确: 使用 shadcn/ui Button
import { Button } from '@/components/ui/button';

<Button variant="default" size="sm" onClick={handleClick}>
  Install
</Button>
```

### 通过 Props 扩展

```tsx
// ❌ 错误: 复制 shadcn/ui Button 并修改
export function CustomButton({ ... }) {
  // 复制了大量代码...
}

// ✅ 正确: 通过 className 扩展
import { Button } from '@/components/ui/button';

<Button className="bg-macos-green hover:bg-macos-green/90">
  Confirm
</Button>
```

---

## 组合模式

```tsx
// ✅ 正确: 组合模式构建复杂组件
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function InstallDialog({ open, onOpenChange, skill, onConfirm }: InstallDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Install {skill.name}?</DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p>This will install {skill.name} to your skills directory.</p>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={onConfirm}>Install</Button>
      </DialogFooter>
    </Dialog>
  );
}
```

---

## 组件分类

| 类型 | 目录 | 特征 |
|------|------|------|
| **UI 基础组件** | `components/ui/` | shadcn/ui 组件，无业务逻辑 |
| **通用组件** | `components/common/` | 可复用，无业务逻辑 |
| **布局组件** | `components/layout/` | 页面结构，无业务逻辑 |
| **功能组件** | `components/features/` | 业务逻辑，特定功能 |
| **图标组件** | `components/icons/` | SVG 图标封装 |

### 放置决策

```
是否是 shadcn/ui 组件？
├── 是 → components/ui/
└── 否 → 是否是 SVG 图标封装？
    ├── 是 → components/icons/
    └── 否 → 是否有业务逻辑？
        ├── 否 → 是否是页面结构？
        │   ├── 是 → components/layout/
        │   └── 否 → components/common/
        └── 是 → components/features/
```
