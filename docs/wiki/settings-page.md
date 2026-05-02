# Settings 页面 Wiki

## 1. 页面基础信息

| 属性 | 值 |
|------|------|
| **页面名称** | Settings |
| **路由路径** | `/settings` |
| **主要功能** | 管理应用设置，包括主题、iCloud 同步、自动更新、数据目录访问、恢复出厂设置 |
| **源文件** | `src/pages/Settings/Settings.tsx` |

---

## 2. 初始化加载链路

### 链路名称：页面初始化加载

**触发条件**：组件挂载

**执行步骤**：

1. **应用信息加载** (useEffect)
   - 调用 `getVersion()` 获取应用版本
   - 调用 `getName()` 获取应用名称
   - 设置 `appVersion` 和 `appName` 状态

2. **iCloud 同步状态初始化** (useIcloudSync hook)
   - 调用 `refresh()` 获取同步状态
   - 并行请求 4 个接口：
     - `storageService.getSyncState()` - 获取同步状态
     - `storageService.getSyncStatus()` - 获取同步状态信息
     - `storageService.isICloudAvailable()` - 检查 iCloud 可用性
     - `icloudService.containerPath()` - 获取容器路径
   - 启动 5 秒轮询定时器持续刷新状态

3. **自动更新初始化** (useAutoUpdate hook)
   - 调用 `getVersion()` 和 `getName()` 获取应用信息
   - 如果 `autoUpdateCheck` 为 true，延迟 5 秒后执行首次自动检查
   - 启动 4 小时间隔的定时检查

**数据流转**：

```
组件挂载
    │
    ├─→ Tauri API (getVersion/getName)
    │       └─→ 设置 appVersion/appName 状态
    │
    ├─→ useIcloudSync.refresh()
    │       ├─→ storageService.getSyncState()
    │       ├─→ storageService.getSyncStatus()
    │       ├─→ storageService.isICloudAvailable()
    │       └─→ icloudService.containerPath()
    │               └─→ 设置 syncState/syncStatusInfo/icloudAvailable/containerPath
    │
    └─→ useAutoUpdate (自动检查)
            └─→ checkForUpdate()
                    └─→ 设置 updateInfo 状态
```

**异常处理**：

- 应用信息加载失败时设置默认值 (`'Unknown'` / `'Claude Code Skills Manager'`)
- iCloud 同步错误设置 `error` 状态，页面显示错误提示
- 自动更新检查失败静默处理，仅在手动检查时显示错误

---

## 3. 核心业务操作链路

### 3.1 iCloud 同步链路

**链路名称**：iCloud 强制同步

**触发条件**：用户点击 "Force Sync Now" 按钮

**执行步骤**：

1. 用户点击按钮触发 `handleForceSync`
2. 调用 `forceSync()` (来自 useIcloudSync hook)
3. `forceSync` 内部：
   - 设置 `isLoading = true`
   - 调用 `storageService.forceSync()` (IPC: `storage_sync_force`)
   - 同步完成后刷新状态
   - 设置 `isLoading = false`
4. 成功后显示 success toast

**数据流转**：

```
handleForceSync()
    │
    └─→ forceSync()
            │
            ├─→ setIsLoading(true)
            │
            ├─→ storageService.forceSync()
            │       └─→ IPC: storage_sync_force
            │               └─→ Rust 后端执行 iCloud 同步
            │
            ├─→ Promise.all([
            │       storageService.getSyncState(),
            │       storageService.getSyncStatus()
            │   ])
            │       └─→ 更新 syncState/syncStatusInfo 状态
            │
            └─→ setIsLoading(false)

showToast('success', 'Sync completed successfully')
```

---

### 3.2 打开数据目录链路

**链路名称**：打开数据目录

**触发条件**：用户点击 "Open in Finder" 按钮

**执行步骤**：

1. 用户点击按钮触发 `handleOpenDataDir`
2. 调用 `configService.getAppDataPath()` 获取应用数据路径
   - IPC: `config_app_data_path`
   - 返回: `~/Library/Application Support/OpenSkillsManager/`
3. 调用 `configService.openPath(path)` 在 Finder 中打开路径
   - IPC: `config_open_path`

**数据流转**：

