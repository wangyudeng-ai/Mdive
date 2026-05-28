import React, { useRef } from 'react';
import { TabData } from '../../types';
import Button from '../Common/Button';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onNewTab: () => void;
  rightSlot?: React.ReactNode;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  rightSlot,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    height: '40px',
    paddingLeft: '78px',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 12px',
    height: '100%',
    cursor: 'pointer',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    minWidth: '60px',
    maxWidth: '180px',
    flexShrink: 1,
    overflow: 'hidden',
    borderRight: '1px solid var(--border-color)',
    backgroundColor: isActive ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    borderTop: isActive ? '2px solid var(--accent-color)' : '2px solid transparent',
    userSelect: 'none',
    position: 'relative',
  });

  const closeBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '3px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    flexShrink: 0,
    lineHeight: 1,
  };

  return (
    <div ref={scrollRef} style={containerStyle} data-tauri-drag-region>
      {tabs.map(tab => (
        <div
          key={tab.id}
          style={tabStyle(tab.id === activeTabId)}
          onClick={() => onSelectTab(tab.id)}
          onMouseEnter={e => {
            if (tab.id !== activeTabId) {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
            }
          }}
          onMouseLeave={e => {
            if (tab.id !== activeTabId) {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--tab-inactive-bg)';
            }
          }}
        >
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              flex: 1,
              minWidth: 0,
            }}
            title={tab.title + (tab.path ? ` — ${tab.path}` : '')}
          >
            {tab.title}
          </span>
          {!tab.saved && (
            <span style={{ color: 'var(--accent-color)', fontSize: '10px', lineHeight: 1 }}>
              ●
            </span>
          )}
          <span
            style={closeBtnStyle}
            onClick={e => {
              e.stopPropagation();
              onCloseTab(tab.id);
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'var(--hover-bg)';
              (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLSpanElement).style.backgroundColor = 'transparent';
              (e.currentTarget as HTMLSpanElement).style.color = 'var(--text-secondary)';
            }}
            title="关闭"
          >
            ×
          </span>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', flexShrink: 0 }}>
        <Button
          kind="secondary"
          size="sm"
          onClick={onNewTab}
          title="新建标签页"
          style={{ padding: '0 8px' }}
        >
          + 新建
        </Button>
      </div>
      {rightSlot && (
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', flexShrink: 0 }}>
          {rightSlot}
        </div>
      )}
    </div>
  );
};

export default TabBar;
