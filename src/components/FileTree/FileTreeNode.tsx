import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FiFolder, FiChevronRight, FiChevronDown, FiFile } from 'react-icons/fi';
import { FileEntry } from '../../types';
import ContextMenu from './ContextMenu';

interface FileTreeNodeProps {
  entry: FileEntry;
  depth: number;
  activeFilePath: string | null;
  onOpenFile: (entry: FileEntry) => void;
  onOpenNewWindow: (filePath: string) => void;
  onRevealInFinder: (filePath: string) => void;
}

const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  entry,
  depth,
  activeFilePath,
  onOpenFile,
  onOpenNewWindow,
  onRevealInFinder,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const isActive = entry.path === activeFilePath;

  const handleClick = async () => {
    if (entry.is_dir) {
      if (!expanded && children.length === 0) {
        setLoading(true);
        try {
          const entries = await invoke<FileEntry[]>('list_directory', { path: entry.path });
          setChildren(entries);
        } catch (err) {
          console.error('Failed to list directory:', err);
        } finally {
          setLoading(false);
        }
      }
      setExpanded(prev => !prev);
    } else {
      onOpenFile(entry);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: `${8 + depth * 16}px`,
    paddingRight: '8px',
    height: '28px',
    cursor: 'pointer',
    borderRadius: '4px',
    margin: '1px 4px',
    fontSize: '13px',
    color: isActive ? 'var(--accent-color)' : 'var(--text-primary)',
    backgroundColor: isActive ? 'rgba(74,158,255,0.12)' : 'transparent',
    userSelect: 'none',
    transition: 'background-color 0.1s',
  };

  const iconStyle: React.CSSProperties = {
    flexShrink: 0,
    marginRight: '5px',
    color: entry.is_dir ? '#e8a027' : 'var(--text-secondary)',
    fontSize: '14px',
  };

  const chevronStyle: React.CSSProperties = {
    flexShrink: 0,
    marginRight: '2px',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    width: '14px',
  };

  const nameStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  };

  return (
    <>
      <div
        style={rowStyle}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
          }
        }}
        onMouseLeave={e => {
          if (!isActive) {
            (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          }
        }}
      >
        {entry.is_dir ? (
          <span style={chevronStyle}>
            {loading ? '…' : expanded ? <FiChevronDown /> : <FiChevronRight />}
          </span>
        ) : (
          <span style={{ ...chevronStyle, visibility: 'hidden' }} />
        )}
        <span style={iconStyle}>
          {entry.is_dir ? <FiFolder /> : <FiFile />}
        </span>
        <span style={nameStyle} title={entry.name}>
          {entry.name}
        </span>
      </div>

      {entry.is_dir && expanded && (
        <div>
          {children.length === 0 && !loading && (
            <div
              style={{
                paddingLeft: `${8 + (depth + 1) * 16 + 19}px`,
                fontSize: '12px',
                color: 'var(--text-secondary)',
                height: '24px',
                lineHeight: '24px',
              }}
            >
              空目录
            </div>
          )}
          {children.map(child => (
            <FileTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              activeFilePath={activeFilePath}
              onOpenFile={onOpenFile}
              onOpenNewWindow={onOpenNewWindow}
              onRevealInFinder={onRevealInFinder}
            />
          ))}
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          filePath={entry.path}
          isDir={entry.is_dir}
          onClose={() => setContextMenu(null)}
          onOpenNewWindow={onOpenNewWindow}
          onRevealInFinder={onRevealInFinder}
        />
      )}
    </>
  );
};

export default FileTreeNode;
