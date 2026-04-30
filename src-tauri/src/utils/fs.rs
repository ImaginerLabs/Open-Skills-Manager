//! File system utility functions
//!
//! Provides common file system operations used across the codebase.

use std::fs;
use std::io;
use std::path::Path;

/// Copy a directory recursively, preserving symlinks.
///
/// This is the most complete implementation that handles:
/// - Regular files
/// - Directories (recursive)
/// - Symbolic links (preserves the link, not the target)
pub fn copy_dir_all(src: &Path, dst: &Path) -> io::Result<()> {
    fs::create_dir_all(dst)?;

    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        // Use symlink_metadata to not follow symlinks
        let metadata = fs::symlink_metadata(&src_path)?;
        let file_type = metadata.file_type();

        if file_type.is_symlink() {
            // Read the symlink target
            let target = fs::read_link(&src_path)?;
            // Create the same symlink at destination
            #[cfg(unix)]
            std::os::unix::fs::symlink(&target, &dst_path)?;
            #[cfg(windows)]
            std::os::windows::fs::symlink_file(&target, &dst_path)?;
        } else if file_type.is_dir() {
            copy_dir_all(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }

    Ok(())
}

/// Copy a directory recursively with string error messages.
///
/// Simplified version for use in contexts where io::Result is not desired.
pub fn copy_dir_all_str(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst)
        .map_err(|e| format!("Failed to create dir: {}", e))?;

    for entry in fs::read_dir(src)
        .map_err(|e| format!("Failed to read dir: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());

        if src_path.is_dir() {
            copy_dir_all_str(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }

    Ok(())
}

/// Count files in a directory recursively and calculate total size.
///
/// Returns (total_size in bytes, file_count).
/// Note: Uses u32 for file_count to match existing LibrarySkill interface.
pub fn count_files(dir: &Path) -> (u64, u32) {
    let mut total_size = 0u64;
    let mut file_count = 0u32;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Ok(metadata) = fs::metadata(&path) {
                    total_size += metadata.len();
                    file_count += 1;
                }
            } else if path.is_dir() {
                let (sub_size, sub_count) = count_files(&path);
                total_size += sub_size;
                file_count += sub_count;
            }
        }
    }

    (total_size, file_count)
}

/// Count files in a directory recursively (usize version).
///
/// Returns (total_size in bytes, file_count as usize).
/// Used by search_index.rs.
pub fn count_files_usize(dir: &Path) -> (u64, usize) {
    let mut total_size = 0u64;
    let mut file_count = 0usize;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(metadata) = entry.metadata() {
                if metadata.is_file() {
                    total_size += metadata.len();
                    file_count += 1;
                } else if metadata.is_dir() {
                    let (sub_size, sub_count) = count_files_usize(&entry.path());
                    total_size += sub_size;
                    file_count += sub_count;
                }
            }
        }
    }

    (total_size, file_count)
}

/// Check if a directory contains resources (files other than SKILL.md).
///
/// Used to determine if a skill has additional files beyond the SKILL.md.
pub fn has_resources(dir: &Path) -> bool {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let name_str = name.to_string_lossy();
            if name_str != "SKILL.md" && !name_str.starts_with('.') {
                return true;
            }
        }
    }
    false
}

/// Check if a path is a symlink (does not follow the link).
pub fn is_symlink(path: &Path) -> bool {
    fs::symlink_metadata(path)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
}

/// Check if a directory contains a SKILL.md file.
pub fn has_skill_md(dir: &Path) -> bool {
    dir.join("SKILL.md").exists()
}

/// Get file modified time as ISO 8601 string.
///
/// Returns None if the file doesn't exist or metadata cannot be read.
pub fn get_modified_time(path: &Path) -> Option<String> {
    fs::metadata(path)
        .ok()
        .and_then(|m| m.modified().ok())
        .map(|t| {
            let datetime: chrono::DateTime<chrono::Utc> = t.into();
            datetime.to_rfc3339()
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use tempfile::TempDir;

    #[test]
    fn test_count_files_empty_dir() {
        let temp = TempDir::new().unwrap();
        let (size, count) = count_files(temp.path());
        assert_eq!(size, 0);
        assert_eq!(count, 0);
    }

    #[test]
    fn test_count_files_with_file() {
        let temp = TempDir::new().unwrap();
        let file_path = temp.path().join("test.txt");
        fs::write(&file_path, "hello world").unwrap();

        let (size, count) = count_files(temp.path());
        assert_eq!(size, 11);
        assert_eq!(count, 1);
    }

    #[test]
    fn test_count_files_nested() {
        let temp = TempDir::new().unwrap();
        let nested = temp.path().join("nested");
        fs::create_dir(&nested).unwrap();
        fs::write(nested.join("inner.txt"), "content").unwrap();
        fs::write(temp.path().join("outer.txt"), "more").unwrap();

        let (size, count) = count_files(temp.path());
        assert_eq!(size, 11); // "content" (7) + "more" (4)
        assert_eq!(count, 2);
    }

    #[test]
    fn test_has_skill_md_true() {
        let temp = TempDir::new().unwrap();
        fs::write(temp.path().join("SKILL.md"), "---\nname: test\n---").unwrap();
        assert!(has_skill_md(temp.path()));
    }

    #[test]
    fn test_has_skill_md_false() {
        let temp = TempDir::new().unwrap();
        fs::write(temp.path().join("other.md"), "content").unwrap();
        assert!(!has_skill_md(temp.path()));
    }

    #[test]
    fn test_has_resources_true() {
        let temp = TempDir::new().unwrap();
        fs::write(temp.path().join("SKILL.md"), "content").unwrap();
        fs::write(temp.path().join("helper.py"), "code").unwrap();
        assert!(has_resources(temp.path()));
    }

    #[test]
    fn test_has_resources_false() {
        let temp = TempDir::new().unwrap();
        fs::write(temp.path().join("SKILL.md"), "content").unwrap();
        assert!(!has_resources(temp.path()));
    }

    #[test]
    fn test_copy_dir_all() {
        let src_temp = TempDir::new().unwrap();
        let dst_temp = TempDir::new().unwrap();

        // Create source structure
        fs::write(src_temp.path().join("file.txt"), "content").unwrap();
        let nested = src_temp.path().join("nested");
        fs::create_dir(&nested).unwrap();
        fs::write(nested.join("inner.txt"), "inner content").unwrap();

        // Copy
        copy_dir_all(src_temp.path(), dst_temp.path()).unwrap();

        // Verify
        assert!(dst_temp.path().join("file.txt").exists());
        assert!(dst_temp.path().join("nested/inner.txt").exists());
    }
}