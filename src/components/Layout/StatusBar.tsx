import React from 'react';

interface StatusBarProps {
  filePath: string | null;
  saved: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ filePath, saved }) => {
  const barStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    height: '26px',
    padding: '0 12px',
    backgroundColor: 'var(--status-bg)',
    color: '#ffffff',
    fontSize: '11px',
    flexShrink: 0,
    userSelect: 'none',
    gap: '12px',
  };

  const brandStyle: React.CSSProperties = {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    opacity: 0.95,
  };

  const brandNameStyle: React.CSSProperties = {
    fontWeight: 600,
    letterSpacing: '0.04em',
  };

  const taglineStyle: React.CSSProperties = {
    opacity: 0.55,
    fontSize: '11px',
  };

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '12px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  };

  const pathStyle: React.CSSProperties = {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    opacity: 0.7,
  };

  const savedStyle: React.CSSProperties = {
    flexShrink: 0,
    opacity: 0.85,
    fontWeight: saved ? 400 : 600,
    color: saved ? '#ffffff' : 'var(--accent-color)',
  };

  return (
    <div style={barStyle}>
      <span style={brandStyle}>
        <span style={brandNameStyle}>MDive</span>
        <span style={taglineStyle}>· 潜入你的 Markdown 工作区</span>
      </span>
      {filePath && (
        <>
          <span style={dividerStyle} />
          <span style={pathStyle} title={filePath}>{filePath}</span>
          <span style={savedStyle}>{saved ? '已保存' : '未保存 ●'}</span>
        </>
      )}
    </div>
  );
};

export default StatusBar;
