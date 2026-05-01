#!/usr/bin/env node

/**
 * 版本同步脚本
 *
 * 由 pnpm version 自动调用，同步版本号到其他文件
 * pnpm version 会自动更新 package.json，此脚本更新:
 * - src-tauri/tauri.conf.json
 * - src-tauri/Cargo.toml
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, '..');

// pnpm version 会设置 npm_package_version 环境变量
const VERSION = process.env.npm_package_version;

if (!VERSION) {
  console.error('❌ 无法获取版本号，此脚本应由 pnpm version 调用');
  console.error('直接使用: node scripts/version-bump.js <version>');
  process.exit(1);
}

console.log(`📦 同步版本号 ${VERSION} 到其他文件...\n`);

// 1. 更新 src-tauri/tauri.conf.json
const tauriConfPath = path.join(ROOT_DIR, 'src-tauri', 'tauri.conf.json');
const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
const oldTauriVersion = tauriConf.version;
tauriConf.version = VERSION;
fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`✅ tauri.conf.json: ${oldTauriVersion} → ${VERSION}`);

// 2. 更新 src-tauri/Cargo.toml
const cargoTomlPath = path.join(ROOT_DIR, 'src-tauri', 'Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const oldCargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1] || 'unknown';
cargoToml = cargoToml.replace(
  /^(version\s*=\s*)"[^"]+"/m,
  `$1"${VERSION}"`
);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Cargo.toml: ${oldCargoVersion} → ${VERSION}`);

console.log(`\n✨ 版本号已同步`);