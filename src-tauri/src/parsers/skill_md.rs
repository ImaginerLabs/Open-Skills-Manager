use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;

/// SKILL.md frontmatter 元数据
///
/// 表示 YAML frontmatter 中的所有字段。
/// 使用 serde_yaml 进行标准 YAML 解析。
#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq)]
pub struct SkillFrontmatter {
    /// 技能名称 (必需)
    pub name: String,

    /// 版本号 (可选，默认 "0.0.0")
    #[serde(default = "default_version")]
    pub version: String,

    /// 描述 (可选)
    #[serde(default)]
    pub description: String,

    /// 分类 ID (可选，用于未来扩展)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,

    /// 优先级 (可选，用于未来扩展)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub priority: Option<String>,

    /// 标签 (可选，用于未来扩展)
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,

    /// 作者 (可选)
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,

    /// 捕获未知字段，支持向前兼容
    #[serde(flatten)]
    pub extra: HashMap<String, serde_yaml::Value>,
}

fn default_version() -> String {
    "0.0.0".to_string()
}

/// 解析结果
#[derive(Debug, Clone)]
pub struct ParsedSkill {
    /// 解析出的 frontmatter
    pub frontmatter: SkillFrontmatter,

    /// Markdown 正文内容 (frontmatter 之后的部分)
    pub content: String,

    /// 解析是否来自降级处理
    pub is_fallback: bool,
}

/// 解析错误类型
#[derive(Debug, Clone)]
pub enum ParseError {
    /// 文件未找到
    FileNotFound(String),

    /// YAML 格式错误
    InvalidYaml(String),

    /// 缺少必需字段
    MissingField(String),

    /// IO 错误
    IoError(String),

    /// 无 frontmatter
    NoFrontmatter,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ParseError::FileNotFound(path) => write!(f, "File not found: {}", path),
            ParseError::InvalidYaml(msg) => write!(f, "Invalid YAML frontmatter: {}", msg),
            ParseError::MissingField(field) => write!(f, "Missing required field: {}", field),
            ParseError::IoError(msg) => write!(f, "IO error: {}", msg),
            ParseError::NoFrontmatter => write!(f, "No frontmatter found"),
        }
    }
}

/// 解析选项
#[derive(Debug, Clone, Default)]
pub struct ParseOptions {
    /// 是否在解析失败时降级处理
    pub fallback_on_error: bool,

    /// 是否提取正文内容
    pub extract_content: bool,
}

impl SkillFrontmatter {
    /// 从文件路径解析 SKILL.md
    ///
    /// # Arguments
    /// * `path` - SKILL.md 文件路径
    ///
    /// # Returns
    /// * `Ok(SkillFrontmatter)` - 解析成功
    /// * `Err(ParseError)` - 解析失败
    pub fn from_path(path: &Path) -> Result<Self, ParseError> {
        let content = std::fs::read_to_string(path)
            .map_err(|e| ParseError::IoError(e.to_string()))?;
        Self::from_content(&content)
    }

    /// 从字符串内容解析
    ///
    /// # Arguments
    /// * `content` - SKILL.md 文件内容
    ///
    /// # Returns
    /// * `Ok(SkillFrontmatter)` - 解析成功
    /// * `Err(ParseError)` - 解析失败
    pub fn from_content(content: &str) -> Result<Self, ParseError> {
        let result = parse_with_options(content, &ParseOptions::default())?;
        Ok(result.frontmatter)
    }