```
handleOpenDataDir()
    │
    ├─→ configService.getAppDataPath()
    │       └─→ IPC: config_app_data_path
    │               └─→ 返回应用数据目录路径
    │
    └─→ configService.openPath(path)
            └─→ IPC: config_open_path
                    └─→ 调用 macOS API 在 Finder 中打开目录
```

---

### 3.3 恢复出厂设置链路

**链路名称**：恢复出厂设置

**触发条件**：用户点击 "Reset to Defaults" 按钮

**执行步骤**：

1. 用户点击按钮触发 `handleResetToDefaults`
2. 显示确认对话框 (`showConfirmDialog`)
3. 用户确认后执行重置：
   - 调用 `storageService.resetToDefaults()` (IPC: `storage_reset_to_defaults`)
   - 重置所有前端 stores
   - 调用 `refreshAll()` 刷新侧边栏显示空状态
4. 显示成功 toast

**数据流转**：

```
handleResetToDefaults()
    │
    └─→ showConfirmDialog({ ... })
            │
            └─→ onConfirm: async () => {
                    │
                    ├─→ storageService.resetToDefaults()
                    │       └─→ IPC: storage_reset_to_defaults
                    │               ├─→ 清除配置文件
                    │               ├─→ 清除 Library 数据
                    │               ├─→ 清除同步状态
                    │               └─→ 清除 iCloud 数据
                    │
                    ├─→ 重置 settingsStore
                    │       ├─→ setTheme('system')
                    │       └─→ setLanguage('auto')
                    │
                    ├─→ 重置 libraryStore
                    │       ├─→ setSkills([])
                    │       ├─→ setGroups([])
                    │       ├─→ selectGroup(undefined)
                    │       └─→ selectCategory(undefined)
                    │
                    ├─→ 重置 globalStore
                    │       └─→ setSkills([])
                    │
                    ├─→ 重置 projectStore
                    │       ├─→ setProjects([])
                    │       └─→ selectProject(null)
                    │
                    ├─→ 重置 ideStore
                    │       └─→ reset()
                    │
                    └─→ refreshAll()
                            └─→ 刷新侧边栏数据

                    showToast('success', 'All data has been reset...')
                }
```

---

### 3.4 自动更新链路

**链路名称**：自动更新检查与安装

**触发条件**：
- 自动：应用启动后 5 秒（如果 `autoUpdateCheck` 为 true）
- 手动：用户点击 "Check Now" 按钮

**执行步骤**：

**检查更新**：
1. 调用 `checkForUpdates()` (手动) 或 `performAutoCheck()` (自动)
2. 调用 `checkForUpdate()` 函数
   - 使用 `@tauri-apps/plugin-updater` 的 `check()` 方法
3. 如果有更新，设置 `updateInfo` 状态
4. 显示 toast 通知用户

**下载安装**：
1. 用户点击 "Download & Install" 按钮
2. 显示确认对话框
3. 用户确认后调用 `downloadAndInstall()`
4. 调用 `downloadAndInstallUpdate()` 函数
5. 下载完成后自动重启应用 (`relaunch()`)

**数据流转**：

```
checkForUpdates()
    │
    └─→ checkForUpdate()
            │
            └─→ check() [Tauri updater plugin]
                    │
                    ├─→ 有更新
                    │       └─→ return { available: true, latestVersion, ... }
                    │
                    └─→ 无更新
                            └─→ return null

downloadAndInstall()
    │
    └─→ showConfirmDialog({ ... })
            │
            └─→ onConfirm: async () => {
                    │
                    └─→ downloadAndInstallUpdate((progress) => {
                            setDownloadProgress(progress)
                        })
                            │
                            └─→ update.downloadAndInstall()
                                    │
                                    └─→ relaunch() [重启应用]
                }
```

---

### 3.5 主题切换链路

**链路名称**：主题切换

**触发条件**：用户在主题下拉框中选择新主题

**执行步骤**：

1. 用户选择主题触发 `onChange` 事件
2. 调用 `setTheme(e.target.value)`
3. `setTheme` 内部：
   - 更新本地状态 `theme`
   - 调用 `storageService.setSettings()` 同步到后端

**数据流转**：

```
<select onChange={(e) => setTheme(e.target.value)}>
    │
    └─→ setTheme('light' | 'dark' | 'system')
            │
            ├─→ set({ theme }) [Zustand 状态更新]
            │
            └─→ storageService.setSettings(buildBackendSettings(...))
                    │
                    └─→ IPC: storage_config_set_settings
                            └─→ Rust 后端保存到配置文件
```

