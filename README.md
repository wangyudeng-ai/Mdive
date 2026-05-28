# MDive — 墨潜

> 潜入你的 Markdown 工作区

轻量级本地文件查看与 Markdown 编辑器，基于 **Tauri v2 + React + TypeScript** 构建。

---

## 功能特性

- **工作区文件夹为核心**，左侧文件树递归展开，多标签页并排查看
- **Markdown 分栏编辑**：左侧 CodeMirror 源码编辑 + 右侧实时预览，拖拽调整宽度
- **三档视图切换**：源码 / 分栏 / 预览，预览模式带文档大纲导航
- **多格式内嵌预览**：`.md` / `.png` / `.jpg` / `.gif` / `.webp` / `.svg` / `.pdf`
- **Mermaid 图表渲染**：代码块 ` ```mermaid ` 自动渲染为 SVG，随主题切换
- **实时文件监听**：外部编辑器（VS Code）保存后自动刷新预览
- **全文搜索**：`Cmd+Shift+F` 跨文件搜索，关键词高亮，点击跳转
- **未保存拦截**：关闭标签、切换文件、关闭窗口时均有保存确认
- **导出 PDF**：按 A4 分页导出，JPEG 压缩，体积小
- **双主题**：亮色 / 暗色，Mermaid 图随主题联动
- **macOS 原生体验**：沉浸式标题栏、自定义 Dock 图标

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Tauri v2 (Rust) |
| 前端 | React 19 + TypeScript + Vite |
| 样式 | Tailwind CSS v4 |
| Markdown | marked.js + highlight.js |
| 图表 | Mermaid.js |
| 编辑器 | CodeMirror 6 |

## 开发运行

```bash
npm install
npm run tauri dev
```

## 打包构建

```bash
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`。

## 下载安装

当前发布版本为 **Intel (x64)** 构建。受限于开发者机器为 Intel 芯片，暂未提供 Apple Silicon 原生包。Apple Silicon（M1/M2/M3/M4）用户可通过 macOS 内置的 **Rosetta 2** 自动转译运行，功能完全正常，无需任何额外配置。

## 产品文档

详见 [PRODUCT.md](./PRODUCT.md)。
