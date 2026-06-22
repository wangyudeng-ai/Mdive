import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import mermaid from 'mermaid';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { save } from '@tauri-apps/plugin-dialog';
import { writeFile } from '@tauri-apps/plugin-fs';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { renderMarkdown, extractOutline } from '../../utils/markdown';
import Button from '../Common/Button';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

interface MarkdownViewerProps {
  content: string;
  onChange: (v: string) => void;
  onSave: () => void;
  filePath: string | null;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  onChange,
  onSave,
  filePath,
}) => {
  const [splitRatio, setSplitRatio] = useState(50); // percent for left pane
  const [viewMode, setViewMode] = useState<'source' | 'split' | 'preview'>('split');
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const syncingFromEditor = useRef(0);
  const syncingFromPreview = useRef(0);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  // Track theme changes from html.dark class
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const getEditorView = (): EditorView | null => cmRef.current?.view ?? null;

  const renderedHtml = useMemo(() => renderMarkdown(content), [content]);
  const outline = useMemo(() => extractOutline(renderedHtml), [renderedHtml]);

  // Re-render mermaid diagrams after HTML is injected into the DOM
  useEffect(() => {
    if (!previewRef.current) return;
    const nodes = previewRef.current.querySelectorAll<HTMLElement>('.mermaid');
    if (nodes.length === 0) return;
    mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
    nodes.forEach(el => { el.removeAttribute('data-processed'); });
    mermaid.run({ nodes: Array.from(nodes) }).catch(err => {
      console.error('Mermaid render failed:', err);
    });
  }, [renderedHtml, isDark, viewMode]);

  // Divider drag
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawRatio = ((ev.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(85, Math.max(15, rawRatio));
      setSplitRatio(clamped);
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

  // Sync scroll: editor → preview
  const handleEditorScroll = useCallback(() => {
    if (syncingFromPreview.current) return;
    const view = getEditorView();
    const ta = view?.scrollDOM;
    const pv = previewRef.current;
    if (!ta || !pv) return;

    const maxScrollEditor = ta.scrollHeight - ta.clientHeight;
    if (maxScrollEditor <= 0) return;
    const ratio = ta.scrollTop / maxScrollEditor;

    clearTimeout(syncingFromEditor.current);
    syncingFromEditor.current = window.setTimeout(() => {
      syncingFromEditor.current = 0;
    }, 100);

    const maxScrollPreview = pv.scrollHeight - pv.clientHeight;
    pv.scrollTop = ratio * maxScrollPreview;
  }, []);

  // Sync scroll: preview → editor
  const handlePreviewScroll = useCallback(() => {
    if (syncingFromEditor.current) return;
    const view = getEditorView();
    const ta = view?.scrollDOM;
    const pv = previewRef.current;
    if (!ta || !pv) return;

    const maxScrollPreview = pv.scrollHeight - pv.clientHeight;
    if (maxScrollPreview <= 0) return;
    const ratio = pv.scrollTop / maxScrollPreview;

    clearTimeout(syncingFromPreview.current);
    syncingFromPreview.current = window.setTimeout(() => {
      syncingFromPreview.current = 0;
    }, 100);

    const maxScrollEditor = ta.scrollHeight - ta.clientHeight;
    ta.scrollTop = ratio * maxScrollEditor;
  }, []);

  // Attach scroll listener to CodeMirror scrollDOM
  useEffect(() => {
    const view = getEditorView();
    const ta = view?.scrollDOM;
    if (!ta) return;
    ta.addEventListener('scroll', handleEditorScroll);
    return () => ta.removeEventListener('scroll', handleEditorScroll);
  }, [handleEditorScroll, viewMode]);

  const [exporting, setExporting] = useState(false);

  const handleExportPdf = useCallback(async () => {
    const el = previewRef.current?.querySelector<HTMLElement>('.markdown-body');
    if (!el) return;

    const defaultName = filePath
      ? filePath.split('/').pop()!.replace(/\.[^.]+$/, '') + '.pdf'
      : 'export.pdf';

    const savePath = await save({
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!savePath) return;

    setExporting(true);
    const wasDark = document.documentElement.classList.contains('dark');
    if (wasDark) document.documentElement.classList.remove('dark');

    const origWidth = el.style.width;
    const origMaxWidth = el.style.maxWidth;
    const origMinWidth = el.style.minWidth;
    const a4WidthPx = 794;
    el.style.width = `${a4WidthPx}px`;
    el.style.maxWidth = `${a4WidthPx}px`;
    el.style.minWidth = `${a4WidthPx}px`;

    try {
      const scale = 1.5;
      const canvas = await html2canvas(el, {
        scale,
        useCORS: true,
        backgroundColor: '#ffffff',
        windowWidth: a4WidthPx,
        windowHeight: el.scrollHeight,
      });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidthMm = 210;
      const pageHeightMm = 297;
      const pageHeightPx = Math.floor((canvas.width * pageHeightMm) / pageWidthMm);

      let offsetY = 0;
      let pageIndex = 0;
      while (offsetY < canvas.height) {
        if (pageIndex > 0) pdf.addPage();
        const sliceHeight = Math.min(pageHeightPx, canvas.height - offsetY);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeight;
        const ctx = pageCanvas.getContext('2d')!;
        ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const pageData = pageCanvas.toDataURL('image/jpeg', 0.85);
        const sliceHeightMm = (sliceHeight * pageWidthMm) / canvas.width;
        pdf.addImage(pageData, 'JPEG', 0, 0, pageWidthMm, sliceHeightMm);
        offsetY += pageHeightPx;
        pageIndex++;
      }

      const bytes = pdf.output('arraybuffer');
      await writeFile(savePath, new Uint8Array(bytes));
    } catch (err) {
      console.error('Export PDF failed:', err);
      alert(`导出 PDF 失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      el.style.width = origWidth;
      el.style.maxWidth = origMaxWidth;
      el.style.minWidth = origMinWidth;
      if (wasDark) document.documentElement.classList.add('dark');
      setExporting(false);
    }
  }, [filePath]);

  const editorWidth = viewMode === 'source' ? 100 : viewMode === 'preview' ? 0 : splitRatio;
  const previewWidth = 100 - editorWidth;
  const showDivider = viewMode === 'split';
  const showOutline = viewMode === 'preview' && outline.length > 0;

  const handleOutlineClick = useCallback((id: string) => {
    const pv = previewRef.current;
    if (!pv) return;
    const target = pv.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const applyWrap = useCallback((before: string, after: string = before, placeholder: string = '') => {
    const view = getEditorView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to) || placeholder;
    const insert = before + selected + after;
    view.dispatch({
      changes: { from, to, insert },
      selection: { anchor: from + before.length, head: from + before.length + selected.length },
    });
    view.focus();
  }, []);

  const applyLinePrefix = useCallback((prefix: string) => {
    const view = getEditorView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const startLine = view.state.doc.lineAt(from);
    const endLine = view.state.doc.lineAt(to);
    const block = view.state.sliceDoc(startLine.from, endLine.to);
    const transformed = block
      .split('\n')
      .map(line => (line.length > 0 ? prefix + line : line))
      .join('\n');
    view.dispatch({
      changes: { from: startLine.from, to: endLine.to, insert: transformed },
      selection: { anchor: startLine.from, head: startLine.from + transformed.length },
    });
    view.focus();
  }, []);

  const insertAtCursor = useCallback((text: string) => {
    const view = getEditorView();
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
    view.focus();
  }, []);

  // Keyboard shortcuts: Cmd+S / Cmd+B / Cmd+I
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === 's') {
        e.preventDefault();
        onSave();
      } else if (e.key === 'b' && getEditorView()?.hasFocus) {
        e.preventDefault();
        applyWrap('**', '**', '加粗');
      } else if (e.key === 'i' && getEditorView()?.hasFocus) {
        e.preventDefault();
        applyWrap('*', '*', '斜体');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, applyWrap]);

  const toolbarActions = [
    { label: 'B', title: '加粗 (Cmd+B)', bold: true, run: () => applyWrap('**', '**', '加粗') },
    { label: 'I', title: '斜体 (Cmd+I)', italic: true, run: () => applyWrap('*', '*', '斜体') },
    { label: 'S', title: '删除线', strike: true, run: () => applyWrap('~~', '~~', '删除') },
    { label: 'H', title: '二级标题', run: () => applyLinePrefix('## ') },
    { label: '• 表', title: '无序列表', run: () => applyLinePrefix('- ') },
    { label: '1. 表', title: '有序列表', run: () => applyLinePrefix('1. ') },
    { label: '"', title: '引用', run: () => applyLinePrefix('> ') },
    { label: '</>', title: '行内代码', run: () => applyWrap('`', '`', 'code') },
    { label: '```', title: '代码块', run: () => insertAtCursor('\n```\n\n```\n') },
    { label: '链接', title: '链接', run: () => applyWrap('[', '](url)', '文本') },
    { label: '图片', title: '图片', run: () => insertAtCursor('![](url)') },
    { label: '表格', title: '表格', run: () => insertAtCursor('\n| 列1 | 列2 |\n| --- | --- |\n| a | b |\n') },
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'var(--bg-editor)',
    userSelect: isDragging.current ? 'none' : 'auto',
  };

  const paneHeaderStyle: React.CSSProperties = {
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 12px',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    flexShrink: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const editorPaneStyle: React.CSSProperties = {
    display: editorWidth === 0 ? 'none' : 'flex',
    flexDirection: 'column',
    width: `${editorWidth}%`,
    height: '100%',
    borderRight: showDivider ? 'none' : '1px solid var(--border-color)',
    overflow: 'hidden',
  };

  const previewPaneStyle: React.CSSProperties = {
    display: previewWidth === 0 ? 'none' : 'flex',
    flexDirection: 'column',
    width: `${previewWidth}%`,
    height: '100%',
    overflow: 'hidden',
  };

  const previewBodyStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  };

  const outlinePaneStyle: React.CSSProperties = {
    width: '200px',
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    overflow: 'hidden',
  };

  const outlineSubHeaderStyle: React.CSSProperties = {
    padding: '10px 12px 6px',
    fontSize: '10px',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    flexShrink: 0,
  };

  const outlineListStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '0 0 8px',
  };

  const dividerStyle: React.CSSProperties = {
    width: '4px',
    flexShrink: 0,
    cursor: 'col-resize',
    backgroundColor: 'var(--border-color)',
    position: 'relative',
    zIndex: 10,
    transition: 'background-color 0.15s',
  };

  const editorWrapperStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    minHeight: 0,
  };

  const previewScrollStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* Editor pane */}
      <div style={editorPaneStyle}>
        <div style={paneHeaderStyle}>
          <span>Markdown</span>
          {viewMode === 'source' && <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            padding: '4px 8px',
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            flexShrink: 0,
            overflowX: 'auto',
          }}
        >
          {toolbarActions.map(a => (
            <Button
              key={a.title}
              kind="ghost"
              size="sm"
              onClick={a.run}
              title={a.title}
              style={{
                fontFamily: a.label === '</>' || a.label === '```' ? 'monospace' : 'inherit',
                fontWeight: a.bold ? 700 : 500,
                fontStyle: a.italic ? 'italic' : 'normal',
                textDecoration: a.strike ? 'line-through' : 'none',
                minWidth: '28px',
                padding: '0 8px',
              }}
            >
              {a.label}
            </Button>
          ))}
        </div>
        <div style={editorWrapperStyle}>
          <CodeMirror
            ref={cmRef}
            value={content}
            onChange={onChange}
            extensions={[markdown(), EditorView.lineWrapping]}
            theme={isDark ? oneDark : 'light'}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              foldGutter: true,
              autocompletion: false,
            }}
            style={{ flex: 1, fontSize: '14px', height: '100%', overflow: 'hidden' }}
            height="100%"
            placeholder="在此输入 Markdown..."
          />
        </div>
      </div>

      {/* Drag divider */}
      {showDivider && (
        <div
          style={dividerStyle}
          onMouseDown={handleDividerMouseDown}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--accent-color)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--border-color)';
          }}
        />
      )}

      {/* Preview pane */}
      <div style={previewPaneStyle}>
        <div style={paneHeaderStyle}>
          <span>预览</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ViewModeSwitcher mode={viewMode} onChange={setViewMode} />
            <Button
              kind="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting}
              title="导出为 PDF 文件"
            >
              {exporting ? '导出中…' : '导出 PDF'}
            </Button>
          </div>
        </div>
        <div style={previewBodyStyle}>
          {showOutline && (
            <div style={outlinePaneStyle}>
              <div style={outlineSubHeaderStyle}>大纲</div>
              <div style={outlineListStyle}>
                {outline.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleOutlineClick(item.id)}
                    title={item.text}
                    style={{
                      padding: '4px 12px 4px',
                      paddingLeft: `${12 + (item.level - 1) * 12}px`,
                      fontSize: item.level === 1 ? '13px' : '12px',
                      fontWeight: item.level <= 2 ? 500 : 400,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.6,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--accent-color)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLDivElement).style.color = 'var(--text-primary)';
                    }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div
            ref={previewRef}
            style={previewScrollStyle}
            onScroll={handlePreviewScroll}
          >
            <div
              key={`${viewMode}-${isDark ? 'dark' : 'light'}`}
              className="markdown-body"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownViewer;

type ViewMode = 'source' | 'split' | 'preview';

const ViewModeSwitcher: React.FC<{
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}> = ({ mode, onChange }) => {
  const modes: { key: ViewMode; label: string; title: string }[] = [
    { key: 'source', label: '源码', title: '只显示源码' },
    { key: 'split', label: '分栏', title: '源码与预览分栏' },
    { key: 'preview', label: '预览', title: '只显示预览（带大纲）' },
  ];

  return (
    <div style={{ display: 'inline-flex', gap: '4px' }}>
      {modes.map(m => (
        <Button
          key={m.key}
          kind="outline"
          size="sm"
          active={mode === m.key}
          onClick={() => onChange(m.key)}
          title={m.title}
        >
          {m.label}
        </Button>
      ))}
    </div>
  );
};
