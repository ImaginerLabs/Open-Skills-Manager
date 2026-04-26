import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

/**
 * DOMPurify 安全配置
 * 参考: docs/standards/security-sanitization.md
 */
const DOMPURIFY_CONFIG: Config = {
  // 允许的标签
  ALLOWED_TAGS: [
    // 标题
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // 段落和文本
    'p', 'br', 'hr',
    // 列表
    'ul', 'ol', 'li',
    // 格式化
    'strong', 'em', 'b', 'i', 'u', 's', 'mark',
    // 链接和媒体
    'a', 'img',
    // 引用和代码
    'code', 'pre', 'blockquote',
    // 表格
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // 其他
    'span', 'div', 'details', 'summary',
  ],

  // 允许的属性
  ALLOWED_ATTR: [
    // 通用
    'class', 'id', 'title',
    // 链接
    'href', 'target', 'rel',
    // 图片
    'src', 'alt', 'width', 'height',
    // 表格
    'colspan', 'rowspan',
  ],

  // 禁止的危险标签
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button',
  ],

  // 禁止的危险属性（事件处理器）
  FORBID_ATTR: [
    'onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown', 'onkeyup',
  ],

  // URL 协议白名单 - 只允许 http/https/mailto
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,

  // 额外安全选项
  SAFE_FOR_TEMPLATES: true,
  ALLOW_DATA_ATTR: false,
};

/**
 * 净化 HTML 内容
 * @param dirty 未净化的 HTML 字符串
 * @returns 净化后的安全 HTML
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG) as string;
}

/**
 * 净化并限制内容长度
 * @param dirty 未净化的 HTML 字符串
 * @param maxLength 最大字符数
 * @returns 净化后的安全 HTML
 */
export function sanitizeHtmlWithLimit(dirty: string, maxLength: number): string {
  const truncated = dirty.slice(0, maxLength);
  return DOMPurify.sanitize(truncated, DOMPURIFY_CONFIG) as string;
}

/**
 * 严格模式净化 - 仅允许基础标签
 * @param dirty 未净化的 HTML 字符串
 * @returns 净化后的安全 HTML
 */
export function sanitizeHtmlStrict(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href'],
  }) as string;
}

/**
 * 净化 Markdown 渲染后的内容
 * Markdown 渲染为 HTML 后使用此函数净化
 * @param renderedMarkdown 渲染后的 Markdown HTML
 * @returns 净化后的安全 HTML
 */
export function sanitizeMarkdown(renderedMarkdown: string): string {
  return sanitizeHtml(renderedMarkdown);
}

/**
 * 验证并净化链接 URL
 * @param href 原始链接
 * @returns 安全的链接或 null
 */
export function sanitizeLink(href: string): string | null {
  const trimmed = href.trim();

  if (!trimmed) {
    return null;
  }

  // 检查协议
  const protocolMatch = trimmed.match(/^([a-z][a-z0-9+.\-]*):/i);

  if (protocolMatch && protocolMatch[1]) {
    const protocol = protocolMatch[1].toLowerCase();
    // 白名单检查
    if (!['http', 'https', 'mailto'].includes(protocol)) {
      return null;
    }
    return trimmed;
  }

  // 相对链接检查 - 防止路径遍历
  if (trimmed.startsWith('/') || trimmed.startsWith('./')) {
    if (trimmed.includes('../')) {
      return null;
    }
    return trimmed;
  }

  // 无协议链接，默认添加 https
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  return `https://${trimmed}`;
}
