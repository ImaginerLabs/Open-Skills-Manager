# iCloud 同步架构

## 概述

iCloud 同步使用 iCloud Drive 目录同步机制，基于文件系统实现多设备数据一致性。

## 核心组件

### 后端 (Rust)

| 模块 | 职责 |
|------|------|
| `storage/conflict.rs` | 冲突数据类型定义 (`ConflictType`, `ConflictStatus`, `ConflictRecord`, `SkillInfo`) |
| `storage/conflict_store.rs` | 冲突记录持久化 (读写 `conflicts.json`) |
| `services/icloud_bridge.rs` | Hash 计算、冲突检测、解决逻辑 |
| `commands/sync.rs` | 同步流程控制、客户端身份管理 |

### 前端 (React)

| 模块 | 职责 |
|------|------|
| `hooks/useOfflineSync.ts` | 冲突状态管理、轮询同步状态 |
| `components/features/ConflictDialog/` | 冲突解决 UI 弹窗 |
| `pages/Library/Library.tsx` | 冲突提示横幅和入口 |

## 数据流

```
用户操作 → sync_library() → 检测冲突 → 记录到 conflicts.json
                                    ↓
                          前端 get_conflicts() → 显示 UI
                                    ↓
                          用户选择 → resolve_conflict() → 执行解决
                                    ↓
                          更新冲突状态 → 触发重新同步
```

## 冲突检测流程

1. **Hash 计算**: 对每个技能的 `SKILL.md` 计算 SHA256 hash
2. **缓存机制**: 基于 mtime 的 hash 缓存，TTL 5 分钟
3. **对比逻辑**:
   - 本地和远程都存在
   - hash 不同
   - 两边都在上次同步后修改过

## 冲突解决策略

| 策略 | 行为 | 适用场景 |
|------|------|----------|
| `local` | 保留本地版本，推送到 iCloud | 本地修改更重要 |
| `remote` | 保留远程版本，拉取到本地 | 远程修改更重要 |
| `both` | 创建远程版本副本，本地保留 | 需要手动合并 |

## 性能优化

- **Hash 缓存**: 基于 mtime，TTL 5 分钟
- **轮询间隔**: 5 秒
- **防抖时间**: 2 秒
- **增量检测**: 只检测有变化的技能

## 存储结构

```
~/.claude-skills-manager/
├── library/              # 本地技能库
├── metadata/
│   └── conflicts.json    # 冲突记录
└── sync-state.json       # 同步状态

~/Library/Mobile Documents/iCloud~com~claude~skills~manager/
├── library/              # iCloud 技能库
└── deployments.json      # 部署记录
```

## 错误处理

- iCloud 不可用时回退到本地缓存
- 冲突解决失败时保留原状态
- 网络超时时显示离线状态
