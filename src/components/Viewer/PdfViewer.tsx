import React, { useMemo } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';

interface PdfViewerProps {
  filePath: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ filePath }) => {
  const assetUrl = useMemo(() => convertFileSrc(filePath), [filePath]);

  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: 'var(--bg-editor)',
    display: 'flex',
    flexDirection: 'column',
  };

  const iframeStyle: React.CSSProperties = {
    flex: 1,
    width: '100%',
    border: 'none',
    display: 'block',
  };

  return (
    <div style={containerStyle}>
      <iframe
        src={assetUrl}
        style={iframeStyle}
        title={filePath.split('/').pop() ?? 'PDF'}
      />
    </div>
  );
};

export default PdfViewer;
