import React, { useEffect } from 'react';
import Button from './Button';

interface ConfirmDialogProps {
  title: string;
  message: string;
  saveLabel?: string;
  discardLabel?: string;
  cancelLabel?: string;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  saveLabel = '保存',
  discardLabel = '不保存',
  cancelLabel = '取消',
  onSave,
  onDiscard,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onSave();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onSave, onCancel]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          minWidth: '380px',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
          padding: '24px',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>
          {title}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
          {message}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button kind="secondary" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button kind="danger" size="md" onClick={onDiscard}>
            {discardLabel}
          </Button>
          <Button kind="primary" size="md" onClick={onSave} autoFocus>
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
