//! SKILL.md 文件解析模块
//!
//! 提供 YAML frontmatter 解析功能，支持:
//! - 标准 YAML 语法 (引号、转义、块标量)
//! - 向后兼容 (降级处理)
//! - 可扩展字段

pub mod skill_md;

pub use skill_md::{SkillFrontmatter, ParsedSkill, ParseError, ParseOptions};