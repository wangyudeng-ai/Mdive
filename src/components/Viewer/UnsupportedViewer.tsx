import React from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { FiExternalLink } from 'react-icons/fi';

interface UnsupportedViewerProps {
  filePath: string;
}

const UnsupportedViewer: React.FC<UnsupportedViewerProps> = ({ filePath }) => {
  const fileName = filePath.split('/').pop() ?? filePath;

  const handleOpenExternal = async () => {
    try {
      await open(filePath);
    } catch (err) {
      console.error('Failed to open file externally:', err);
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '16px',
    backgroundColor: 'var(--bg-editor)',
    color: 'var(--text-secondary)',
    padding: '32px',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '48px',
    opacity: 0.3,
  };

  const messageStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 500,
    color: 'var(--text-primary)',
  };

  const fileNameStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    maxWidth: '400px',
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '8px',
    padding: '8px 20px',
    backgroundColor: 'var(--accent-color)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  };

  return (
    <div style={containerStyle}>
      <div style={iconStyle}>
        <FiExternalLink />
      </div>
      <span style={messageStyle}>不支持预览此文件类型</span>
      <span style={fileNameStyle} title={filePath}>
        {fileName}
      </span>
      <button
        style={buttonStyle}
        onClick={handleOpenExternal}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        }}
      >
        <FiExternalLink style={{ fontSize: '14px' }} />
        用系统程序打开
      </button>
    </div>
  );
};

export default UnsupportedViewer;
