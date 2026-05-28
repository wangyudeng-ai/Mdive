import React, { useEffect, useRef, useState } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  filePath: string;
  isDir: boolean;
  onClose: () => void;
  onOpenNewWindow: (filePath: string) => void;
  onRevealInFinder: (filePath: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  filePath,
  isDir,
  onClose,
  onOpenNewWindow,
  onRevealInFinder,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x, y });

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Clamp position to viewport after mount so menu doesn't overflow window edges
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const pad = 8;
    const maxX = window.innerWidth - rect.width - pad;
    const maxY = window.innerHeight - rect.height - pad;
    const clampedX = Math.max(pad, Math.min(x, maxX));
    const clampedY = Math.max(pad, Math.min(y, maxY));
    if (clampedX !== x || clampedY !== y) setPos({ x: clampedX, y: clampedY });
  }, [x, y]);

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    zIndex: 9999,
    backgroundColor: 'var(--bg-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    minWidth: '160px',
    overflow: 'hidden',
    padding: '4px 0',
  };

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '7px 14px',
    textAlign: 'left',
    fontSize: '13px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    whiteSpace: 'nowrap',
  };

  const handleItemClick = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div ref={menuRef} style={menuStyle}>
      {!isDir && (
        <button
          style={itemStyle}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
          onClick={() => handleItemClick(() => onOpenNewWindow(filePath))}
        >
          在新窗口打开
        </button>
      )}
      <button
        style={itemStyle}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--hover-bg)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        }}
        onClick={() => handleItemClick(() => onRevealInFinder(filePath))}
      >
        在访达中显示
      </button>
    </div>
  );
};

export default ContextMenu;
