# 安全净化规范

本文档定义 Claude Code Skills Manager 中所有用户输入和外部内容的净化策略，确保应用免受注入攻击。

## 1. 危险模式定义

### 1.1 Shell 注入模式

以下模式在 Shell 命令上下文中具有危险性：

| 模式 | 危险等级 | 说明 |
|------|----------|------|
| `rm -rf` | 严重 | 递归强制删除，可能导致数据丢失 |
| `sudo` | 严重 | 提权执行，可能破坏系统 |
| `chmod 777` | 高 | 开放所有权限，安全隐患 |
| `eval()` | 严重 | 动态执行代码 |
| `exec()` | 严重 | 执行外部命令 |
| `system()` | 严重 | 执行系统命令 |
| `` ` `` (backticks) | 高 | 命令替换执行 |
| `$()` | 高 | 命令替换执行 |
| `${}` | 中 | 变量扩展，可能泄露信息 |

### 1.2 脚本注入模式

以下 HTML/JavaScript 模式需要在渲染前净化：

| 模式 | 危险等级 | 说明 |
|------|----------|------|
| `<script>` | 严重 | 执行任意 JavaScript |
| `javascript:` | 严重 | 协议注入执行代码 |
| `data:` | 高 | Data URI 可能包含可执行内容 |
| `vbscript:` | 高 | VBScript 执行（IE 兼容） |
| `onerror=` | 高 | 事件处理器注入 |
| `onload=` | 高 | 事件处理器注入 |
| `onclick=` | 中 | 事件处理器注入 |

### 1.3 路径遍历模式

文件系统访问需要验证：

| 模式 | 危险等级 | 说明 |
|------|----------|------|
| `../` | 严重 | 目录遍历，访问预期外文件 |
| `..\\` | 严重 | Windows 路径遍历 |
| 绝对路径写入 | 高 | 可能覆盖系统文件 |
| 符号链接 | 中 | 可能指向敏感文件 |

### 1.4 命令注入模式

命令拼接上下文中的危险字符：

| 模式 | 危险等级 | 说明 |
|------|----------|------|
| `;` | 严重 | 命令分隔，追加执行 |
| `\|` | 高 | 管道，链式执行 |
| `&&` | 高 | 条件执行 |
| `\|\|` | 高 | 条件执行 |
| `$()` | 高 | 命令替换 |
| `${}` | 中 | 变量扩展 |

---

## 2. 净化策略

### 2.1 前端净化

使用 DOMPurify 进行 HTML 净化：

```typescript
import DOMPurify from 'dompurify';

// DOMPurify 配置
const PURIFY_CONFIG: DOMPurify.Config = {
  // 允许的标签
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'blockquote', 'code', 'pre',
    'a', 'img',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'span', 'div'
  ],

  // 允许的属性
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'class', 'id',
    'target', 'rel'
  ],

  // 允许的 URI 协议
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // 禁止 data: 和 javascript: 协议
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],

  // 保持 HTML 实体
  ADD_ENTITIES: false,

  // 移除不安全属性
  SAFE_FOR_TEMPLATES: true
};

/**
 * 净化 HTML 内容
 * @param dirty 未净化的 HTML 字符串
 * @returns 净化后的安全 HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
}

/**
 * 净化并限制内容长度
 * @param dirty 未净化的 HTML 字符串
 * @param maxLength 最大字符数
 * @returns 净化后的安全 HTML
 */
export function sanitizeHtmlWithLimit(dirty: string, maxLength: number): string {
  const truncated = dirty.slice(0, maxLength);
  return DOMPurify.sanitize(truncated, PURIFY_CONFIG);
}
```

### 2.2 后端净化 (Rust)

使用 `ammon` crate 进行 HTML 净化：

```rust
use ammon::{Builder, UrlRelative, UrlRelativeEvaluate};
use std::borrow::Cow;

