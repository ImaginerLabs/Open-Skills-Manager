# 调试规范

**版本:** 1.0
**最后更新:** 2026-04-26

---

## 概述

本文档定义了 Tauri v2 应用的调试方法，支持 LLM Agent 自动化调试。

---

## Rust 端调试

### 控制台日志

```rust
println!("Message from Rust: {}", msg);
```

### 崩溃追踪

```bash
# Linux/macOS
RUST_BACKTRACE=1 tauri dev

# Windows PowerShell
$env:RUST_BACKTRACE=1
tauri dev
```

### 开发模式检测

```rust
// 仅在 tauri dev 时执行
#[cfg(dev)]
{
    // 开发环境专用代码
}

// 在 debug 构建时执行 (tauri dev 或 tauri build --debug)
#[cfg(debug_assertions)]
{
    // 调试专用代码
}

// 运行时检测
let is_dev: bool = tauri::is_dev();
if cfg!(dev) {
    // 开发环境代码
} else {
    // 生产环境代码
}
```

---

## WebView 调试

### 手动打开 DevTools

- **Linux/Windows**: `Ctrl + Shift + I`
- **macOS**: `Command + Option + I`
- **右键菜单**: 选择 "Inspect Element"

### 程序化控制

```rust
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 生产环境使用 Inspector

在生产构建中启用 DevTools（仅用于调试）：

```json
// tauri.conf.json
{
  "app": {
    "windows": [
      {
        "devtools": true
      }
    ]
  }
}
```

---

## CrabNebula DevTools (推荐)

### 安装

```bash
cargo add tauri-plugin-devtools@2.0.0
```

### 初始化

```rust
fn main() {
    #[cfg(debug_assertions)]
    let devtools = tauri_plugin_devtools::init();

    let mut builder = tauri::Builder::default();

    #[cfg(debug_assertions)]
    {
        builder = builder.plugin(devtools);
    }

    builder
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 功能

| 功能 | 说明 |
|------|------|
| 日志事件 | 捕获应用日志及依赖日志 |
| 命令追踪 | 监控 Tauri 命令调用性能 |
| API 使用 | 追踪 Tauri API 调用 |
| 事件监控 | 查看 Tauri 事件 payload 和响应 |
| 执行追踪 | 分析执行 spans |

---

## VS Code 调试配置

### 安装扩展

- [vscode-lldb](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb) (跨平台)
- 或 C/C++ 扩展 + Visual Studio Windows Debugger (Windows)

### launch.json

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Development Debug",
      "cargo": {
        "args": [
          "build",
          "--manifest-path=./src-tauri/Cargo.toml",
          "--no-default-features"
        ]
      },
      "preLaunchTask": "ui:dev"
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Production Debug",
      "cargo": {
        "args": ["build", "--release", "--manifest-path=./src-tauri/Cargo.toml"]
      },
      "preLaunchTask": "ui:build"
    }
  ]
}
```

### tasks.json

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ui:dev",
      "type": "shell",
      "command": "npm",
      "args": ["run", "dev"],
      "isBackground": true,
      "problemMatcher": {
        "owner": "custom",
        "pattern": {
          "regexp": "^$"
        },
        "background": {
          "activeOnStart": true,
          "beginsPattern": "starting",
          "endsPattern": "ready"
        }
      }
    },
    {
      "label": "ui:build",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"]
    }
  ]
}
```

---

## LLM Agent 自动化调试

### 推荐方案

| 方法 | 自动化程度 | 适用场景 |
|------|------------|----------|
| CrabNebula DevTools | 高 | 结构化日志、性能分析、命令追踪 |
| 程序化 DevTools | 中 | DOM/JS 调试、WebView 问题 |
| RUST_BACKTRACE | 高 | 崩溃分析、堆栈追踪 |
| VS Code LLDB | 中 | 断点调试、变量检查 |

### Agent 调试流程

1. **启动 DevTools** - 自动初始化 `tauri-plugin-devtools`
2. **捕获日志** - 收集结构化日志和 spans
3. **分析崩溃** - 使用 `RUST_BACKTRACE=1` 获取堆栈
4. **WebView 调试** - 程序化打开 DevTools 检查 DOM/JS
5. **性能分析** - 通过 DevTools 追踪命令执行时间

---

## 调试清单

- [ ] 启用 `tauri-plugin-devtools` 插件
- [ ] 配置 `.vscode/launch.json` 和 `tasks.json`
- [ ] 使用 `#[cfg(debug_assertions)]` 隔离调试代码
- [ ] 生产构建前移除或禁用调试功能
- [ ] 检查 Rust Console 和 WebView Console 两处日志

---

## 参考链接

- [Tauri Debug Documentation](https://v2.tauri.app/develop/debug/)
- [CrabNebula DevTools](https://docs.crabnebula.dev/devtools/get-started/)
- [vscode-lldb Extension](https://marketplace.visualstudio.com/items?itemName=vadimcn.vscode-lldb)
