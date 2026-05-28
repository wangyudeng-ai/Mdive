import React from 'react';
import { FiFolderPlus } from 'react-icons/fi';
import Button from '../Common/Button';

interface WelcomeScreenProps {
  onOpenWorkspace: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenWorkspace }) => {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    backgroundColor: 'var(--bg-primary)',
    gap: '16px',
    padding: '32px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '64px',
    fontWeight: 400,
    color: 'var(--text-primary)',
    letterSpacing: '-1.28px',
    lineHeight: 1,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: '15px',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    maxWidth: '400px',
    lineHeight: 1.6,
  };

  const shortcutHintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginTop: '8px',
    opacity: 0.7,
  };

  return (
    <div style={containerStyle}>
      <div
        data-tauri-drag-region
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40px' }}
      />
      <div style={titleStyle}>
        MDive
      </div>
      <div style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '0.5em', marginLeft: '0.5em', fontWeight: 300 }}>
        墨潜
      </div>
      <p style={descriptionStyle}>
        潜入你的 Markdown 工作区
      </p>
      <div style={{ marginTop: '20px' }}>
        <Button
          kind="primary"
          size="md"
          icon={<FiFolderPlus style={{ fontSize: '16px' }} />}
          onClick={onOpenWorkspace}
        >
          选择工作区文件夹
        </Button>
      </div>
      <span style={shortcutHintStyle}>支持 Markdown、图片、PDF 等文件预览</span>
    </div>
  );
};

export default WelcomeScreen;
