// SkillService - Unified skill operations service

use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

use crate::parsers::SkillFrontmatter;
use crate::utils::fs::{count_files, has_resources, is_symlink};

/// Parsed skill metadata from SKILL.md frontmatter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillMeta {
    pub name: String,
    pub version: String,
    pub description: String,
}

impl From<SkillFrontmatter> for SkillMeta {
    fn from(fm: SkillFrontmatter) -> Self {
        Self {
            name: fm.name,
            version: fm.version,
            description: fm.description,
        }
    }
}

/// Common skill scan result
#[derive(Debug, Clone)]
pub struct ScannedSkill {
    pub id: String,
    pub folder_name: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub path: String,
    pub skill_md_path: String,
    pub size: u64,
    pub file_count: u32,
    pub skill_md_lines: u32,
    pub skill_md_chars: u32,
    pub has_resources: bool,
    pub is_symlink: bool,
    pub installed_at: Option<String>,
}

/// Skill scanning options
pub struct ScanOptions {
    /// Include symlink detection
    pub check_symlink: bool,
    /// Include installed_at timestamp
    pub include_timestamp: bool,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            check_symlink: true,
            include_timestamp: true,
        }
    }
}

/// SkillService provides unified skill scanning and operations
pub struct SkillService;

impl SkillService {
    /// Parse SKILL.md frontmatter using existing parser
    pub fn parse_skill_md(path: &Path) -> Option<SkillMeta> {
        SkillFrontmatter::from_path_or_default(path).map(SkillMeta::from)
    }

    /// Count lines and characters in a SKILL.md file
    pub fn count_skill_md_stats(path: &Path) -> (u32, u32) {
        fs::read_to_string(path)
            .map(|content| {
                let lines = content.lines().count() as u32;
                let chars = content.chars().count() as u32;
                (lines, chars)
            })
            .unwrap_or((0, 0))
    }

    /// Scan a directory for skills
    pub fn scan_skills_dir(dir: &Path, options: ScanOptions) -> Vec<ScannedSkill> {
        let mut skills = Vec::new();

        if !dir.exists() {
            return skills;
        }

        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    if let Some(skill) = Self::scan_skill(&path, &options) {
                        skills.push(skill);
                    }
                }
            }
        }

        skills
    }

    /// Scan a single skill directory
    pub fn scan_skill(path: &Path, options: &ScanOptions) -> Option<ScannedSkill> {
        let skill_md = path.join("SKILL.md");
        if !skill_md.exists() {
            return None;
        }

        let folder_name = path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let metadata = Self::parse_skill_md(&skill_md);
        let (size, file_count) = count_files(path);
        let (skill_md_lines, skill_md_chars) = Self::count_skill_md_stats(&skill_md);

        let installed_at = if options.include_timestamp {
            fs::metadata(path)
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let datetime: chrono::DateTime<chrono::Utc> = t.into();
                    datetime.to_rfc3339()
                })
        } else {
            None
        };

        Some(ScannedSkill {
            id: folder_name.clone(),
            folder_name: folder_name.clone(),
            name: metadata.as_ref().map(|m| m.name.clone()).unwrap_or(folder_name),
            version: metadata.as_ref().map(|m| m.version.clone()).unwrap_or_else(|| "0.0.0".to_string()),
            description: metadata.as_ref().map(|m| m.description.clone()).unwrap_or_default(),
            path: path.to_string_lossy().to_string(),
            skill_md_path: skill_md.to_string_lossy().to_string(),
            size,
            file_count,
            skill_md_lines,
            skill_md_chars,
            has_resources: has_resources(path),
            is_symlink: if options.check_symlink { is_symlink(path) } else { false },
            installed_at,
        })
    }

    /// Read SKILL.md content
    pub fn read_skill_md_content(path: &Path) -> Option<String> {
        fs::read_to_string(path).ok()
    }

    /// Delete a skill directory
    pub fn delete_skill(path: &Path) -> Result<(), String> {
        if is_symlink(path) {
            fs::remove_file(path).map_err(|e| e.to_string())
        } else {
            fs::remove_dir_all(path).map_err(|e| e.to_string())
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::TempDir;

    fn create_test_skill(dir: &Path, name: &str) -> PathBuf {
        let skill_dir = dir.join(name);
        fs::create_dir_all(&skill_dir).unwrap();

        let skill_md = skill_dir.join("SKILL.md");
        let content = r#"---
name: Test Skill
version: 1.0.0
description: A test skill
---

# Test Skill

This is a test skill.
"#;
        fs::write(&skill_md, content).unwrap();

        skill_dir
    }

    #[test]
    fn test_parse_skill_md() {
        let temp_dir = TempDir::new().unwrap();
        let skill_dir = create_test_skill(temp_dir.path(), "test-skill");
        let skill_md = skill_dir.join("SKILL.md");

        let result = SkillService::parse_skill_md(&skill_md);

        assert!(result.is_some());
        let meta = result.unwrap();
        assert_eq!(meta.name, "Test Skill");
        assert_eq!(meta.version, "1.0.0");
        assert_eq!(meta.description, "A test skill");
    }

    #[test]
    fn test_count_skill_md_stats() {
        let temp_dir = TempDir::new().unwrap();
        let skill_dir = create_test_skill(temp_dir.path(), "test-skill");
        let skill_md = skill_dir.join("SKILL.md");

        let (lines, chars) = SkillService::count_skill_md_stats(&skill_md);

        assert!(lines > 0);
        assert!(chars > 0);
    }

    #[test]
    fn test_scan_skill() {
        let temp_dir = TempDir::new().unwrap();
        create_test_skill(temp_dir.path(), "test-skill");
        let skill_path = temp_dir.path().join("test-skill");

        let result = SkillService::scan_skill(&skill_path, &ScanOptions::default());

        assert!(result.is_some());
        let skill = result.unwrap();
        assert_eq!(skill.name, "Test Skill");
        assert_eq!(skill.version, "1.0.0");
        assert!(skill.installed_at.is_some());
    }

    #[test]
    fn test_scan_skills_dir() {
        let temp_dir = TempDir::new().unwrap();
        create_test_skill(temp_dir.path(), "skill-one");
        create_test_skill(temp_dir.path(), "skill-two");

        let result = SkillService::scan_skills_dir(temp_dir.path(), ScanOptions::default());

        assert_eq!(result.len(), 2);
    }

    #[test]
    fn test_delete_skill() {
        let temp_dir = TempDir::new().unwrap();
        let skill_dir = create_test_skill(temp_dir.path(), "to-delete");

        assert!(skill_dir.exists());
        let result = SkillService::delete_skill(&skill_dir);
        assert!(result.is_ok());
        assert!(!skill_dir.exists());
    }
}
