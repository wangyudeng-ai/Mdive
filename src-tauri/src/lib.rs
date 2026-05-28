use serde::Serialize;
use std::sync::Mutex;
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    AppHandle, Emitter, State, WebviewWindowBuilder,
};

#[derive(Serialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub extension: Option<String>,
}

pub struct WatcherState(pub Mutex<Option<notify::RecommendedWatcher>>);

// ── 目录列表 ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn list_directory(path: &str) -> Result<Vec<FileEntry>, String> {
    let dir = std::fs::read_dir(path).map_err(|e| e.to_string())?;

    let mut entries: Vec<FileEntry> = dir
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path()
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| !n.starts_with('.'))
                .unwrap_or(false)
        })
        .map(|e| {
            let p = e.path();
            let is_dir = p.is_dir();
            let extension = if is_dir {
                None
            } else {
                p.extension().and_then(|x| x.to_str()).map(|s| s.to_lowercase())
            };
            FileEntry {
                name: p.file_name().unwrap_or_default().to_string_lossy().to_string(),
                path: p.to_string_lossy().to_string(),
                is_dir,
                extension,
            }
        })
        .collect();

    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(entries)
}

// ── 文件读写 ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn read_text_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_text_file(path: &str, content: &str) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

// ── 文件系统监听 ───────────────────────────────────────────────────────────────

#[tauri::command]
fn watch_workspace(
    path: String,
    app: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    use notify::{RecursiveMode, Watcher};

    let mut watcher_guard = state.0.lock().unwrap();

    // 停止旧的监听
    *watcher_guard = None;

    let app_handle = app.clone();
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<notify::Event>| {
        if let Ok(event) = res {
            let paths: Vec<String> = event
                .paths
                .iter()
                .map(|p| p.to_string_lossy().to_string())
                .collect();
            let _ = app_handle.emit("file-changed", paths);
        }
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    *watcher_guard = Some(watcher);
    Ok(())
}

// ── 新窗口打开文件 ─────────────────────────────────────────────────────────────

#[tauri::command]
fn open_new_window(app: AppHandle, file_path: String) -> Result<(), String> {
    let label = format!(
        "file-{}",
        file_path
            .chars()
            .map(|c| if c.is_alphanumeric() { c } else { '_' })
            .collect::<String>()
            .chars()
            .rev()
            .take(40)
            .collect::<String>()
            .chars()
            .rev()
            .collect::<String>()
    );

    let encoded = urlencoding::encode(&file_path).to_string();
    let url = format!("/?file={}", encoded);

    WebviewWindowBuilder::new(&app, &label, tauri::WebviewUrl::App(url.into()))
        .title(
            std::path::Path::new(&file_path)
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string(),
        )
        .inner_size(1200.0, 800.0)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ── 在 Finder 中显示 ──────────────────────────────────────────────────────────

#[tauri::command]
fn reveal_in_finder(path: &str) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .args(["-R", path])
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .args(["/select,", path])
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

// ── 全文搜索 ──────────────────────────────────────────────────────────────────

#[derive(Serialize, Clone)]
pub struct SearchHit {
    pub path: String,
    pub name: String,
    pub line: usize,
    pub text: String,
}

#[tauri::command]
fn search_workspace(root: &str, query: &str) -> Result<Vec<SearchHit>, String> {
    if query.trim().is_empty() {
        return Ok(vec![]);
    }
    let needle = query.to_lowercase();
    let mut hits = Vec::new();
    let max_results = 200;
    walk_search(std::path::Path::new(root), &needle, &mut hits, max_results);
    Ok(hits)
}

fn walk_search(dir: &std::path::Path, needle: &str, hits: &mut Vec<SearchHit>, limit: usize) {
    if hits.len() >= limit {
        return;
    }
    let Ok(entries) = std::fs::read_dir(dir) else { return };
    for entry in entries.flatten() {
        if hits.len() >= limit {
            return;
        }
        let p = entry.path();
        let name = match p.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if name.starts_with('.') {
            continue;
        }
        if p.is_dir() {
            if matches!(name.as_str(), "node_modules" | "target" | "dist") {
                continue;
            }
            walk_search(&p, needle, hits, limit);
        } else {
            let ext = p.extension().and_then(|e| e.to_str()).map(|s| s.to_lowercase());
            if !matches!(ext.as_deref(), Some("md") | Some("mdx") | Some("markdown") | Some("txt")) {
                continue;
            }
            let Ok(content) = std::fs::read_to_string(&p) else { continue };
            for (i, line) in content.lines().enumerate() {
                if hits.len() >= limit {
                    return;
                }
                if line.to_lowercase().contains(needle) {
                    hits.push(SearchHit {
                        path: p.to_string_lossy().to_string(),
                        name: name.clone(),
                        line: i + 1,
                        text: line.trim().chars().take(200).collect(),
                    });
                }
            }
        }
    }
}

// ── Tauri 入口 ─────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .manage(WatcherState(Mutex::new(None)))
        .on_menu_event(|app, event| {
            let _ = app.emit("menu-action", event.id().as_ref());
        })
        .invoke_handler(tauri::generate_handler![
            list_directory,
            read_text_file,
            write_text_file,
            watch_workspace,
            open_new_window,
            reveal_in_finder,
            search_workspace,
        ])
        .setup(|app| {
            let menu = build_menu(app)?;
            app.set_menu(menu)?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_menu(app: &tauri::App) -> tauri::Result<tauri::menu::Menu<tauri::Wry>> {
    // 文件
    let file_menu = SubmenuBuilder::new(app, "文件")
        .item(&MenuItemBuilder::with_id("new_file", "新建文件").accelerator("CmdOrCtrl+N").build(app)?)
        .item(&MenuItemBuilder::with_id("open_workspace", "打开工作区…").accelerator("CmdOrCtrl+O").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("save", "保存").accelerator("CmdOrCtrl+S").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("close_tab", "关闭标签页").accelerator("CmdOrCtrl+W").build(app)?)
        .build()?;

    // 编辑
    let edit_menu = SubmenuBuilder::new(app, "编辑")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .separator()
        .item(&MenuItemBuilder::with_id("find_in_workspace", "工作区查找").accelerator("CmdOrCtrl+Shift+F").build(app)?)
        .build()?;

    // 视图
    let view_menu = SubmenuBuilder::new(app, "视图")
        .item(&MenuItemBuilder::with_id("toggle_theme", "切换深色/浅色模式").build(app)?)
        .separator()
        .fullscreen()
        .build()?;

    // 窗口
    let window_menu = SubmenuBuilder::new(app, "窗口")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&file_menu, &edit_menu, &view_menu, &window_menu])
        .build()?;

    Ok(menu)
}