/// HTML 净化配置
lazy_static! {
    static ref SANITIZER: Builder<'static> = {
        let mut builder = Builder::default();

        // 允许的标签
        builder.add_tags(&[
            "p", "br", "strong", "em", "u", "s",
            "h1", "h2", "h3", "h4", "h5", "h6",
            "ul", "ol", "li",
            "blockquote", "code", "pre",
            "a", "img",
            "table", "thead", "tbody", "tr", "th", "td",
            "hr", "span", "div"
        ]);

        // 允许的属性
        builder.add_tag_attributes("a", &["href", "title", "target", "rel"]);
        builder.add_tag_attributes("img", &["src", "alt", "title"]);
        builder.add_tag_attributes("div", &["class"]);
        builder.add_tag_attributes("span", &["class"]);

        // URL 相对路径处理
        builder.url_relative(UrlRelative::Custom(Box::new(|url| {
            // 只允许 http/https/mailto 协议
            let url_str = url.as_str();
            if url_str.starts_with("http://")
                || url_str.starts_with("https://")
                || url_str.starts_with("mailto:")
            {
                Some(Cow::Owned(url.clone()))
            } else {
                None
            }
        })));

        builder
    };
}

/// 净化 HTML 内容
///
/// # Arguments
/// * `dirty` - 未净化的 HTML 字符串
///
/// # Returns
/// * 净化后的安全 HTML 字符串
pub fn sanitize_html(dirty: &str) -> String {
    SANITIZER.clean(dirty).to_string()
}

/// 净化并验证链接
///
/// # Arguments
/// * `url` - 待验证的 URL 字符串
///
/// # Returns
/// * `Some(url)` - 安全的 URL
/// * `None` - 不安全的 URL
pub fn sanitize_url(url: &str) -> Option<String> {
    let url = url.trim();

    // 检查协议白名单
    if url.starts_with("http://")
        || url.starts_with("https://")
        || url.starts_with("mailto:")
    {
        // 进一步验证 URL 格式
        if let Ok(parsed) = url::Url::parse(url) {
            if ["http", "https", "mailto"].contains(&parsed.scheme()) {
                return Some(url.to_string());
            }
        }
    }

    None
}
```

### 2.3 代码块处理

代码块**只显示不执行**：

```typescript
/**
 * 处理代码块，确保安全显示
 * @param code 原始代码内容
 * @param language 代码语言标识
 * @returns 安全的代码块 HTML
 */
export function processCodeBlock(code: string, language: string = ''): string {
  // 1. HTML 实体转义
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. 包装为 pre/code 标签
  return `<pre><code class="language-${escapeHtml(language)}">${escaped}</code></pre>`;
}

/**
 * 转义 HTML 属性值
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 2.4 链接处理

只允许白名单协议：

```typescript
/**
 * 协议白名单
 */
const ALLOWED_PROTOCOLS = ['http', 'https', 'mailto'] as const;

/**
 * 验证并净化链接
 * @param href 原始链接
 * @returns 安全的链接或 null
 */
export function sanitizeLink(href: string): string | null {
  // 移除空白字符
  const trimmed = href.trim();

  // 检查协议
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.-]*):/i);

  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();

    // 白名单检查
    if (!ALLOWED_PROTOCOLS.includes(protocol as typeof ALLOWED_PROTOCOLS[number])) {
      return null;
    }
  }

  // 相对链接检查 - 防止路径遍历
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    // 禁止 ../ 路径遍历
    if (trimmed.includes('../')) {
      return null;
    }
    return trimmed;
  }

  // 无协议链接，默认添加 https
  if (!protocolMatch && trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (!protocolMatch) {
    return `https://${trimmed}`;
  }

  return trimmed;
}
```

---

## 3. SKILL.md 净化规则

### 3.1 Frontmatter 净化

Frontmatter 仅允许基础类型：

```typescript
interface SafeFrontmatter {
  // 字符串字段
  name: string;
  description: string;
  version: string;
  author?: string;

  // 数值字段
  priority?: number;

  // 布尔字段
  enabled?: boolean;

  // 字符串数组
  tags?: string[];
}

/**
 * 净化 Frontmatter 对象
 * @param raw 原始解析的 Frontmatter
 * @returns 安全的 Frontmatter 对象
 */
