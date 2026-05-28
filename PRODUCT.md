# MDive — 产品文档

> 中文名：**墨潜**
> Slogan：潜入你的 Markdown 工作区
> 轻量级本地文件查看与 Markdown 编辑器
> 基于 Tauri v2 + React + TypeScript 构建
> 最后更新：2026-05-28

---

## 一、产品定位

MDive（墨潜）是一个以**工作区文件夹**为核心的桌面工具，兼顾两种使用场景：

- **配合外部编辑器**（VS Code / Claude Code）：作为实时渲染查看器，外部修改文件后自动刷新预览
- **独立使用**：作为轻量 Markdown 编辑器，左右分栏编辑与预览同步

**目标用户**：开发者、技术写作者，习惯用 VS Code 写 Markdown 但希望有一个好看的并排查看/编辑工具。

**核心差异化**：
- 工作区文件夹为核心，而非单文件
- 支持 .md / .png / .jpg / .pdf 多格式内嵌预览
- 实时监听文件系统变更，自动重渲染
- 多标签页 + 右键新窗口，支持多文件并排查看
- 分栏模式下左右同步滚动

---

## 二、技术架构

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 桌面壳 | **Tauri v2** | Rust 后端，系统 API 调用 |
| 前端框架 | **React + TypeScript** | UI 层 |
| 构建工具 | **Vite** | 快速 HMR |
| 样式方案 | **CSS Variables + 自定义主题** | 亮色 / 暗色主题变量，全局按钮与排版样式 |
| Markdown 渲染 | **marked.js** | 轻量快速渲染 |
| 代码高亮 | **highlight.js** | 代码块语法着色 |
| 文件监听 | **Tauri `tauri-plugin-fs` watch** | 实时监听工作区文件变更 |
| 图标 | **react-icons** | Feather Icons |

### 运行时依赖

- `@tauri-apps/api` — Tauri 前端 API
- `@tauri-apps/plugin-dialog` — 原生文件夹选择对话框
- `@tauri-apps/plugin-fs` — 文件读写 + 目录监听
- `@tauri-apps/plugin-shell` — 用系统程序打开不支持的文件
- `marked` — Markdown 渲染
- `highlight.js` — 代码高亮
- `react-icons` — 图标库

### Rust 后端命令

| 命令 | 说明 |
|------|------|
| `list_directory` | 读取目录内容，返回文件名/路径/类型 |
| `read_text_file` | 读取文本文件内容 |
| `write_text_file` | 写入文本文件 |
| `watch_workspace` | 启动文件系统监听，变更时 emit 事件到前端 |
| `open_new_window` | 在新 Tauri 窗口打开指定文件 |

---

## 三、功能清单

### 已实现

