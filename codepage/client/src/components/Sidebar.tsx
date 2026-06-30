import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../stores/appStore';
import { api } from '../utils/api';
import type { Project, HistoryItem } from '../types';
import { FORMAT_NAMES } from '../utils/helpers';

interface Props {
  open: boolean;
  onSelectProject: (p: Project | null) => void;
  onRefresh: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export function Sidebar({ open, onSelectProject, onRefresh, showToast }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'projects' | 'history'>('projects');

  if (!open) return null;

  return (
    <div style={{
      width: 280, minWidth: 280, background: '#16161e',
      borderRight: '1px solid #2a2a35', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2a35' }}>
        {(['projects', 'history'] as const).map((tabName) => (
          <button key={tabName} onClick={() => setTab(tabName)} style={{
            flex: 1, padding: '8px 0', border: 'none', background: tab === tabName ? '#1a1a22' : 'transparent',
            color: tab === tabName ? '#e1e1e6' : '#666', fontSize: 12, cursor: 'pointer', fontWeight: tab === tabName ? 600 : 400,
            borderBottom: tab === tabName ? '2px solid #6366f1' : '2px solid transparent',
          }}>
            {tabName === 'projects' ? t('sidebar.projects') : t('sidebar.history')}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
        {tab === 'projects' ? (
          <ProjectList onSelect={onSelectProject} onRefresh={onRefresh} showToast={showToast} />
        ) : (
          <HistoryList showToast={showToast} />
        )}
      </div>
    </div>
  );
}

function ProjectList({ onSelect, onRefresh, showToast }: {
  onSelect: (p: Project | null) => void;
  onRefresh: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}) {
  const { t } = useTranslation();
  const [newName, setNewName] = useState('');

  const create = async () => {
    if (!newName.trim()) return;
    try {
      await api.createProject(newName.trim());
      setNewName('');
      onRefresh();
      showToast(t('sidebar.projectCreated'));
    } catch (e: any) {
      showToast(`❌ ${e.message}`, true);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          placeholder={t('sidebar.newProjectPlaceholder')}
          style={inputStyle}
        />
        <button onClick={create} style={{ ...btnStyle, padding: '4px 10px' }}>+</button>
      </div>
      {store.projects.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p)}
          style={{
            padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
            color: '#999', marginBottom: 2,
            background: store.currentProject?.id === p.id ? '#1a1a22' : 'transparent',
          }}
          onMouseEnter={(e) => { if (store.currentProject?.id !== p.id) e.currentTarget.style.background = '#1f1f2a'; }}
          onMouseLeave={(e) => { if (store.currentProject?.id !== p.id) e.currentTarget.style.background = 'transparent'; }}
        >
          <div style={{ fontWeight: 500, color: '#ddd' }}>{p.name}</div>
          <div style={{ fontSize: 10, color: '#555' }}>{p._count?.pages || 0} {t('sidebar.pages')}</div>
        </div>
      ))}
      {store.projects.length === 0 && (
        <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 20 }}>{t('sidebar.noProjects')}</div>
      )}
    </div>
  );
}

function HistoryList({ showToast }: { showToast: (msg: string, isError?: boolean) => void }) {
  const { t } = useTranslation();
  const load = (item: HistoryItem) => {
    store.currentCode = item.code;
    store.currentFormat = item.format as any;
    showToast(t('sidebar.loadedFromHistory'));
    window.dispatchEvent(new CustomEvent('codepage:loadCode', {
      detail: { code: item.code, format: item.format },
    }));
  };

  return (
    <div>
      {store.history.length > 0 && (
        <div style={{ textAlign: 'right', marginBottom: 6 }}>
          <button
            onClick={async () => {
              if (!confirm(t('sidebar.clearConfirm'))) return;
              try { await api.clearHistory(); store.history = []; showToast(t('sidebar.historyCleared')); } catch {}
            }}
            style={{ ...btnStyle, fontSize: 10, color: '#ef4444' }}
          >{t('sidebar.clear')}</button>
        </div>
      )}
      {store.history.map((h) => (
        <div
          key={h.id}
          onClick={() => load(h)}
          style={{
            padding: '5px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11,
            color: '#999', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#1a1a22'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          {h.prompt}
          {h.format !== 'html' && (
            <span style={{ fontSize: 9, color: '#6366f1', marginLeft: 4 }}>[{FORMAT_NAMES[h.format]}]</span>
          )}
        </div>
      ))}
      {store.history.length === 0 && (
        <div style={{ color: '#555', fontSize: 11, textAlign: 'center', padding: 20 }}>{t('sidebar.noHistory')}</div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1, padding: '6px 8px', background: '#13131a', border: '1px solid #3a3a4a',
  borderRadius: 5, color: '#e1e1e6', fontSize: 11, outline: 'none',
};
const btnStyle: React.CSSProperties = {
  padding: '4px 8px', borderRadius: 5, border: '1px solid #3a3a4a',
  background: 'transparent', color: '#ccc', fontSize: 11, cursor: 'pointer',
};
