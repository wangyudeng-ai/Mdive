import React, { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { FiX, FiSearch } from 'react-icons/fi';
import { SearchHit, FileEntry } from '../../types';

interface SearchPanelProps {
  workspacePath: string;
  onClose: () => void;
  onOpenFile: (entry: FileEntry) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ workspacePath, onClose, onOpenFile }) => {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef(0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      try {
        const results = await invoke<SearchHit[]>('search_workspace', {
          root: workspacePath,
          query,
        });
        setHits(results);
      } catch (err) {
        console.error('search_workspace failed:', err);
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(debounceRef.current);
  }, [query, workspacePath]);

  const handleOpen = useCallback((hit: SearchHit) => {
    onOpenFile({
      name: hit.name,
      path: hit.path,
      is_dir: false,
      extension: hit.path.split('.').pop() ?? null,
    });
  }, [onOpenFile]);

  const highlight = (text: string, q: string) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{ backgroundColor: 'var(--accent-color)', color: '#fff', padding: '0 2px', borderRadius: '2px' }}>
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  // Group by file
  const grouped = hits.reduce<Record<string, SearchHit[]>>((acc, h) => {
    (acc[h.path] ??= []).push(h);
    return acc;
  }, {});

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '600px',
        maxHeight: '70vh',
        backgroundColor: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <FiSearch style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') onClose();
          }}
          placeholder="搜索工作区中的 .md / .txt 内容…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '14px',
            fontFamily: 'inherit',
          }}
        />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '60px', textAlign: 'right' }}>
          {loading ? '搜索中…' : query ? `${hits.length} 条` : ''}
        </span>
        <button
          onClick={onClose}
          title="关闭 (Esc)"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
          }}
        >
          <FiX />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {Object.entries(grouped).map(([path, lines]) => (
          <div key={path}>
            <div
              style={{
                padding: '8px 12px 4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
              }}
              title={path}
            >
              {lines[0].name}
              <span style={{ fontWeight: 400, marginLeft: '6px' }}>
                {(path.startsWith(workspacePath) ? path.slice(workspacePath.length) : path).replace(/^\//, '')}
              </span>
            </div>
            {lines.map((hit, i) => (
              <div
                key={`${path}-${i}`}
                onClick={() => handleOpen(hit)}
                style={{
                  padding: '6px 16px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  color: 'var(--text-primary)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', minWidth: '36px', fontSize: '12px' }}>
                  {hit.line}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {highlight(hit.text, query)}
                </span>
              </div>
            ))}
          </div>
        ))}
        {!loading && query && hits.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            没有匹配结果
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPanel;