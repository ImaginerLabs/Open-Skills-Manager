use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::PathBuf;

use crate::commands::global::get_global_skills_path;
use crate::commands::library::load_skill_metadata;
use crate::commands::project::{get_active_ide_project_scope_name, load_projects};
use crate::paths::get_library_path;
use crate::parsers::SkillFrontmatter;
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum SearchScope {
    Library,
    Global,
    Project,
}

/// Search options for query
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchOptions {
    pub query: String,
    pub scope: Option<String>,
    pub project_id: Option<String>,
    pub category_id: Option<String>,
}

/// Search result without snippet
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub id: String,
    pub name: String,
    pub description: String,
    pub scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<String>,
}

/// Search result with matched snippet
#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultWithSnippet {
    pub id: String,
    pub name: String,
    pub description: String,
    pub scope: String,
    pub matched_snippet: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<String>,
}

/// In-memory search index
pub struct SearchIndex {
    /// Map from term to set of (skill_id, scope)
    index: HashMap<String, HashSet<(String, String)>>,
    /// Map from skill_id to searchable content
    documents: HashMap<String, SearchableDocument>,
}

#[derive(Debug, Clone)]
struct SearchableDocument {
    id: String,
    name: String,
    description: String,
    content: String,
    scope: String,
    project_id: Option<String>,
    category_id: Option<String>,
}

impl SearchIndex {
    pub fn new() -> Self {
        Self {
            index: HashMap::new(),
            documents: HashMap::new(),
        }
    }

    /// Build the search index from all skill sources
    pub fn build(&mut self) {
        self.index.clear();
        self.documents.clear();

        // Index library skills
        let library_count = self.index_library_skills();
        println!("[SearchIndex] Indexed {} library skills", library_count);

        // Index global skills
        let global_count = self.index_global_skills();
        println!("[SearchIndex] Indexed {} global skills", global_count);

        // Index project skills
        let project_count = self.index_project_skills();
        println!("[SearchIndex] Indexed {} project skills", project_count);

        println!("[SearchIndex] Total documents: {}, Total terms: {}", self.documents.len(), self.index.len());
    }