export function sanitizeFrontmatter(raw: Record<string, unknown>): SafeFrontmatter {
  const safe: SafeFrontmatter = {
    name: '',
    description: '',
    version: '1.0.0'
  };

  // 字符串字段净化
  if (typeof raw.name === 'string') {
    safe.name = sanitizeString(raw.name, 100);
  }
  if (typeof raw.description === 'string') {
    safe.description = sanitizeString(raw.description, 500);
  }
  if (typeof raw.version === 'string') {
    safe.version = sanitizeVersion(raw.version);
  }
  if (typeof raw.author === 'string') {
    safe.author = sanitizeString(raw.author, 50);
  }

  // 数值字段净化
  if (typeof raw.priority === 'number' && Number.isFinite(raw.priority)) {
    safe.priority = Math.max(0, Math.min(100, raw.priority));
  }

  // 布尔字段净化
  if (typeof raw.enabled === 'boolean') {
    safe.enabled = raw.enabled;
  }

  // 数组字段净化
  if (Array.isArray(raw.tags)) {
    safe.tags = raw.tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => sanitizeString(tag, 30))
      .slice(0, 20); // 最多 20 个标签
  }

  return safe;
}

/**
 * 净化字符串，移除控制字符
 */
function sanitizeString(str: string, maxLength: number): string {
  return str
    .slice(0, maxLength)
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .trim();
}

/**
 * 净化版本号，只允许数字和点
 */
function sanitizeVersion(version: string): string {
  const cleaned = version.replace(/[^0-9.]/g, '');
  return cleaned || '1.0.0';
}
```

### 3.2 Markdown 内容净化

```typescript
/**
 * 净化 Markdown 内容
 * @param markdown 原始 Markdown 文本
 * @returns 净化后的安全 Markdown
 */
export function sanitizeMarkdown(markdown: string): string {
  // 1. 移除危险 HTML 标签
  let safe = removeDangerousHtmlTags(markdown);

  // 2. 移除危险协议链接
  safe = sanitizeMarkdownLinks(safe);

  // 3. 移除脚本注入模式
  safe = removeScriptPatterns(safe);

  return safe;
}

/**
 * 移除危险 HTML 标签
 */
function removeDangerousHtmlTags(markdown: string): string {
  const dangerousTags = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^>]*>/gi
  ];

  let result = markdown;
  for (const pattern of dangerousTags) {
    result = result.replace(pattern, '');
  }

  return result;
}

/**
 * 净化 Markdown 链接
 */
function sanitizeMarkdownLinks(markdown: string): string {
  // 处理 [text](url) 格式
  return markdown.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
    const safeUrl = sanitizeLink(url);
    if (safeUrl) {
      return `[${text}](${safeUrl})`;
    }
    return `[${text}](#)`; // 替换为安全链接
  });
}

/**
 * 移除脚本注入模式
 */
function removeScriptPatterns(text: string): string {
  const patterns = [
    /javascript\s*:/gi,
    /vbscript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /on\w+\s*=/gi // 事件处理器
  ];

  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }

  return result;
}
```

### 3.3 代码块保留

代码块内容保持原样，仅进行 HTML 转义显示：

```typescript
/**
 * 处理 SKILL.md 中的代码块
 * 代码块内容不净化，仅转义显示
 */
