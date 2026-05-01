# GitHub CI/CD 工作流说明

本项目包含两个 GitHub Actions 工作流，支持自动构建和发布。

## 工作流概览

### 1. CI 工作流 (`.github/workflows/ci.yml`)

**触发条件：**
- 推送到 `main` 或 `develop` 分支
- Pull Request 到 `main` 或 `develop` 分支

**执行内容：**
1. **Lint 检查** - TypeScript 类型检查、ESLint、Prettier 格式检查
2. **单元测试** - 运行 Vitest 测试并生成覆盖率报告
3. **构建检查** - 在 macOS 上构建 Tauri 应用（debug 模式）

### 2. Release 工作流 (`.github/workflows/release.yml`)

**触发条件：**
- 推送 tag（格式：`v*`，如 `v0.1.0`）
- 手动触发（workflow_dispatch）

**执行内容：**
1. **构建** - 为 macOS 双架构（Apple Silicon + Intel）构建应用
2. **打包** - 生成 DMG 安装包
3. **生成 Changelog** - 自动从 git commits 生成分类的更新日志
4. **发布** - 创建 GitHub Release 并上传构建产物

---

## 使用方法

### 日常开发

直接推送到 `main` 或 `develop` 分支会触发 CI 工作流：

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 发布新版本

#### 完整流程（推荐）

```bash
# 1. 更新版本号（自动更新 package.json, tauri.conf.json, Cargo.toml）
pnpm version 0.2.0

# 2. 检查变更
git diff

# 3. 提交版本更新
git add -A
git commit -m "chore: bump version to 0.2.0"

# 4. 创建 tag
git tag v0.2.0

# 5. 推送 commit 和 tag（这会触发 CI 构建和发布）
git push origin main
git push origin v0.2.0
```

#### 手动触发

1. 进入 GitHub 仓库页面
2. 点击 **Actions** 标签
3. 选择 **Build and Release** 工作流
4. 点击 **Run workflow**
5. 选择是否创建 Release

---

## 版本号管理

### 自动更新版本号

```bash
pnpm version <version>
```

示例：
- `pnpm version 0.2.0` - 更新到 0.2.0
- `pnpm version 0.1.1` - 更新到 0.1.1
- `pnpm version 1.0.0-beta.1` - 预发布版本

此命令会自动更新以下文件：
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

### 版本号格式

遵循 [Semantic Versioning](https://semver.org/)：
- `MAJOR.MINOR.PATCH` (如 `1.0.0`)
- 预发布版本: `MAJOR.MINOR.PATCH-label` (如 `1.0.0-beta.1`)

---

## Changelog 自动生成

Release 工作流会自动生成分类的更新日志：

```markdown
### ✨ 新功能
- feat: add batch deploy feature (a1b2c3d)

### 🐛 修复
- fix: resolve skill import issue (e4f5g6h)

### ♻️ 重构
- refactor: consolidate filesystem utils (i7j8k9l)

### 📝 文档
- docs: update README (m0n1o2p)
```

Commit message 前缀分类：
- `feat:` → ✨ 新功能
- `fix:` → 🐛 修复
- `refactor:` → ♻️ 重构
- `docs:` → 📝 文档
- 其他 → 🔧 其他

---

## 构建产物

Release 发布后，用户可下载以下文件：

| 文件 | 说明 |
|------|------|
| `Open-Skills-Manager_aarch64.dmg` | macOS Apple Silicon (M1/M2/M3) |
| `Open-Skills-Manager_x86_64.dmg` | macOS Intel |

---

## Secrets 配置

如需代码签名和公证，请在仓库 Settings > Secrets and variables > Actions 中配置：

### Tauri 签名（可选，用于自动更新验证）

| Secret | 说明 |
|--------|------|
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri 更新签名私钥 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 私钥密码 |

### Apple 代码签名与公证（可选）

| Secret | 说明 |
|--------|------|
| `APPLE_CERTIFICATE` | Base64 编码的 .p12 证书 |
| `APPLE_CERTIFICATE_PASSWORD` | 证书密码 |
| `APPLE_SIGNING_IDENTITY` | 签名身份（如 `Developer ID Application: Your Name (TEAM_ID)`） |
| `APPLE_ID` | Apple ID 邮箱 |
| `APPLE_PASSWORD` | App-specific password |

> **注意**：不配置这些 Secrets 也可以构建，只是应用未签名，用户首次运行时需要在「系统设置 > 隐私与安全性」中手动允许。

---

## 工作流文件结构

```
.github/
├── README.md           # 本说明文档
└── workflows/
    ├── ci.yml          # CI 检查（lint, test, build）
    └── release.yml     # 构建并发布 Release

scripts/
└── version-bump.js     # 版本号自动更新脚本
```

---

## 常见问题

### Q: 构建失败怎么办？

1. 查看 Actions 页面的详细日志
2. 本地运行 `pnpm typecheck && pnpm lint && pnpm test:run` 确保通过
3. 检查 Rust 编译错误：`pnpm tauri build`

### Q: 如何跳过 CI？

在 commit message 中添加 `[skip ci]` 或 `[ci skip]`：

```bash
git commit -m "docs: update README [skip ci]"
```

### Q: Release 发布后如何更新版本号？

Tauri 的自动更新功能需要：
1. 配置 `plugins.updater` in `tauri.conf.json`
2. 生成签名密钥对
3. 在构建时提供签名私钥

详细配置见 [Tauri Updater 文档](https://v2.tauri.app/plugin/updater/)。

### Q: 如何查看已发布的版本？

- GitHub Releases 页面: `https://github.com/ImaginerLabs/Open-Skills-Manager/releases`
- npm 包版本（如有）: `npm view @imaginerlabs/open-skills-manager versions`

---

## 示例：完整发布流程

```bash
# 假设当前版本是 0.1.0，要发布 0.2.0

# 1. 确保在 main 分支且是最新的
git checkout main
git pull origin main

# 2. 更新版本号
pnpm version 0.2.0

# 3. 查看变更
git diff
# 应该看到 package.json, tauri.conf.json, Cargo.toml 的版本号变更

# 4. 提交
git add -A
git commit -m "chore: bump version to 0.2.0"

# 5. 创建 tag
git tag v0.2.0

# 6. 推送（触发 CI）
git push origin main
git push origin v0.2.0

# 7. 等待 GitHub Actions 完成
# 访问 https://github.com/ImaginerLabs/Open-Skills-Manager/actions

# 8. 验证 Release
# 访问 https://github.com/ImaginerLabs/Open-Skills-Manager/releases/tag/v0.2.0
```
