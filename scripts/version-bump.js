#!/usr/bin/env node

/**
 * 版本号更新脚本
 *
 * 使用方式: node scripts/version-bump.js <version>
 *
 * 自动更新以下文件中的版本号:
 * - package.json
 * - src-tauri/tauri.conf.json
 * - src-tauri/Cargo.toml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');
const VERSION = process.argv[2];

if (!VERSION) {
  console.error('❌ 请提供版本号');
  console.error('使用方式: node scripts/version-bump.js <version>');
  console.error('示例: node scripts/version-bump.js 0.2.0');
  process.exit(1);
}

// 验证版本号格式 (semver)
const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
if (!semverRegex.test(VERSION)) {
  console.error(`❌ 无效的版本号格式: ${VERSION}`);
  console.error('版本号必须符合 semver 格式 (X.Y.Z 或 X.Y.Z-suffix)');
  process.exit(1);
}

console.log(`📦 准备更新版本号到 ${VERSION}...\n`);

// 1. 更新 package.json
const packageJsonPath = path.join(ROOT_DIR, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const oldPackageVersion = packageJson.version;
packageJson.version = VERSION;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ package.json: ${oldPackageVersion} → ${VERSION}`);

// 2. 更新 src-tauri/tauri.conf.json
const tauriConfPath = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const oldTauriVersion = tauriConf.version;
tauriConf.version = VERSION;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✅ tauri.conf.json: ${oldTauriVersion} → ${VERSION}`);

// 3. 更新 src-tauri/Cargo.toml
const cargoTomlPath = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const oldCargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1] || 'unknown';
cargoToml = cargoToml.replace(
  /^(version\s*=\s*)"[^"]+"/m,
  `$1"${VERSION}"`
);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Cargo.toml: ${oldCargoVersion} → ${VERSION}`);

console.log(`\n✨ 版本号已更新到 ${VERSION}`);
console.log('\n后续步骤:');
console.log('  1. 检查变更: git diff');
console.log('  2. 提交变更: git add -A && git commit -m "chore: bump version to ' + VERSION + '"');
console.log('  3. 创建 tag: git tag v' + VERSION);
console.log('  4. 推送: git push origin main && git push origin v' + VERSION);
