import { useTranslation } from 'react-i18next';
import { store } from '../stores/appStore';
import { setLanguage } from '../i18n';

interface Props {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onRefresh: () => void;
  onToggleConsole: () => void;
  consoleOpen: boolean;
}

const LANGUAGES = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export function Header({ onToggleSidebar, onOpenSettings, onRefresh, onToggleConsole, consoleOpen }: Props) {
  const { t, i18n } = useTranslation();

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 20px', background: '#1a1a22', borderBottom: '1px solid #2a2a35', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onToggleSidebar} style={btnIconStyle}>☰</button>
        <h1 style={{
          fontSize: 18, background: 'linear-gradient(135deg,#6366f1,#a78bfa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>{t('app.title')}</h1>
        <span style={{
          fontSize: 11, color: store.mode === 'agent' ? '#10b981' : '#555',
          background: '#1f1f2a', padding: '2px 8px', borderRadius: 4,
        }}>
          {store.mode === 'agent' ? t('app.agentMode') : t('app.pageBuilder')}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontSize: 12, color: store.apiConfigured ? '#4ade80' : '#fbbf24',
        }}>
          {store.apiConfigured ? `✓ ${store.config!.model}` : t('app.notConfigured')}
        </span>
        <select
          value={i18n.language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            ...btnStyle, padding: '3px 6px', fontSize: 11, cursor: 'pointer', width: 80,
          }}
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
        <button onClick={onToggleConsole} style={{
          ...btnStyle, color: consoleOpen ? '#6366f1' : '#ccc',
        }}>{t('app.console')}</button>
        <button onClick={onOpenSettings} style={btnStyle}>{t('app.settings')}</button>
        <button onClick={onRefresh} style={btnStyle}>{t('app.refresh')}</button>
      </div>
    </header>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '5px 14px', borderRadius: 6, border: '1px solid #3a3a4a',
  background: 'transparent', color: '#ccc', fontSize: 12, cursor: 'pointer',
};
const btnIconStyle: React.CSSProperties = {
  ...btnStyle, padding: '5px 8px', fontSize: 16, lineHeight: 1,
};
