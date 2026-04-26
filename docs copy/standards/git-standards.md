# Git 规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## Type 类型

| Type | 描述 | 示例 |
|------|------|------|
| `feat` | 新功能 | feat(skill): add batch install feature |
| `fix` | Bug 修复 | fix(ipc): handle timeout correctly |
| `docs` | 文档更新 | docs: update README |
| `style` | 代码格式 | style: format with prettier |
| `refactor` | 重构 | refactor(store): simplify state logic |
| `perf` | 性能优化 | perf(list): virtualize skill list |
| `test` | 测试 | test(skill): add unit tests |
| `chore` | 杂项 | chore: update dependencies |

---

## Scope 示例

| Scope | 描述 |
|-------|------|
| `skill` | 技能管理模块 |
| `search` | 搜索模块 |
| `ipc` | IPC 通信 |
| `ui` | UI 组件 |
| `store` | 状态管理 |
| `translate` | 翻译服务 |

---

## 分支命名

| 分支类型 | 命名格式 | 示例 |
|----------|----------|------|
| 主分支 | `main` | main |
| 功能分支 | `feat/<feature-name>` | feat/batch-install |
| 修复分支 | `fix/<bug-name>` | fix/ipc-timeout |
| 发布分支 | `release/<version>` | release/v1.0.0 |

---

## PR 规范

### 标题格式

```
<type>(<scope>): <short description>
```

### PR 模板

```markdown
### 变更类型
- [ ] feat: 新功能
- [ ] fix: Bug 修复
- [ ] refactor: 重构
- [ ] docs: 文档

### 变更描述
<!-- 描述此 PR 的变更内容 -->

### 关联 Issue
<!-- Closes #xxx -->

### 测试计划
- [ ] 单元测试通过
- [ ] 本地手动测试通过
```