export function preserveCodeBlocks(markdown: string): string {
  // 保存代码块内容
  const codeBlocks: string[] = [];
  let index = 0;

  // 提取并替换代码块
  const result = markdown.replace(/```[\s\S]*?```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${index}__`;
    codeBlocks.push(match);
    index++;
    return placeholder;
  });

  return { markdown: result, codeBlocks };
}

/**
 * 恢复代码块
 */
export function restoreCodeBlocks(markdown: string, codeBlocks: string[]): string {
  let result = markdown;
  codeBlocks.forEach((block, index) => {
    result = result.replace(`__CODE_BLOCK_${index}__`, block);
  });
  return result;
}
```

### 3.4 链接验证

```typescript
/**
 * 验证 SKILL.md 中的所有链接
 */
export function validateLinks(markdown: string): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  // 匹配 Markdown 链接
  const linkPattern = /\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkPattern.exec(markdown)) !== null) {
    const url = match[2];
    if (sanitizeLink(url)) {
      valid.push(url);
    } else {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}
```

---

## 4. 实现示例

### 4.1 完整的 DOMPurify 配置

```typescript
// src/utils/sanitization/html-sanitizer.ts

import DOMPurify from 'dompurify';

/**
 * DOMPurify 安全配置
 */
export const SECURITY_CONFIG = {
  // 基础配置
  ALLOWED_TAGS: [
    // 文本格式化
    'p', 'br', 'strong', 'em', 'u', 's', 'mark',
    // 标题
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 列表
    'ul', 'ol', 'li',
    // 引用和代码
    'blockquote', 'code', 'pre',
    // 链接和媒体
    'a', 'img',
    // 表格
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // 其他
    'hr', 'span', 'div', 'details', 'summary'
  ],

  ALLOWED_ATTR: [
    // 通用
    'class', 'id', 'title',
    // 链接
    'href', 'target', 'rel',
    // 图片
    'src', 'alt', 'width', 'height',
    // 表格
    'colspan', 'rowspan'
  ],

  // URL 协议白名单
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // 禁止的标签和属性
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup'
  ],

  // 额外安全选项
  SAFE_FOR_TEMPLATES: true,
  ALLOW_DATA_ATTR: false,
  ADD_URI_SAFE_ATTR: []
} as const;

/**
 * 创建配置化的净化器
 */
export function createSanitizer(
  customConfig?: Partial<DOMPurify.Config>
): (dirty: string) => string {
  const config = { ...SECURITY_CONFIG, ...customConfig };

  return (dirty: string) => DOMPurify.sanitize(dirty, config);
}

/**
 * 默认 HTML 净化器
 */
export const sanitizeHtml = createSanitizer();

/**
 * 严格模式净化器 - 更少的标签
 */
export const sanitizeHtmlStrict = createSanitizer({
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'code', 'pre'],
  ALLOWED_ATTR: ['href']
});
```

### 4.2 Rust 净化函数

```rust
// src-tauri/src/sanitization/mod.rs

pub mod html;
pub mod markdown;
pub mod path;
pub mod url;

use thiserror::Error;

#[derive(Error, Debug)]
pub enum SanitizationError {
    #[error("HTML contains forbidden tags: {0}")]
    ForbiddenTags(String),

    #[error("URL protocol not allowed: {0}")]
    ForbiddenProtocol(String),

    #[error("Path traversal detected: {0}")]
    PathTraversal(String),

    #[error("Content exceeds size limit: {0} bytes")]
    SizeExceeded(usize),

    #[error("Invalid UTF-8 content")]
    InvalidUtf8,
}

/// 净化结果
pub struct SanitizationResult {
    pub content: String,
    pub warnings: Vec<String>,
    pub modifications: usize,
}

/// 净化配置
pub struct SanitizationConfig {
    pub max_size: usize,
    pub allowed_tags: Vec<&'static str>,
    pub allowed_protocols: Vec<&'static str>,
}

impl Default for SanitizationConfig {
    fn default() -> Self {
        Self {
            max_size: 100 * 1024, // 100KB
            allowed_tags: vec![
                "p", "br", "strong", "em", "u", "s",
                "h1", "h2", "h3", "h4", "h5", "h6",
                "ul", "ol", "li", "blockquote", "code", "pre",
                "a", "img", "table", "thead", "tbody", "tr", "th", "td",
                "hr", "span", "div"
            ],
            allowed_protocols: vec!["http", "https", "mailto"],
        }
    }
}

/// 主净化入口
pub fn sanitize(
    content: &str,
    config: &SanitizationConfig
) -> Result<SanitizationResult, SanitizationError> {
    // 检查大小
    if content.len() > config.max_size {
        return Err(SanitizationError::SizeExceeded(content.len()));
    }

    let mut warnings = Vec::new();
    let mut modifications = 0;

    // HTML 净化
    let (html, mods) = html::sanitize(content, &config.allowed_tags)?;
    modifications += mods;

    // URL 净化
    let (content, mods, url_warnings) = url::sanitize_links(&html, &config.allowed_protocols)?;
    modifications += mods;
    warnings.extend(url_warnings);

    Ok(SanitizationResult {
        content,
        warnings,
        modifications,
    })
}
```

### 4.3 测试用例

```typescript
// src/utils/sanitization/__tests__/html-sanitizer.test.ts

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, sanitizeLink, sanitizeMarkdown } from '../html-sanitizer';

describe('HTML Sanitization', () => {
  describe('sanitizeHtml', () => {
    it('should preserve safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should remove script tags', () => {
      const input = '<p>Safe</p><script>alert("xss")</script>';
      expect(sanitizeHtml(input)).toBe('<p>Safe</p>');
    });

    it('should remove event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onerror');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe links', () => {
      const input = '<a href="https://example.com">Link</a>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe><p>Safe</p>';
      expect(sanitizeHtml(input)).toBe('<p>Safe</p>');
    });
  });

  describe('sanitizeLink', () => {
    it('should allow https protocol', () => {
      expect(sanitizeLink('https://example.com')).toBe('https://example.com');
    });

    it('should allow http protocol', () => {
      expect(sanitizeLink('http://example.com')).toBe('http://example.com');
    });

    it('should allow mailto protocol', () => {
      expect(sanitizeLink('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeLink('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(sanitizeLink('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject vbscript: protocol', () => {
      expect(sanitizeLink('vbscript:msgbox(1)')).toBeNull();
    });

    it('should add https to protocol-less URLs', () => {
      expect(sanitizeLink('example.com')).toBe('https://example.com');
    });
  });
});

describe('Markdown Sanitization', () => {
  describe('sanitizeMarkdown', () => {
    it('should preserve safe markdown', () => {
      const input = '# Title\n\nParagraph with **bold** text.';
      expect(sanitizeMarkdown(input)).toBe(input);
    });

    it('should remove script tags in markdown', () => {
      const input = '# Title\n<script>alert(1)</script>\nParagraph';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('<script>');
    });

    it('should sanitize markdown links', () => {
      const input = '[Link](javascript:alert(1))';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('javascript:');
    });

    it('should preserve safe markdown links', () => {
      const input = '[Link](https://example.com)';
      expect(sanitizeMarkdown(input)).toBe(input);
    });

    it('should remove inline event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const result = sanitizeMarkdown(input);
      expect(result).not.toContain('onerror');
    });
  });
});
```

---

## 5. 验证清单

### 5.1 必检项

- [ ] 所有 SKILL.md 渲染前必须经过净化
- [ ] 净化后内容不包含危险模式（script, javascript:, onerror 等）
- [ ] 链接只允许 http/https/mailto 协议
- [ ] 代码块内容不执行，仅转义显示
- [ ] Frontmatter 字段类型验证

### 5.2 性能要求

| 指标 | 要求 |
|------|------|
| 净化 < 50KB 文件 | < 10ms |
| 净化 < 100KB 文件 | < 25ms |
| 净化 > 100KB 文件 | 显示警告 |

### 5.3 安全检查流程

```
用户输入/SKILL.md
       │
       ▼
   大小检查 (< 100KB)
       │
       ▼
   编码验证 (UTF-8)
       │
       ▼
   Frontmatter 解析 & 净化
       │
       ▼
   Markdown 内容净化
       │
       ├── 移除危险 HTML 标签
       ├── 净化链接协议
       └── 移除脚本注入模式
       │
       ▼
   代码块提取 & 保留
       │
       ▼
   最终渲染
```

### 5.4 错误处理

| 错误类型 | 处理方式 |
|----------|----------|
| 文件过大 | 拒绝处理，显示错误 |
| 编码错误 | 尝试修复或拒绝 |
| 恶意内容 | 净化后显示，记录警告 |
| 解析失败 | 显示原始内容（转义后） |

### 5.5 审计日志

净化过程中的警告应记录：

```typescript
interface SanitizationLog {
  timestamp: Date;
  source: string;        // 文件名或来源标识
  warnings: string[];    // 警告信息
  modifications: number; // 修改次数
  originalSize: number;  // 原始大小
  finalSize: number;     // 最终大小
}
```

---

## 6. 相关文档

- [安全规范](./security-standards.md) - 整体安全策略
- [IPC 通信规范](./ipc-standards.md) - 跨进程通信安全
- [项目结构](./project-structure.md) - 文件组织方式
