import React from 'react';
import { FiFolder } from 'react-icons/fi';
import { FileEntry } from '../../types';
import FileTree from '../FileTree/FileTree';
import Button from '../Common/Button';

interface SidebarProps {
  workspacePath: string | null;
  workspaceName: string;
  fileTree: FileEntry[];
  activeFilePath: string | null;
  onOpenFile: (entry: FileEntry) => void;
  onOpenNewWindow: (filePath: string) => void;
  onRevealInFinder: (filePath: string) => void;
  onChangeWorkspace: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  workspacePath,
  workspaceName,
  fileTree,
  activeFilePath,
  onOpenFile,
  onOpenNewWindow,
  onRevealInFinder,
  onChangeWorkspace,
}) => {
  const sidebarStyle: React.CSSProperties = {
    width: '260px',
    minWidth: '260px',
    maxWidth: '260px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 10px',
    borderBottom: '1px solid var(--border-color)',
    gap: '6px',
    minHeight: '38px',
    flexShrink: 0,
  };

  const folderIconStyle: React.CSSProperties = {
    color: 'var(--folder-icon)',
    fontSize: '16px',
    flexShrink: 0,
  };

  const workspaceNameStyle: React.CSSProperties = {
    flex: 1,
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  };

  const treeContainerStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  };

  return (
    <div style={sidebarStyle}>
      <div style={headerStyle} data-tauri-drag-region>
        <span style={folderIconStyle}>
          <FiFolder />
        </span>
        <span style={workspaceNameStyle} title={workspacePath ?? ''}>
          {workspaceName || '工作区'}
        </span>
        <Button
          kind="secondary"
          size="sm"
          onClick={onChangeWorkspace}
          title="切换工作区"
          style={{ padding: '0 4px' }}
        >
          切换
        </Button>
      </div>
      <div style={treeContainerStyle}>
        <FileTree
          entries={fileTree}
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
          onOpenNewWindow={onOpenNewWindow}
          onRevealInFinder={onRevealInFinder}
        />
      </div>
    </div>
  );
};

export default Sidebar;