    /// 从路径解析，失败时返回默认值 (向后兼容)
    ///
    /// 替代现有 `parse_skill_md()` 函数的行为。
    /// 解析失败时使用文件夹名作为名称。
    pub fn from_path_or_default(path: &Path) -> Option<Self> {
        // 尝试读取文件内容
        let content = match std::fs::read_to_string(path) {
            Ok(c) => c,
            Err(_) => {
                // 文件读取失败，使用文件夹名作为名称
                return path.parent()
                    .and_then(|p| p.file_name())
                    .map(|name| Self {
                        name: name.to_string_lossy().to_string(),
                        ..Default::default()
                    });
            }
        };

        // 先尝试带 fallback 的解析
        let options = ParseOptions {
            fallback_on_error: true,
            extract_content: false,
        };

        if let Ok(result) = parse_with_options(&content, &options) {
            // 如果解析成功（包括 fallback），检查是否有有效的 name
            if !result.frontmatter.name.is_empty() {
                return Some(result.frontmatter);
            }
        }

        // 最终降级：使用文件夹名作为名称
        path.parent()
            .and_then(|p| p.file_name())
            .map(|name| Self {
                name: name.to_string_lossy().to_string(),
                ..Default::default()
            })
    }
}

/// 完整解析函数，返回 frontmatter 和正文
pub fn parse_skill_md_full(content: &str) -> Result<ParsedSkill, ParseError> {
    parse_with_options(content, &ParseOptions {
        extract_content: true,
        ..Default::default()
    })
}

/// 带选项的解析函数
pub fn parse_with_options(content: &str, options: &ParseOptions) -> Result<ParsedSkill, ParseError> {
    // 1. 检查是否以 --- 开头
    let content = content.trim_start();
    if !content.starts_with("---") {
        if options.fallback_on_error {
            return Ok(ParsedSkill {
                frontmatter: SkillFrontmatter::default(),
                content: if options.extract_content { content.to_string() } else { String::new() },
                is_fallback: true,
            });
        }
        return Err(ParseError::NoFrontmatter);
    }

    // 2. 查找结束标记 (支持不同换行符)
    let end_marker = content.find("\n---\n")
        .or_else(|| content.find("\n---\r\n"))
        .or_else(|| content.find("\r\n---\r\n"));

    let end_pos = match end_marker {
        Some(pos) => pos,
        None => {
            if options.fallback_on_error {
                return Ok(ParsedSkill {
                    frontmatter: SkillFrontmatter::default(),
                    content: String::new(),
                    is_fallback: true,
                });
            }
            return Err(ParseError::InvalidYaml("Missing closing ---".to_string()));
        }
    };

    // 3. 提取 YAML 内容 (跳过开头的 "---\n")
    let yaml_content = &content[4..end_pos];

    // 4. 提取正文内容
    let body_start = end_pos + 5; // 跳过 "\n---\n"
    let markdown_content = if options.extract_content && body_start < content.len() {
        content[body_start..].trim_start().to_string()
    } else {
        String::new()
    };

    // 5. 解析 YAML
    match serde_yaml::from_str::<SkillFrontmatter>(yaml_content) {
        Ok(frontmatter) => Ok(ParsedSkill {
            frontmatter,
            content: markdown_content,
            is_fallback: false,
        }),
        Err(e) => {
            if options.fallback_on_error {
                // 降级处理：尝试手工提取关键字段
                let fallback = fallback_parse(yaml_content);
                Ok(ParsedSkill {
                    frontmatter: fallback,
                    content: markdown_content,
                    is_fallback: true,
                })
            } else {
                Err(ParseError::InvalidYaml(e.to_string()))
            }
        }
    }
}

