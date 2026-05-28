import { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { save as saveDialog } from '@tauri-apps/plugin-dialog';
import { open as openUrl } from '@tauri-apps/plugin-shell';
import { FiSun, FiMoon, FiMail } from 'react-icons/fi';

import useTheme from './hooks/useTheme';
import useWorkspace from './hooks/useWorkspace';
import { TabData, FileEntry } from './types';
import { getFileType } from './utils/fileType';

import TabBar from './components/Layout/TabBar';
import Sidebar from './components/Layout/Sidebar';
import StatusBar from './components/Layout/StatusBar';
import MarkdownViewer from './components/Viewer/MarkdownViewer';
import ImageViewer from './components/Viewer/ImageViewer';
import PdfViewer from './components/Viewer/PdfViewer';
import UnsupportedViewer from './components/Viewer/UnsupportedViewer';
import WelcomeScreen from './components/Viewer/WelcomeScreen';
import SearchPanel from './components/Search/SearchPanel';
import ConfirmDialog from './components/Common/ConfirmDialog';
import FeedbackDialog from './components/Common/FeedbackDialog';
import Button from './components/Common/Button';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { workspacePath, fileTree, openWorkspace, refreshTree } = useWorkspace();

  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState<
    | { kind: 'tab'; tabId: string }
    | { kind: 'window'; tabIds: string[] }
    | { kind: 'switch'; tabId: string; openEntry: FileEntry }
    | null
  >(null);
  const tabCounter = useRef(0);
  const tabsRef = useRef<TabData[]>([]);
  useEffect(() => { tabsRef.current = tabs; }, [tabs]);

  // Cmd+Shift+F to open search panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (workspacePath) setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [workspacePath]);

  // Intercept window close if unsaved tabs exist (registered once via tabsRef)
  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    let cancelled = false;
    const win = getCurrentWindow();
    win.onCloseRequested(async event => {
      const unsavedIds = tabsRef.current.filter(t => !t.saved).map(t => t.id);
      if (unsavedIds.length === 0) return;
      event.preventDefault();
      setPendingClose({ kind: 'window', tabIds: unsavedIds });
      setActiveTabId(unsavedIds[0]);
    }).then(fn => {
      if (cancelled) fn();
      else unlistenFn = fn;
    });
    return () => {
      cancelled = true;
      unlistenFn?.();
    };
  }, []);

  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  // Workspace name derived from path
  const workspaceName = workspacePath
    ? workspacePath.split('/').filter(Boolean).pop() ?? workspacePath
    : '工作区';

  // Watch workspace for file changes
  useEffect(() => {
    if (!workspacePath) return;
    invoke('watch_workspace', { path: workspacePath }).catch(err =>
      console.error('watch_workspace error:', err)
    );
  }, [workspacePath]);

  // Listen for file-changed events
  useEffect(() => {
    const unlistenPromise = listen<string[]>('file-changed', async event => {
      const changedPaths = event.payload;

      refreshTree();

      const currentActive = tabsRef.current.find(t => t.id === activeTabId);
      if (currentActive?.path && changedPaths.includes(currentActive.path)) {
        if (!currentActive.saved) {
          console.warn('Skipped external reload because active file has unsaved changes:', currentActive.path);
          return;
        }
        try {
          const newContent = await invoke<string>('read_text_file', { path: currentActive.path });
          setTabs(prev => prev.map(t =>
            t.id === currentActive.id ? { ...t, content: newContent, saved: true } : t
          ));
        } catch (err) {
          console.error('Failed to reload changed file:', err);
        }
      }
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, [activeTabId, refreshTree]);

  // Open a file from the file tree
  const handleOpenFile = useCallback(async (entry: FileEntry) => {
    // If already open, just activate
    const existing = tabs.find(t => t.path === entry.path);
    if (existing) {
      setActiveTabId(existing.id);
      return;
    }

    // If active tab has unsaved changes, intercept before opening
    const currentTab = tabs.find(t => t.id === activeTabId);
    if (currentTab && !currentTab.saved) {
      setPendingClose({ kind: 'switch', tabId: currentTab.id, openEntry: entry });
      return;
    }

    await doOpenFile(entry);
  }, [tabs, activeTabId]);

  const doOpenFile = useCallback(async (entry: FileEntry) => {
    const fileType = getFileType(entry.path);
    let content: string | null = null;

    if (fileType === 'markdown') {
      try {
        content = await invoke<string>('read_text_file', { path: entry.path });
      } catch (err) {
        console.error('Failed to read file:', err);
        content = '';
      }
    }

    tabCounter.current += 1;
    const newTab: TabData = {
      id: `tab-${tabCounter.current}`,
      path: entry.path,
      title: entry.name,
      content,
      saved: true,
      fileType,
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Save any tab by id (prompts save-as for untitled files)
  const saveTab = useCallback(async (id: string): Promise<boolean> => {
    const tab = tabs.find(t => t.id === id);
    if (!tab || tab.content === null) return false;

    let targetPath = tab.path;
    if (!targetPath) {
      const chosen = await saveDialog({
        defaultPath: `${tab.title}.md`,
        filters: [{ name: 'Markdown', extensions: ['md'] }],
      });
      if (!chosen) return false;
      targetPath = chosen;
    }

    try {
      await invoke('write_text_file', { path: targetPath, content: tab.content });
      setTabs(prev => prev.map(t =>
        t.id === id
          ? { ...t, path: targetPath, title: targetPath.split('/').pop() ?? tab.title, saved: true }
          : t
      ));
      return true;
    } catch (err) {
      console.error('Failed to save file:', err);
      return false;
    }
  }, [tabs]);

  // Save the active file
  const handleSaveFile = useCallback(async () => {
    if (!activeTabId) return;
    await saveTab(activeTabId);
  }, [activeTabId, saveTab]);

  // Handle content change in editor
  const handleTabChange = useCallback((newContent: string) => {
    if (!activeTabId) return;
    setTabs(prev =>
      prev.map(t =>
        t.id === activeTabId ? { ...t, content: newContent, saved: false } : t
      )
    );
  }, [activeTabId]);

  // Create a new blank markdown tab
  const handleNewTab = useCallback(() => {
    tabCounter.current += 1;
    const newTab: TabData = {
      id: `tab-${tabCounter.current}`,
      path: null,
      title: `未命名 ${tabCounter.current}`,
      content: '',
      saved: true,
      fileType: 'markdown',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, []);

  // Actually remove a tab from state
  const closeTabNow = useCallback((id: string) => {
    setTabs(prev => {
      const idx = prev.findIndex(t => t.id === id);
      const remaining = prev.filter(t => t.id !== id);

      if (activeTabId === id) {
        if (remaining.length > 0) {
          const newIdx = Math.min(idx, remaining.length - 1);
          setActiveTabId(remaining[newIdx].id);
        } else {
          setActiveTabId(null);
        }
      }

      return remaining;
    });
  }, [activeTabId]);

  // Close a tab, intercept if unsaved
  const handleCloseTab = useCallback((id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (tab && !tab.saved) {
      setPendingClose({ kind: 'tab', tabId: id });
      setActiveTabId(id);
      return;
    }
    closeTabNow(id);
  }, [tabs, closeTabNow]);

  // Open file in new window
  const handleOpenNewWindow = useCallback((filePath: string) => {
    invoke('open_new_window', { filePath }).catch(err =>
      console.error('open_new_window error:', err)
    );
  }, []);

  // Reveal in Finder
  const handleRevealInFinder = useCallback((path: string) => {
    invoke('reveal_in_finder', { path }).catch(err =>
      console.error('reveal_in_finder error:', err)
    );
  }, []);

  // Native menu actions from Rust menu bar
  useEffect(() => {
    const unlistenPromise = listen<string>('menu-action', event => {
      switch (event.payload) {
        case 'new_file':
          handleNewTab();
          break;
        case 'open_workspace':
          openWorkspace();
          break;
        case 'save':
          handleSaveFile();
          break;
        case 'close_tab':
          if (activeTabId) handleCloseTab(activeTabId);
          break;
        case 'find_in_workspace':
          if (workspacePath) setSearchOpen(true);
          break;
        case 'toggle_theme':
          toggleTheme();
          break;
      }
    });

    return () => {
      unlistenPromise.then(fn => fn());
    };
  }, [
    activeTabId,
    handleCloseTab,
    handleNewTab,
    handleSaveFile,
    openWorkspace,
    toggleTheme,
    workspacePath,
  ]);

  const feedbackBtn = (
    <Button
      kind="outline"
      size="sm"
      iconOnly
      icon={<FiMail />}
      onClick={() => setFeedbackOpen(true)}
      title="发送反馈"
    />
  );

  const themeToggleBtn = (
    <Button
      kind="outline"
      size="sm"
      iconOnly
      icon={theme === 'light' ? <FiMoon /> : <FiSun />}
      onClick={toggleTheme}
      title={theme === 'light' ? '切换深色模式' : '切换浅色模式'}
    />
  );

  // No workspace: show welcome
  if (!workspacePath) {
    return (
      <>
        <WelcomeScreen onOpenWorkspace={openWorkspace} />
        <div style={{ position: 'fixed', top: '8px', right: '14px', zIndex: 1000 }}>
          {themeToggleBtn}
        </div>
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* Tab bar */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={handleNewTab}
        rightSlot={<>{feedbackBtn}{themeToggleBtn}</>}
      />

      {/* Main content area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <Sidebar
          workspacePath={workspacePath}
          workspaceName={workspaceName}
          fileTree={fileTree}
          activeFilePath={activeTab?.path ?? null}
          onOpenFile={handleOpenFile}
          onOpenNewWindow={handleOpenNewWindow}
          onRevealInFinder={handleRevealInFinder}
          onChangeWorkspace={openWorkspace}
        />

        {/* Main viewer */}
        <main style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {activeTab?.fileType === 'markdown' && activeTab.content !== null && (
            <MarkdownViewer
              key={activeTab.id}
              content={activeTab.content}
              onChange={handleTabChange}
              onSave={handleSaveFile}
              filePath={activeTab.path}
            />
          )}
          {activeTab?.fileType === 'image' && activeTab.path && (
            <ImageViewer key={activeTab.id} filePath={activeTab.path} />
          )}
          {activeTab?.fileType === 'pdf' && activeTab.path && (
            <PdfViewer key={activeTab.id} filePath={activeTab.path} />
          )}
          {activeTab?.fileType === 'unsupported' && activeTab.path && (
            <UnsupportedViewer key={activeTab.id} filePath={activeTab.path} />
          )}
          {!activeTab && (
            <WelcomeScreen onOpenWorkspace={openWorkspace} />
          )}
        </main>
      </div>

      {/* Status bar */}
      <StatusBar
        filePath={activeTab?.path ?? null}
        saved={activeTab?.saved ?? true}
      />

      {/* Global search panel */}
      {searchOpen && workspacePath && (
        <SearchPanel
          workspacePath={workspacePath}
          onClose={() => setSearchOpen(false)}
          onOpenFile={entry => {
            handleOpenFile(entry);
            setSearchOpen(false);
          }}
        />
      )}

      {/* Feedback dialog */}
      {feedbackOpen && (
        <FeedbackDialog
          onConfirm={() => {
            openUrl('mailto:wangyudeng3926832@163.com?subject=MDive%20反馈');
            setFeedbackOpen(false);
          }}
          onCancel={() => setFeedbackOpen(false)}
        />
      )}

      {/* Unsaved-changes confirm dialog */}
      {pendingClose && (() => {
        const targetTab =
          pendingClose.kind === 'tab'
            ? tabs.find(t => t.id === pendingClose.tabId)
            : pendingClose.kind === 'switch'
            ? tabs.find(t => t.id === pendingClose.tabId)
            : tabs.find(t => t.id === pendingClose.tabIds[0]);
        if (!targetTab) {
          setPendingClose(null);
          return null;
        }
        const remainingCount =
          pendingClose.kind === 'window' ? pendingClose.tabIds.length : 1;

        const proceedAfter = async () => {
          if (pendingClose.kind === 'tab') {
            closeTabNow(pendingClose.tabId);
            setPendingClose(null);
          } else if (pendingClose.kind === 'switch') {
            setPendingClose(null);
            await doOpenFile(pendingClose.openEntry);
          } else {
            const rest = pendingClose.tabIds.slice(1);
            if (rest.length === 0) {
              setPendingClose(null);
              setTimeout(() => getCurrentWindow().destroy(), 0);
            } else {
              setPendingClose({ kind: 'window', tabIds: rest });
              setActiveTabId(rest[0]);
            }
          }
        };

        return (
          <ConfirmDialog
            title={`${targetTab.title} 有未保存的修改`}
            message={
              pendingClose.kind === 'window' && remainingCount > 1
                ? `还有 ${remainingCount} 个文件未保存，是否保存对「${targetTab.title}」的修改？`
                : `是否保存对「${targetTab.title}」的修改？不保存将丢失这些更改。`
            }
            onSave={async () => {
              const ok = await saveTab(targetTab.id);
              if (ok) proceedAfter();
            }}
            onDiscard={() => proceedAfter()}
            onCancel={() => setPendingClose(null)}
          />
        );
      })()}
    </div>
  );
}

export default App;
