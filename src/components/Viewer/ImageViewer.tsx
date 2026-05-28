import React, { useMemo } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface ImageViewerProps {
  filePath: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ filePath }) => {
  const assetUrl = useMemo(() => convertFileSrc(filePath), [filePath]);
  const fileName = filePath.split('/').pop() ?? filePath;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '32px',
    backgroundColor: 'var(--bg-editor)',
    overflow: 'auto',
  };

  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: 'calc(100vh - 160px)',
    objectFit: 'contain',
    borderRadius: '4px',
    boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
  };

  const fileNameStyle: React.CSSProperties = {
    marginTop: '16px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  };

  return (
    <div style={containerStyle}>
      <img src={assetUrl} alt={fileName} style={imageStyle} />
      <span style={fileNameStyle}>{fileName}</span>
    </div>
  );
};

export default ImageViewer;