| 功能 | 说明 |
|------|------|
| 启动选工作区 | 打开应用时选择本地文件夹，记住上次路径 |
| 左侧文件树 | 递归展开/折叠，所有文件类型 |
| 顶部标签页 | 多文件并排，关闭 / 新建 |
| Markdown 分栏 | 左源码编辑 + 右 marked.js 实时预览，拖拽调整宽度 |
| 分栏同步滚动 | 左右任意一侧滚动，另一侧按比例跟随 |
| Mermaid 预览 | 代码块 \`\`\`mermaid 自动渲染为 SVG 流程图，支持亮/暗主题 |
| 图片预览 | .png/.jpg/.gif/.webp/.svg 内嵌预览 |
| PDF 预览 | .pdf 内嵌 WebView 渲染 |
| 不支持文件提示 | 其他类型显示提示 + 系统程序打开 |
| 实时刷新 | 文件系统监听，外部修改后自动重渲染 |
| 右键菜单 | 在新窗口打开 / 在访达中显示 |
| Cmd+S 保存 | 快捷键保存当前文件 |
| 主题切换 | 暗色 / 亮色主题，Mermaid 图随主题联动 |
| 工作区持久化 | 记住上次打开的工作区路径 |
| 状态栏 | 显示当前文件路径和保存状态 |

### 开发中

_（暂无，v1.0.0 已发布并安装至本地。后续工作见下方 Backlog。）_

### 待规划 (Backlog)

#### 功能 Backlog

| 功能 | 说明 | 优先级 |
|------|------|--------|
| 文件重命名/删除 | 文件树右键菜单 | P3 |
| 自动保存（可选项） | 当前固定手动 Cmd+S，将来或可加防抖自动保存开关 | P3 |
| 大纲实时高亮当前章节 | 滚动正文时大纲对应项高亮 | P3 |
| 拖入文件打开 | 拖文件到窗口直接打开 | P3 |
| 最近工作区列表 | 欢迎页显示历史工作区，快速切换 | P3 |

#### 发布与分发 Backlog

| 事项 | 说明 | 状态 |
|------|------|------|
| 代码签名 + Apple Notarization | 需 Apple 开发者账号（$99/年）。签名后 dmg 分发给他人不会被 Gatekeeper 拦截 | 待规划 |
| 自动更新机制 | `tauri-plugin-updater`，应用内检测新版本并自动下载 | 待规划 |
| Windows / Linux 跨平台构建 | 当前仅 macOS。需要分别在对应系统上 `tauri build` | 待规划 |
| 崩溃日志收集 | `tauri-plugin-log` 写入本地 log 文件，便于排查问题 | 待规划 |
| CI 自动构建发布 | GitHub Actions release workflow，推 tag 自动出 dmg/exe | 待规划 |

---

## 四、UI 结构

```
┌───────────────────────────────────────────────────────────┐
│  Title Bar：[工作区名称]                       [🌙] [...]  │
├──────────────────────────────────────────────────────────┤
│  [README.md ×]  [design.md ×]  [notes.md ×]         [+]  │  ← 标签页
├─────────────┬────────────────────┬───────────────────────┤
│             │                    │                        │
│  文件树      │  源码编辑区         │  渲染预览区            │
│             │  (textarea /       │  (marked.js)           │
│  workspace/ │   CodeMirror)      │                        │
│  ├─ docs/   │                    │                        │
│  │  ├─ README.md                 │                        │
│  │  └─ design.md                 │                        │
│  ├─ img/    │                    │                        │
│  └─ ...     │                    │                        │
│             │                    │                        │
├─────────────┴────────────────────┴───────────────────────┤
│  Status Bar：workspace/docs/README.md · 已保存            │
└───────────────────────────────────────────────────────────┘
```

### 文件类型渲染规则

| 扩展名 | 渲染方式 |
|--------|---------|
| `.md` `.mdx` `.markdown` | 分栏：左源码 + 右 marked.js 预览 |
| `.png` `.jpg` `.jpeg` `.gif` `.webp` `.svg` | 居中 `<img>` 预览 |
| `.pdf` | 全区域 `<iframe>` 内嵌渲染 |
| 其他 | 灰色提示："不支持预览此文件类型" |

### 右键菜单（文件树）

- 在新窗口打开
- 在访达中显示（macOS）/ 在文件管理器中显示（Windows）
- _(后续)_ 重命名 / 删除

---

## 五、数据流

```
启动
  └─▶ 选择工作区文件夹
        └─▶ 读取目录树 (list_directory)
              └─▶ 渲染左侧文件树

点击文件
  └─▶ 判断文件类型
        ├─▶ .md  → 读取内容 → 分栏渲染
        ├─▶ 图片 → 生成本地 asset URL → <img>
        ├─▶ .pdf → 生成本地 asset URL → <iframe>
        └─▶ 其他 → 提示不支持

文件系统监听 (watch_workspace)
  └─▶ 文件变更事件
        └─▶ 当前标签对应文件？
              ├─▶ 是 → 重新读取 + 重渲染
              └─▶ 否 → 标签显示"已修改"角标

外部修改文件（VS Code 保存）
  └─▶ watch 事件触发 → 自动刷新对应标签内容
