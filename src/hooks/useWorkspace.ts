import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { FileEntry } from '../types';

const STORAGE_KEY = 'md-editor-workspace';

interface UseWorkspaceReturn {
  workspacePath: string | null;
  fileTree: FileEntry[];
  openWorkspace: () => Promise<void>;
  loadDirectory: (path: string) => Promise<FileEntry[]>;
  refreshTree: () => Promise<void>;
}

export default function useWorkspace(): UseWorkspaceReturn {
  const [workspacePath, setWorkspacePath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);

  const loadDirectory = useCallback(async (path: string): Promise<FileEntry[]> => {
    try {
      const entries = await invoke<FileEntry[]>('list_directory', { path });
      return entries;
    } catch (err) {
      console.error('Failed to list directory:', err);
      return [];
    }
  }, []);

  const openWorkspace = useCallback(async (): Promise<void> => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (!selected || Array.isArray(selected)) return;

      const path = selected as string;
      const entries = await loadDirectory(path);
      setWorkspacePath(path);
      setFileTree(entries);
      localStorage.setItem(STORAGE_KEY, path);
    } catch (err) {
      console.error('Failed to open workspace:', err);
    }
  }, [loadDirectory]);

  const refreshTree = useCallback(async (): Promise<void> => {
    if (!workspacePath) return;
    const entries = await loadDirectory(workspacePath);
    setFileTree(entries);
  }, [workspacePath, loadDirectory]);

  // On mount: restore saved workspace from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      loadDirectory(saved).then(entries => {
        setWorkspacePath(saved);
        setFileTree(entries);
      });
    }
  }, [loadDirectory]);

  return { workspacePath, fileTree, openWorkspace, loadDirectory, refreshTree };
}