    fn index_library_skills(&mut self) -> usize {
        let library_path = get_library_path();
        if !library_path.exists() {
            println!("[SearchIndex] Library path does not exist: {:?}", library_path);
            return 0;
        }

        let skill_metadata = load_skill_metadata();
        let mut count = 0;

        if let Ok(entries) = fs::read_dir(&library_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let skill_md = path.join("SKILL.md");
                    if skill_md.exists() {
                        let folder_name = path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default();

                        // Get skill ID from metadata or use folder name
                        let skill_id = skill_metadata
                            .get(&folder_name)
                            .map(|m| m.id.clone())
                            .unwrap_or_else(|| folder_name.clone());

                        let category_id = skill_metadata
                            .get(&folder_name)
                            .and_then(|m| m.category_id.clone());

                        if let Some(doc) = self.read_skill_document(
                            &skill_id,
                            &path,
                            "library",
                            None,
                            category_id,
                        ) {
                            self.add_document(doc);
                            count += 1;
                        }
                    }
                }
            }
        }
        count
    }

    fn index_global_skills(&mut self) -> usize {
        let global_path = get_global_skills_path();
        if !global_path.exists() {
            println!("[SearchIndex] Global skills path does not exist: {:?}", global_path);
            return 0;
        }

        println!("[SearchIndex] Global skills path: {:?}", global_path);
        let mut count = 0;

        if let Ok(entries) = fs::read_dir(&global_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    let skill_md = path.join("SKILL.md");
                    if skill_md.exists() {
                        let folder_name = path
                            .file_name()
                            .map(|n| n.to_string_lossy().to_string())
                            .unwrap_or_default();

                        let skill_id = format!("global-{}", folder_name);

                        if let Some(doc) =
                            self.read_skill_document(&skill_id, &path, "global", None, None)
                        {
                            self.add_document(doc);
                            count += 1;
                        }
                    }
                }
            }
        }
        count
    }

    fn index_project_skills(&mut self) -> usize {
        let projects = load_projects();
        let project_scope_name = get_active_ide_project_scope_name();
        let mut count = 0;

        for project in projects {
            let project_path = PathBuf::from(&project.path);
            if !project_path.exists() {
                continue;
            }

            let skills_dir = project_path.join(&project_scope_name).join("skills");
            if !skills_dir.exists() {
                continue;
            }

            if let Ok(entries) = fs::read_dir(&skills_dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        let skill_md = path.join("SKILL.md");
                        if skill_md.exists() {
                            let folder_name = path
                                .file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_default();

                            let skill_id = format!("pskill-{}-{}", project.id, folder_name);

                            if let Some(doc) = self.read_skill_document(
                                &skill_id,
                                &path,
                                "project",
                                Some(project.id.clone()),
                                None,
                            ) {
                                self.add_document(doc);
                                count += 1;
                            }
                        }
                    }
                }
            }
        }
        count
    }

    fn read_skill_document(
        &self,
        skill_id: &str,
        path: &PathBuf,
        scope: &str,
        project_id: Option<String>,
        category_id: Option<String>,
    ) -> Option<SearchableDocument> {
        let skill_md = path.join("SKILL.md");
        let content = fs::read_to_string(&skill_md).ok()?;

        // Parse frontmatter
        let (name, description) = parse_skill_md_content(&content);

        Some(SearchableDocument {
            id: skill_id.to_string(),
            name,
            description,
            content,
            scope: scope.to_string(),
            project_id,
            category_id,
        })
    }

    fn add_document(&mut self, doc: SearchableDocument) {
        let skill_id = doc.id.clone();
        let scope = doc.scope.clone();

        // Tokenize and index all searchable text
        let searchable_text = format!("{} {} {}", doc.name, doc.description, doc.content);
        let terms = tokenize(&searchable_text);

        for term in terms {
            self.index
                .entry(term)
                .or_insert_with(HashSet::new)
                .insert((skill_id.clone(), scope.clone()));
        }

        self.documents.insert(skill_id, doc);
    }

    /// Search the index with given options
    pub fn search(&self, options: &SearchOptions) -> Vec<SearchResult> {
        let results = self.search_with_snippets(options);
        results
            .into_iter()
            .map(|r| SearchResult {
                id: r.id,
                name: r.name,
                description: r.description,
                scope: r.scope,
                project_id: r.project_id,
                category_id: r.category_id,
            })
            .collect()
    }

    /// Search with matched snippets
    pub fn search_with_snippets(&self, options: &SearchOptions) -> Vec<SearchResultWithSnippet> {
        if options.query.trim().is_empty() {
            return vec![];
        }

        let query_terms = tokenize(&options.query);
        if query_terms.is_empty() {
            return vec![];
        }

        // Find matching documents
        let mut matching_ids: HashSet<String> = HashSet::new();

        for term in &query_terms {
            if let Some(matches) = self.index.get(term) {
                for (skill_id, _) in matches {
                    matching_ids.insert(skill_id.clone());
                }
            }
        }

        // Build results with filtering
        let mut results: Vec<SearchResultWithSnippet> = matching_ids
            .iter()
            .filter_map(|id| self.documents.get(id))
            .filter(|doc| self.matches_filters(doc, options))
            .map(|doc| {
                let snippet = self.extract_snippet(&doc.content, &options.query);
                SearchResultWithSnippet {
                    id: doc.id.clone(),
                    name: doc.name.clone(),
                    description: doc.description.clone(),
                    scope: doc.scope.clone(),
                    matched_snippet: snippet,
                    project_id: doc.project_id.clone(),
                    category_id: doc.category_id.clone(),
                }
            })
            .collect();

        // Sort by relevance (number of matching terms)
        results.sort_by(|a, b| {
            let score_a = self.calculate_relevance_score(&a.id, &query_terms);
            let score_b = self.calculate_relevance_score(&b.id, &query_terms);
            score_b.cmp(&score_a)
        });

        results
    }

    fn matches_filters(&self, doc: &SearchableDocument, options: &SearchOptions) -> bool {
        // Filter by scope (but "all" means no filtering)
        if let Some(ref scope) = options.scope {
            if scope != "all" && &doc.scope != scope {
                return false;
            }
        }

        // Filter by project_id
        if let Some(ref project_id) = options.project_id {
            if doc.project_id.as_ref() != Some(project_id) {
                return false;
            }
        }

        // Filter by category_id
        if let Some(ref category_id) = options.category_id {
            if doc.category_id.as_ref() != Some(category_id) {
                return false;
            }
        }

        true
    }

    fn calculate_relevance_score(&self, skill_id: &str, query_terms: &[String]) -> usize {
        let mut score = 0;
        for term in query_terms {
            if let Some(matches) = self.index.get(term) {
                if matches.iter().any(|(id, _)| id == skill_id) {
                    score += 1;
                }
            }
        }
        score
    }

    fn extract_snippet(&self, content: &str, query: &str) -> String {
        let content_lower = content.to_lowercase();
        let query_lower = query.to_lowercase();

        // Find the first occurrence of the query
        if let Some(pos) = content_lower.find(&query_lower) {
            // Use char_indices to safely handle UTF-8 boundaries
            let char_indices: Vec<(usize, char)> = content.char_indices().collect();

            // Find the character index for the byte position
            let char_pos = char_indices.iter().position(|(i, _)| *i >= pos).unwrap_or(0);
            let start_char = char_pos.saturating_sub(20); // 20 characters before
            let end_char = (char_pos + query.chars().count() + 30).min(char_indices.len()); // 30 characters after

            // Get byte positions for safe slicing
            let start_byte = char_indices.get(start_char).map(|(i, _)| *i).unwrap_or(0);
            let end_byte = if end_char >= char_indices.len() {
                content.len()
            } else {
                char_indices[end_char].0
            };

            let mut snippet = content[start_byte..end_byte].to_string();

            // Add ellipsis if truncated
            if start_char > 0 {
                snippet = format!("...{}", snippet);
            }
            if end_char < char_indices.len() {
                snippet = format!("{}...", snippet);
            }

            // Clean up the snippet
            snippet = snippet.replace('\n', " ");
            snippet
        } else {
            // If exact query not found, return beginning of content (safe UTF-8 handling)
            let snippet: String = content.chars().take(50).collect();
            if content.chars().count() > 50 {
                format!("{}...", snippet.replace('\n', " "))
            } else {
                snippet.replace('\n', " ")
            }
        }
    }
}