```

---

## 六、项目结构（目标）

```
md-editor/
├── PRODUCT.md                        # 本产品文档
├── package.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx                      # React 入口
│   ├── App.tsx                       # 根组件，工作区状态管理
│   ├── index.css                     # 全局样式 + 主题变量
│   ├── hooks/
│   │   ├── useWorkspace.ts           # 工作区状态（路径/文件树）
│   │   ├── useFileWatcher.ts         # 文件系统监听
│   │   └── useTheme.ts               # 主题管理
│   ├── utils/
│   │   └── fileType.ts               # 文件类型判断工具
│   └── components/
│       ├── Layout/
│       │   ├── TitleBar.tsx          # 顶栏
│       │   ├── TabBar.tsx            # 标签页
│       │   ├── StatusBar.tsx         # 状态栏
│       │   └── Sidebar.tsx           # 文件树容器
│       ├── FileTree/
│       │   ├── FileTree.tsx          # 文件树组件
│       │   ├── FileTreeNode.tsx      # 单个节点（文件/文件夹）
│       │   └── ContextMenu.tsx       # 右键菜单
│       └── Viewer/
│           ├── MarkdownViewer.tsx    # 分栏 Markdown 编辑+预览
│           ├── ImageViewer.tsx       # 图片预览
│           ├── PdfViewer.tsx         # PDF 预览
│           └── UnsupportedViewer.tsx # 不支持文件提示
└── src-tauri/
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── src/
    │   ├── main.rs
    │   └── lib.rs                    # 所有 Tauri 命令
    └── capabilities/
        └── default.json
