import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'system' | 'agent' | 'api' | 'llm';
  message: string;
  data?: string;
  timestamp: string;
}

const LEVEL_COLORS: Record<string, string> = {
  info: '#e1e1e6',
  warn: '#fbbf24',
  error: '#ef4444',
  debug: '#6b7280',
};

const LEVEL_BG: Record<string, string> = {
  info: 'transparent',
  warn: 'rgba(251,191,36,.08)',
  error: 'rgba(239,68,68,.1)',
  debug: 'transparent',
};

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  system: { label: 'SYS', color: '#6b7280' },
  agent: { label: 'AGT', color: '#10b981' },
  api: { label: 'API', color: '#6366f1' },
  llm: { label: 'LLM', color: '#f59e0b' },
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ConsolePanel({ open, onClose }: Props) {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    // Initial fetch
    fetchLogs();
    // Poll for new logs
    pollRef.current = setInterval(fetchLogs, 1500);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [open]);

  const fetchLogs = async () => {
    try {
      const resp = await fetch(`/api/console/logs?after=${lastIdRef.current}`);
      const data = await resp.json();
      if (data.entries?.length) {
        setEntries((prev) => [...prev, ...data.entries]);
        lastIdRef.current = data.entries[data.entries.length - 1].id;
      }
    } catch {}
  };

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [entries, autoScroll]);

  const clearLogs = async () => {
    try {
      await fetch('/api/console/logs', { method: 'DELETE' });
      setEntries([]);
      lastIdRef.current = 0;
    } catch {}
  };

  const filtered = filter === 'all' ? entries : entries.filter((e) => {
    if (filter === 'error') return e.level === 'error' || e.level === 'warn';
    return e.source === filter;
  });

  const counts = {
    all: entries.length,
    error: entries.filter((e) => e.level === 'error' || e.level === 'warn').length,
  };

  if (!open) return null;

  return (
    <div style={{
      height: 200, minHeight: 120, flexShrink: 0,
      borderTop: '2px solid #2a2a35', background: '#0a0a0f',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '3px 10px', background: '#13131a', borderBottom: '1px solid #2a2a35',
        flexShrink: 0, gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#888' }}>{t('console.title')}</span>
          <span style={{ fontSize: 9, color: '#555' }}>{entries.length} {t('console.entries')}</span>
          {counts.error > 0 && (
            <span style={{ fontSize: 9, color: '#ef4444' }}>({counts.error} {t('console.warningsErrors')})</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { key: 'all', label: t('console.filterAll') },
            { key: 'error', label: t('console.filterErrors') },
            { key: 'agent', label: t('console.filterAgent') },
            { key: 'llm', label: t('console.filterLLM') },
            { key: 'api', label: t('console.filterAPI') },
            { key: 'system', label: t('console.filterSystem') },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '1px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
              fontSize: 9, fontWeight: filter === f.key ? 600 : 400,
              background: filter === f.key ? '#2a2a35' : 'transparent',
              color: filter === f.key ? '#e1e1e6' : '#666',
            }}>{f.label}</button>
          ))}
          <div style={{ width: 1, height: 14, background: '#2a2a35', margin: '0 4px' }} />
          <button onClick={() => setAutoScroll(!autoScroll)} style={{
            padding: '1px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
            fontSize: 9, background: 'transparent',
            color: autoScroll ? '#6366f1' : '#666',
          }}>{t('console.autoScroll')}</button>
          <button onClick={clearLogs} style={{
            padding: '1px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
            fontSize: 9, background: 'transparent', color: '#666',
          }}>{t('console.clear')}</button>
          <button onClick={onClose} style={{
            padding: '1px 6px', borderRadius: 3, border: 'none', cursor: 'pointer',
            fontSize: 12, background: 'transparent', color: '#888',
          }}>&times;</button>
        </div>
      </div>

      {/* Log entries */}
      <div ref={containerRef} style={{
        flex: 1, overflow: 'auto', padding: '2px 0', fontFamily: "'JetBrains Mono','Fira Code',monospace",
        fontSize: 11, lineHeight: 1.6,
      }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '20px 14px', color: '#444', textAlign: 'center', fontSize: 10 }}>
            {t('console.noEntries')}
          </div>
        ) : (
          filtered.map((entry) => {
            const badge = SOURCE_BADGES[entry.source] || { label: '?', color: '#666' };
            return (
              <div key={entry.id} style={{
                padding: '1px 10px', display: 'flex', gap: 8, alignItems: 'flex-start',
                background: LEVEL_BG[entry.level] || 'transparent',
              }}>
                <span style={{
                  display: 'inline-block', width: 28, padding: '0 4px', borderRadius: 2,
                  fontSize: 8, fontWeight: 600, textAlign: 'center', flexShrink: 0,
                  color: badge.color, background: `${badge.color}15`, marginTop: 3,
                  lineHeight: '16px',
                }}>{badge.label}</span>
                <span style={{
                  flexShrink: 0, width: 40, fontSize: 9, color: '#444', marginTop: 3,
                }}>
                  {entry.timestamp.slice(11, 19)}
                </span>
                <span style={{
                  flex: 1, color: LEVEL_COLORS[entry.level] || '#e1e1e6',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>
                  {entry.message}
                  {entry.data && (
                    <span style={{ color: '#6b7280', marginLeft: 6, fontSize: 10 }}>{entry.data}</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
