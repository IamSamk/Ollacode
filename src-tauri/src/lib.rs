use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct FileEntry {
    name: String,
    path: String,
    is_directory: bool,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir_path = Path::new(&path);
    
    if !dir_path.exists() {
        return Err("Directory does not exist".to_string());
    }
    
    if !dir_path.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    let mut entries = Vec::new();
    
    match fs::read_dir(dir_path) {
        Ok(dir_entries) => {
            for entry in dir_entries {
                match entry {
                    Ok(dir_entry) => {
                        let file_name = dir_entry.file_name().to_string_lossy().to_string();
                        let file_path = dir_entry.path().to_string_lossy().to_string();
                        let is_directory = dir_entry.path().is_dir();
                        
                        entries.push(FileEntry {
                            name: file_name,
                            path: file_path,
                            is_directory,
                        });
                    }
                    Err(e) => {
                        eprintln!("Error reading directory entry: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Failed to read directory: {}", e));
        }
    }
    
    // Sort entries: directories first, then files, both alphabetically
    entries.sort_by(|a, b| {
        match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });
    
    Ok(entries)
}

#[tauri::command]
async fn read_file_content(path: String) -> Result<String, String> {
    match fs::read_to_string(&path) {
        Ok(content) => Ok(content),
        Err(e) => Err(format!("Failed to read file: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, read_directory, read_file_content])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