```

---

## 七、变更记录

| 日期 | 版本 | 变更内容 | 负责人 |
|------|------|---------|--------|
| 2026-05-13 | v0.0.1 | 产品文档初稿 | Claude |
| 2026-05-13 | v0.1.1 | 应用 Cohere 设计规范：Light 主题换 soft-stone/ink/hairline/action-blue，Dark 主题换深绿 #003c33，字体换 Inter，标题负字距，状态栏改为 near-black | Claude |
| 2026-05-13 | v0.1.2 | 修复同步滚动抖动：用 setTimeout(100ms) timer id 替代 rAF boolean 锁，避免 scroll 事件 ping-pong 回弹 | Claude |
| 2026-05-13 | v0.1.4 | 修复导出 PDF：改用 html2canvas + jsPDF 生成真实 PDF，Tauri save 对话框选路径，默认文件名为当前文件名，导出中按钮禁用 | Claude |
| 2026-05-13 | v0.1.5 | 暗色主题换成深海军蓝 #071829，强调色改为 focus-blue #4c6ee6；亮色文件夹图标改为 action-blue | Claude |
| 2026-05-13 | v0.1.6 | 亮色次级文字加深：#93939f → #616161（body-muted），改善标签页和分栏标题可读性 | Claude |
| 2026-05-13 | v0.1.7 | 静态测试通过；导出 PDF 修复：暗色主题下临时切换到亮色避免白底白字、增加错误提示、清理 Rust 未使用导入 | Claude |
| 2026-05-14 | v0.2.0 | 新增三档视图切换（源码 / 分栏 / 预览）；预览模式下预览区左侧显示文档大纲（h1-h6），点击标题平滑滚动到对应位置；大纲仅在预览模式触发，不与左侧文件树关联 | Claude |
| 2026-05-14 | v0.2.1 | 调整预览区层级：「预览」header 跨满整个预览栏顶部，大纲降为内部子面板（轻量小标题），从属关系更清晰 | Claude |
| 2026-05-14 | v0.3.0 | 新增 Markdown 快捷工具栏（加粗/斜体/删除线/标题/列表/引用/代码/链接/图片/表格）；Cmd+B、Cmd+I 快捷键；textarea 替换为 CodeMirror 6（语法高亮、行号、行折叠、自动换行、暗色主题随应用切换）；全文搜索面板 Cmd+Shift+F（后端递归扫 .md/.txt，结果按文件分组，关键词高亮，点击跳转） | Claude |
| 2026-05-14 | v0.3.1 | 未保存退出拦截：关闭标签或关闭窗口时若有未保存修改，弹出自定义确认对话框（保存 / 不保存 / 取消）；窗口关闭时逐个处理未保存 tab，全部处理完才真正退出；新建未命名 tab 不纳入拦截（无法保存到磁盘） | Claude |
| 2026-05-14 | v0.4.0 | 统一按钮体系（Cohere 严谨药丸型）：抽出 Button 组件支持 primary/secondary/outline/ghost/danger 五种 kind + sm/md 两种 size；迁移导出 PDF、视图切换、Markdown 工具栏、主题切换、侧边栏切换、新建标签、欢迎页、ConfirmDialog 等所有按钮 | Claude |
| 2026-05-14 | v0.4.1 | 产品命名落地：英文 **MDive**、中文 **墨潜**、Slogan「潜入你的 Markdown 工作区」；tauri.conf.json/package.json 产品名与版本号同步；欢迎页改为 MDive + 墨潜双语标识；状态栏左下角加品牌 + Slogan；默认窗口尺寸 800×600 → 1200×800（最小 720×480） | Claude |
| 2026-05-14 | v0.4.2 | 应用图标更新：使用自定义品牌图标（白底圆角 + M 字 + 紫色光标），通过 `tauri icon` 生成全套 macOS .icns / Windows .ico / iOS / Android 资源；source.png 保留在 icons/ 作为图标源文件 | Claude |
| 2026-05-14 | v1.0.0 | 首个正式版：版本号统一升至 1.0.0；图标采用「填满画布」方案（裁剪源图透明边距 + 直接缩放，绕过 Tauri 默认 ~82% 安全边距，使 Dock 中视觉尺寸与原生 Mac App 持平）；macOS 标题栏改为沉浸式 Overlay（titleBarStyle: Overlay + hiddenTitle + 自定义 trafficLightPosition），TabBar 增加 78px 左侧让位 + 整条作为 Tauri 拖动区域，欢迎页顶部 40px 也设为拖动区域 | Claude |
| 2026-05-14 | v1.0.0 修订 | 图标改用 Python 脚本（PIL）程序化生成：1024×1024 纯白画布从边到边铺满 + 居中黑色「M」(Helvetica Bold) + 右下角紫色「>_」(Menlo Bold #7C3AED)，零透明边距，直接缩放生成全套 PNG/.icns/.ico，与 VS Code/Gmail 等原生应用 Dock 视觉尺寸一致 | Claude |
| 2026-05-19 | v1.0.1 | 修复导出 PDF 体积膨胀与字号偏大：按 A4 页高逐页裁切 canvas + JPEG 0.85 压缩 + scale 降至 1.5，渲染前固定 794px 宽度解决字号放大；新建文件关闭拦截：未命名 tab 编辑后关闭弹出保存确认 + 另存为对话框；标签栏自适应压缩：标签过多时自动压缩宽度（min 60px / max 180px），hover 显示完整文件名 tooltip | Claude |
| 2026-05-28 | v1.0.2 | 文件树切换保存拦截；窗口拖动修复（补充 core:window:allow-start-dragging 权限）；月亮按钮移入 TabBar rightSlot；注册 .md/.mdx/.markdown 文件关联；TabBar 右侧新增信封反馈按钮，点击弹出 FeedbackDialog（含引导语和邮箱展示），确认后通过 shell open 触发系统邮件客户端 | Claude |
| 2026-05-28 | v1.0.2 修订 | 发布前审查修复：外部文件变更时若当前文件有未保存修改则跳过自动重载，避免覆盖本地编辑；Rust 原生菜单事件统一 emit 到前端并触发新建、打开工作区、保存、关闭标签、工作区查找、主题切换；修复重复标题 slug 计数，避免大纲跳转到错误章节 | Codex |
| 2026-05-28 | v1.0.2 文档修订 | 完善 GitHub 展示：重写 README 项目首页，补充产品定位、核心亮点、适用场景、本地开发/打包、项目状态与后续计划；修正技术栈描述，将 Tailwind CSS 更正为 CSS Variables + 自定义主题 | Codex |
| 2026-05-29 | v1.0.2 展示修订 | GitHub 展示补充：新增 3 张界面预览 SVG（工作区分栏、预览大纲、全文搜索/PDF 导出），README 增加界面预览区；新增 RELEASE_NOTES.md，准备 v1.0.1 GitHub Release 发布说明 | Codex |

---

*本产品文档为项目唯一参考资料，后续所有功能变更、技术决策均需同步更新此文档。*
