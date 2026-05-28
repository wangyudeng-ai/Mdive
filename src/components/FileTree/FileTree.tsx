import React from 'react';
import { FileEntry } from '../../types';
import FileTreeNode from './FileTreeNode';

interface FileTreeProps {
  entries: FileEntry[];
  activeFilePath: string | null;
  onOpenFile: (entry: FileEntry) => void;
  onOpenNewWindow: (filePath: string) => void;
  onRevealInFinder: (filePath: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({
  entries,
  activeFilePath,
  onOpenFile,
  onOpenNewWindow,
  onRevealInFinder,
}) => {
  if (entries.length === 0) {
    return (
      <div
        style={{
          padding: '16px 12px',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          textAlign: 'center',
        }}
      >
        空工作区
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '4px', paddingBottom: '8px' }}>
      {entries.map(entry => (
        <FileTreeNode
          key={entry.path}
          entry={entry}
          depth={0}
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
          onOpenNewWindow={onOpenNewWindow}
          onRevealInFinder={onRevealInFinder}
        />
      ))}
    </div>
  );
};

export default FileTree;