/// 降级解析：当 YAML 解析失败时，尝试手工提取关键字段
fn fallback_parse(yaml_content: &str) -> SkillFrontmatter {
    let mut name = String::new();
    let mut version = "0.0.0".to_string();
    let mut description = String::new();
    let mut in_multiline_desc = false;
    let mut desc_lines: Vec<String> = Vec::new();

    for line in yaml_content.lines() {
        // 处理多行描述
        if in_multiline_desc {
            if line.starts_with("name:") || line.starts_with("version:") || line.starts_with("category:") {
                in_multiline_desc = false;
                description = desc_lines.join(" ").trim().to_string();
                desc_lines.clear();
            } else if !line.is_empty() {
                desc_lines.push(line.trim().to_string());
            }
            continue;
        }

        if let Some(value) = line.strip_prefix("name:") {
            name = value.trim().to_string();
        } else if let Some(value) = line.strip_prefix("version:") {
            version = value.trim().to_string();
        } else if let Some(value) = line.strip_prefix("description:") {
            let trimmed = value.trim();
            // 支持各种块标量指示符
            if trimmed == "|" || trimmed == "|-" || trimmed == "|+"
                || trimmed == ">" || trimmed == ">-" || trimmed == ">+" {
                in_multiline_desc = true;
            } else {
                description = trimmed.to_string();
            }
        }
    }

    // 处理多行描述结束
    if in_multiline_desc && !desc_lines.is_empty() {
        description = desc_lines.join(" ").trim().to_string();
    }

    SkillFrontmatter {
        name,
        version,
        description,
        ..Default::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // ========================================
    // 基本解析测试
    // ========================================

    #[test]
    fn test_parse_simple_frontmatter() {
        let content = "---\nname: my-skill\nversion: 1.0.0\ndescription: A simple skill\n---\n# Content here";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.name, "my-skill");
        assert_eq!(result.version, "1.0.0");
        assert_eq!(result.description, "A simple skill");
    }

    #[test]
    fn test_parse_quoted_strings() {
        let content = "---\nname: \"My Skill: The Reboot\"\nversion: '2.0.0'\ndescription: \"A \\\"quoted\\\" description\"\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.name, "My Skill: The Reboot");
        assert_eq!(result.version, "2.0.0");
        assert_eq!(result.description, "A \"quoted\" description");
    }

    #[test]
    fn test_parse_block_scalar_literal() {
        let content = "---\nname: smart-commit\nversion: 1.0.0\ndescription: |\n  Intelligent git commit assistant.\n  \n  Supports multiple lines.\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        // YAML | block scalar preserves newlines
        assert!(result.description.contains("Intelligent git commit assistant."));
        assert!(result.description.contains("Supports multiple lines."));
    }

    #[test]
    fn test_parse_block_scalar_folded() {
        let content = "---\nname: api-designer\nversion: 1.0.0\ndescription: >-\n  API designer focuses on RESTful interfaces.\n  This line continues the description.\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        // Folded block scalar joins lines with space
        assert!(result.description.contains("RESTful interfaces."));
        assert!(result.description.contains("This line continues"));
    }

    #[test]
    fn test_parse_block_scalar_strip() {
        // Test |- (strip, remove trailing newlines)
        let content = "---\nname: test-skill\ndescription: |-\n  Line 1\n  Line 2\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert!(result.description.contains("Line 1"));
        assert!(result.description.contains("Line 2"));
    }

    #[test]
    fn test_parse_block_scalar_keep() {
        // Test |+ (keep, preserve trailing newlines)
        let content = "---\nname: test-skill\ndescription: |+\n  Line 1\n  Line 2\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert!(result.description.contains("Line 1"));
        assert!(result.description.contains("Line 2"));
    }

    // ========================================
    // 边界情况测试
    // ========================================

    #[test]
    fn test_parse_missing_frontmatter() {
        let content = "# Just markdown\nNo frontmatter here.";
        let result = SkillFrontmatter::from_content(content);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ParseError::NoFrontmatter));
    }

    #[test]
    fn test_parse_missing_frontmatter_with_fallback() {
        let content = "# Just markdown\nNo frontmatter here.";
        let options = ParseOptions {
            fallback_on_error: true,
            ..Default::default()
        };
        let result = parse_with_options(content, &options).unwrap();
        assert!(result.is_fallback);
        assert_eq!(result.frontmatter.name, "");
    }

    #[test]
    fn test_parse_missing_name() {
        let content = "---\nversion: 1.0.0\ndescription: Missing name field\n---\n";
        let result = SkillFrontmatter::from_content(content);
        // name 是必需字段，YAML 解析会失败
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_extra_fields() {
        let content = "---\nname: future-skill\nversion: 1.0.0\ncustom_field: custom_value\nanother_field: 123\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.name, "future-skill");
        assert!(result.extra.contains_key("custom_field"));
        assert!(result.extra.contains_key("another_field"));
    }

    #[test]
    fn test_parse_with_tags() {
        let content = "---\nname: tagged-skill\nversion: 1.0.0\ntags:\n  - git\n  - commit\n  - automation\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.tags, vec!["git", "commit", "automation"]);
    }

    #[test]
    fn test_parse_with_category_and_priority() {
        let content = "---\nname: agent-skill\nversion: 1.0.0\ncategory: agent\npriority: P1\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.category, Some("agent".to_string()));
        assert_eq!(result.priority, Some("P1".to_string()));
    }

    // ========================================
    // 降级处理测试
    // ========================================

    #[test]
    fn test_fallback_on_invalid_yaml() {
        let content = "---\nname: broken-skill\ndescription: [invalid yaml structure\nversion: 1.0.0\n---\n";
        let options = ParseOptions {
            fallback_on_error: true,
            ..Default::default()
        };
        let result = parse_with_options(content, &options);
        assert!(result.is_ok());
        let parsed = result.unwrap();
        assert!(parsed.is_fallback);
        // 降级解析应该提取出 name
        assert_eq!(parsed.frontmatter.name, "broken-skill");
    }

    #[test]
    fn test_no_fallback_strict_mode() {
        let content = "---\nname: broken-skill\ndescription: [invalid yaml\n---\n";
        let options = ParseOptions {
            fallback_on_error: false,
            ..Default::default()
        };
        let result = parse_with_options(content, &options);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), ParseError::InvalidYaml(_)));
    }

    // ========================================
    // 正文提取测试
    // ========================================

    #[test]
    fn test_extract_content() {
        let content = "---\nname: test\nversion: 1.0.0\n---\n\n# Heading\n\nSome content here.";
        let options = ParseOptions {
            extract_content: true,
            ..Default::default()
        };
        let result = parse_with_options(content, &options).unwrap();
        assert!(result.content.contains("# Heading"));
        assert!(result.content.contains("Some content here."));
    }

    #[test]
    fn test_no_extract_content() {
        let content = "---\nname: test\nversion: 1.0.0\n---\n\n# Heading\n\nSome content here.";
        let options = ParseOptions {
            extract_content: false,
            ..Default::default()
        };
        let result = parse_with_options(content, &options).unwrap();
        assert!(result.content.is_empty());
    }

    // ========================================
    // 真实技能测试
    // ========================================

    #[test]
    fn test_real_api_designer_format() {
        // 测试用户报告的问题格式
        let content = "---\nname: api-designer\ndescription: >-\n  Endpoint（API 设计师）专注于 RESTful/GraphQL 接口设计与文档生成。\n  Should be used when the user mentions designing APIs.\n  Distinguished from code-engineer.\ncategory: agent\npriority: P1\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.name, "api-designer");
        // 验证 description 正确解析
        assert!(result.description.contains("Endpoint"));
        assert!(result.description.contains("RESTful/GraphQL"));
        assert!(result.description.contains("designing APIs"));
        assert_eq!(result.category, Some("agent".to_string()));
        assert_eq!(result.priority, Some("P1".to_string()));
    }

    #[test]
    fn test_real_smart_commit_format() {
        let content = "---\nname: smart-commit\ndescription: |\n  Intelligent git commit assistant that analyzes uncommitted changes.\n\n  TRIGGER when: user says \"commit\".\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.name, "smart-commit");
        // YAML | block scalar preserves content
        assert!(result.description.contains("Intelligent git commit"));
        assert!(result.description.contains("TRIGGER when"));
    }

    // ========================================
    // 向后兼容测试
    // ========================================

    #[test]
    fn test_from_path_or_default_fallback() {
        // 测试不存在的文件 - 应该使用父文件夹名作为名称
        let path = Path::new("/nonexistent/path/SKILL.md");
        let result = SkillFrontmatter::from_path_or_default(path);
        // 文件不存在，但会降级使用父文件夹名
        assert!(result.is_some());
        assert_eq!(result.unwrap().name, "path");
    }

    #[test]
    fn test_default_version() {
        let content = "---\nname: no-version-skill\n---\n";
        let result = SkillFrontmatter::from_content(content).unwrap();
        assert_eq!(result.version, "0.0.0");
    }
}
