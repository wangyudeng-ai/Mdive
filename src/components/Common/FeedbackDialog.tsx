import React, { useEffect } from 'react';
import { FiMail } from 'react-icons/fi';
import Button from './Button';

interface FeedbackDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({ onConfirm, onCancel }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

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
          width: '360px',
          backgroundColor: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
          padding: '24px',
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
          产品反馈
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
          如果有任何关于产品的问题和建议，欢迎发送邮件告诉我，我会认真阅读每一条反馈。
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <FiMail style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: 'var(--text-primary)', userSelect: 'text' }}>
            wangyudeng3926832@163.com
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button kind="secondary" size="md" onClick={onCancel}>取消</Button>
          <Button kind="primary" size="md" onClick={onConfirm} autoFocus>打开邮件客户端</Button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDialog;