impl Default for SearchIndex {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// Helper Functions
// ============================================================================

fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split_whitespace()
        .map(|word| {
            // Remove punctuation
            word.chars()
                .filter(|c| c.is_alphanumeric() || *c == '-')
                .collect::<String>()
        })
        .filter(|word| word.len() > 1) // Skip single characters
        .collect()
}

fn parse_skill_md_content(content: &str) -> (String, String) {
    match SkillFrontmatter::from_content(content) {
        Ok(fm) => (fm.name, fm.description),
        Err(_) => (String::new(), String::new()),
    }
}

// ============================================================================
// Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_tokenize() {
        let tokens = tokenize("Hello World Test");
        assert_eq!(tokens, vec!["hello", "world", "test"]);
    }

    #[test]
    fn test_tokenize_removes_punctuation() {
        let tokens = tokenize("Hello, World! Test.");
        assert_eq!(tokens, vec!["hello", "world", "test"]);
    }

    #[test]
    fn test_tokenize_skips_single_chars() {
        let tokens = tokenize("A B Test");
        assert_eq!(tokens, vec!["test"]);
    }

    #[test]
    fn test_parse_skill_md_content() {
        let content = "---\nname: My Skill\nversion: 1.0.0\ndescription: A test skill\n---\n\nContent here";
        let (name, desc) = parse_skill_md_content(content);
        assert_eq!(name, "My Skill");
        assert_eq!(desc, "A test skill");
    }

    #[test]
    fn test_parse_skill_md_content_multiline() {
        let content = "---\nname: smart-commit\nversion: 1.0.0\ndescription: |\n  Intelligent git commit assistant that analyzes uncommitted changes.\n\n  TRIGGER when: user says \"commit\".\n---\n\nContent here";
        let (name, desc) = parse_skill_md_content(content);
        assert_eq!(name, "smart-commit");
        // YAML | block scalar preserves newlines
        assert!(desc.contains("Intelligent git commit assistant"));
        assert!(desc.contains("TRIGGER when"));
    }

    #[test]
    fn test_parse_skill_md_content_folded_block() {
        // Test YAML folded block scalar (>-)
        let content = "---\nname: api-designer\nversion: 1.0.0\ndescription: >-\n  Endpoint（API 设计师）专注于 RESTful/GraphQL 接口设计与文档生成。\n  Should be used when the user mentions designing APIs.\n---\n\nContent here";
        let (name, desc) = parse_skill_md_content(content);
        assert_eq!(name, "api-designer");
        // YAML >- folded block scalar joins lines with space
        assert!(desc.contains("Endpoint"));
        assert!(desc.contains("RESTful/GraphQL"));
    }

    #[test]
    fn test_search_index_new() {
        let index = SearchIndex::new();
        assert!(index.index.is_empty());
        assert!(index.documents.is_empty());
    }

    #[test]
    fn test_extract_snippet() {
        let index = SearchIndex::new();
        // Long enough content with match far from edges
        let content = "This is a very long piece of content with many words and spaces before we find a MATCH somewhere in the middle of it all and even more text after to ensure proper truncation.";

        let snippet = index.extract_snippet(content, "MATCH");
        assert!(snippet.contains("MATCH"));
        // Match position is ~91, so start = 41, which needs ellipsis
        assert!(snippet.starts_with("..."));
        assert!(snippet.ends_with("..."));
    }

    #[test]
    fn test_extract_snippet_near_start() {
        let index = SearchIndex::new();
        // Match near start of content
        let content = "MATCH found at the beginning of this content string that continues with more text.";

        let snippet = index.extract_snippet(content, "MATCH");
        assert!(snippet.contains("MATCH"));
        // Match at position 0, so no ellipsis at start
        assert!(!snippet.starts_with("..."));
    }

    #[test]
    fn test_search_empty_query() {
        let mut index = SearchIndex::new();
        index.build();

        let options = SearchOptions {
            query: "".to_string(),
            scope: None,
            project_id: None,
            category_id: None,
        };

        let results = index.search(&options);
        assert!(results.is_empty());
    }
}
