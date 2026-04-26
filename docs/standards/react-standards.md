# React 开发规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 函数组件优先

```tsx
// ✅ 正确: 函数组件
export function SkillCard({ skill, onInstall }: SkillCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="skill-card">
      <h3>{skill.name}</h3>
      <button onClick={() => onInstall?.(skill.id)}>Install</button>
    </div>
  );
}

// ❌ 错误: 类组件 (除非 Error Boundary)
class SkillCard extends React.Component<SkillCardProps> {
  render() {
    return <div>...</div>;
  }
}
```

---

## Hooks 规范

### 顶层调用

```tsx
// ✅ 正确: Hooks 顶层调用
export function SkillList(): JSX.Element {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  // ...
}

// ❌ 错误: 条件调用 Hooks
if (shouldLoad) {
  const [skills, setSkills] = useState([]); // 违反 Hooks 规则
}
```

### 依赖数组

```tsx
// ✅ 正确: 完整的依赖数组
export function useSkills(scope?: SkillScope): UseSkillsResult {
  const loadSkills = useCallback(async () => {
    const result = await ipcService.invoke<Skill[]>('skill:list', { scope });
    // 处理结果...
  }, [scope]); // scope 必须在依赖中

  useEffect(() => {
    loadSkills();
  }, [loadSkills]); // loadSkills 必须在依赖中

  return { skills: [], isLoading: false, error: null, reload: loadSkills };
}

// ❌ 错误: 缺少依赖
useEffect(() => {
  loadSkills();
}, []); // 缺少 loadSkills 依赖
```

---

## Props 规范

```tsx
// ✅ 正确: 明确的 Props 接口 + 默认值
export interface SkillCardProps {
  /** 技能数据 */
  skill: Skill;
  /** 安装回调 */
  onInstall?: (skillId: string) => void;
  /** 是否显示信任徽章，默认 true */
  showTrustBadge?: boolean;
  /** 卡片状态，默认 'default' */
  status?: 'default' | 'installing' | 'installed' | 'error';
}

export function SkillCard({
  skill,
  onInstall,
  showTrustBadge = true,
  status = 'default',
}: SkillCardProps): JSX.Element {
  // ...
}

// ❌ 错误: Props 解构无默认值
export function SkillCard({ skill, showTrustBadge }: SkillCardProps) {
  // showTrustBadge 可能是 undefined
}
```

---

## State 规范

```tsx
// ✅ 正确: 状态最小化
export function SkillCard({ skill }: SkillCardProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  // 派生状态直接计算，不存储
  const statusText = skill.status === 'enabled' ? '已启用' : '已禁用';
  return <div>{/* ... */}</div>;
}

// ❌ 错误: 冗余状态
const [isExpanded, setIsExpanded] = useState(false);
const [isCollapsed, setIsCollapsed] = useState(true); // 冗余

// ❌ 错误: 可派生的状态
const [statusText, setStatusText] = useState('');
useEffect(() => {
  setStatusText(skill.status === 'enabled' ? '已启用' : '已禁用');
}, [skill.status]);
```

---

## 组件拆分时机

行数是参考指标，优先考虑逻辑复杂度和可维护性：

| 场景 | 条件 |
|------|------|
| 代码行数 | 组件超过 300 行且逻辑复杂 |
| 逻辑独立 | 有独立的业务逻辑块 |
| 视觉边界 | 有明显的 UI 边界（Header/Footer 等） |
| 复用需求 | 多处使用相同 UI |
| 状态独立 | 有独立的内部状态管理 |

### 不拆分的情况

- 单一职责，逻辑连贯
- 无复用需求
- 拆分后反而增加理解成本

### 拆分示例

```tsx
// ❌ 错误: 单个巨型组件
export function SkillCard({ skill }: SkillCardProps): JSX.Element {
  // 500 行代码...
}

// ✅ 正确: 按职责拆分
export function SkillCard({ skill }: SkillCardProps): JSX.Element {
  return (
    <article className="skill-card">
      <SkillCardHeader skill={skill} />
      <SkillCardBody skill={skill} />
      <SkillCardFooter skill={skill} />
    </article>
  );
}
```

---

## 避免 Prop Drilling

```tsx
// ❌ 错误: Prop Drilling (传递了 3 层)
export function SkillCard({ skill, onInstall }: SkillCardProps) {
  return <SkillCardHeader skill={skill} onInstall={onInstall} />;
}
function SkillCardHeader({ skill, onInstall }) {
  return <SkillCardActions skill={skill} onInstall={onInstall} />;
}
function SkillCardActions({ skill, onInstall }) {
  return <Button onClick={onInstall}>Install</Button>;
}

// ✅ 正确: 使用 Zustand Store
function SkillCardActions({ skill }: { skill: Skill }) {
  const installSkill = useSkillStore((state) => state.installSkill);
  return <Button onClick={() => installSkill(skill.id)}>Install</Button>;
}
```

---

## 前端调试

React 组件调试方法，参考 [调试规范](./debugging-standards.md)：

- **WebView DevTools**: 使用 `window.open_devtools()` 检查组件 DOM 和状态
- **React DevTools**: 安装 React DevTools 浏览器扩展检查组件树
- **CrabNebula DevTools**: 追踪 IPC 调用和事件响应