---

## 4. 组件结构

```
Settings (页面组件)
├── header
│   └── titleSection
│       ├── h1.title - "Settings"
│       └── span.subtitle - "Manage application preferences"
│
└── content
    ├── section (Appearance)
    │   ├── sectionHeader - PaintBrush icon + "Appearance"
    │   └── settingRow (Theme)
    │       ├── settingLabel - "Theme" + description
    │       └── settingValue - select dropdown
    │
    ├── ICloudSettings (子组件)
    │   ├── sectionHeader - "iCloud Sync"
    │   ├── statusContainer
    │   │   ├── statusRow - 状态指示器 + 最后同步时间
    │   │   ├── infoBox - 同步范围说明
    │   │   ├── errorMessage (条件渲染)
    │   │   └── actions
    │   │       ├── Force Sync Now 按钮
    │   │       └── View in Finder 按钮
    │
    └── section (About)
        ├── sectionHeader - Gear icon + "About"
        ├── settingRow (Version)
        ├── settingRow (Auto Check for Updates)
        ├── settingRow (Update Available) - 条件渲染
        ├── settingRow (Check for Updates) - 条件渲染
        ├── settingRow (Storage Usage)
        ├── settingRow (Data Directory)
        └── settingRow (Factory Reset) - 危险按钮
```

---

## 5. 数据流

### Store 依赖关系

| Store | 用途 | 持久化位置 | 在 Settings 页面的使用 |
|-------|------|-----------|----------------------|
| `settingsStore` | 应用设置 | localStorage + 后端配置文件 | 读取/设置 theme, language, autoUpdateCheck |
| `uiStore` | UI 状态 | localStorage (viewMode) | showToast, showConfirmDialog |
| `libraryStore` | Library 数据 | localStorage (groups) | 恢复出厂设置时清空 |
| `globalStore` | Global 技能 | 无 | 恢复出厂设置时清空 |
| `projectStore` | 项目数据 | localStorage (projects) | 恢复出厂设置时清空 |
| `ideStore` | IDE 配置 | 无 | 恢复出厂设置时重置 |

### Service 调用关系

```
Settings 页面
    │
    ├── configService
    │   ├── getAppDataPath() → IPC: config_app_data_path
    │   └── openPath() → IPC: config_open_path
    │
    ├── storageService
    │   ├── getConfig() → IPC: storage_config_get
    │   ├── setSettings() → IPC: storage_config_set_settings
    │   ├── getSyncState() → IPC: storage_sync_state
    │   ├── getSyncStatus() → IPC: storage_sync_status
    │   ├── isICloudAvailable() → IPC: storage_icloud_available
    │   ├── forceSync() → IPC: storage_sync_force
    │   ├── ensureICloudPath() → IPC: storage_ensure_icloud_path
    │   └── resetToDefaults() → IPC: storage_reset_to_defaults
    │
    ├── icloudService
    │   └── containerPath() → IPC: icloud_container_path
    │
    └── updateService (Tauri plugin)
        ├── checkForUpdate() → @tauri-apps/plugin-updater
        └── downloadAndInstallUpdate() → @tauri-apps/plugin-updater
```

---

## 6. IPC 通道汇总

| 通道名称 | 用途 | 调用场景 |
|---------|------|---------|
| `storage_config_get` | 获取应用配置 | 初始化、刷新 |
| `storage_config_set_settings` | 保存设置 | 主题/语言切换 |
| `storage_sync_state` | 获取同步状态 | iCloud 状态轮询 |
| `storage_sync_status` | 获取同步状态详情 | iCloud 状态轮询 |
| `storage_sync_force` | 强制同步 | Force Sync 按钮 |
| `storage_icloud_available` | 检查 iCloud 可用性 | 初始化、轮询 |
| `storage_ensure_icloud_path` | 确保 iCloud 目录存在 | 打开 Finder 前 |
| `storage_reset_to_defaults` | 恢复出厂设置 | Factory Reset |
| `icloud_container_path` | 获取 iCloud 容器路径 | 初始化 |
| `config_app_data_path` | 获取应用数据目录 | 打开数据目录 |
| `config_open_path` | 在 Finder 中打开路径 | 打开数据目录 |
