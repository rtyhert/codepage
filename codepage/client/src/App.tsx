import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Workspace } from './components/Workspace';
import { AgentPanel } from './components/AgentPanel';
import { ConsolePanel } from './components/ConsolePanel';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';
import { store } from './stores/appStore';
import { api } from './utils/api';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; isError?: boolean } | null>(null);

  const showToast = (msg: string, isError?: boolean) => {
    setToast({ msg, isError });
  };

  const loadProjects = async () => {
    try {
      const data = await api.listProjects();
      store.projects = data.projects;
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const data = await api.listHistory();
      store.history = data.items;
    } catch {}
  };

  const loadConfig = async () => {
    try {
      const data = await api.getConfig();
      const { envDefaults, ...config } = data;
      store.envDefaults = envDefaults;
      if (config.url && config.key && config.model) {
        store.config = config;
      }
    } catch {}
  };

  const loadHistoryMax = async () => {
    try {
      const data = await api.listHistory();
      store.historyMax = data.max;
    } catch {}
  };

  useEffect(() => {
    loadConfig();
    loadProjects();
    loadHistory();
    loadHistoryMax();
    store.currentFormat = store.preferences.defaultFormat;
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onRefresh={() => { loadProjects(); loadHistory(); }}
        onToggleConsole={() => setConsoleOpen(!consoleOpen)}
        consoleOpen={consoleOpen}
      />
      <div style={{
        display: 'flex', gap: 0, padding: '4px 16px 0 16px',
        background: '#1a1a22', borderBottom: '1px solid #2a2a35',
      }}>
        <button
          onClick={() => { store.mode = 'builder'; }}
          style={{
            padding: '6px 16px', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, borderRadius: '6px 6px 0 0',
            background: store.mode === 'builder' ? '#0f0f13' : 'transparent',
            color: store.mode === 'builder' ? '#e1e1e6' : '#888',
            borderBottom: store.mode === 'builder' ? '2px solid #6366f1' : '2px solid transparent',
          }}
        > Page Builder</button>
        <button
          onClick={() => { store.mode = 'agent'; }}
          style={{
            padding: '6px 16px', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 500, borderRadius: '6px 6px 0 0',
            background: store.mode === 'agent' ? '#0f0f13' : 'transparent',
            color: store.mode === 'agent' ? '#e1e1e6' : '#888',
            borderBottom: store.mode === 'agent' ? '2px solid #10b981' : '2px solid transparent',
          }}
        > Agent Build</button>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {store.mode === 'builder' ? (
            <>
              <Sidebar
                open={sidebarOpen}
                onSelectProject={(p) => { store.currentProject = p; }}
                onRefresh={loadProjects}
                showToast={showToast}
              />
              <Workspace showToast={showToast} onHistoryChange={loadHistory} />
            </>
          ) : (
            <AgentPanel
              showToast={showToast}
              onCodeGenerated={(code, format) => {
                store.currentCode = code;
                store.currentFormat = format as any;
                window.dispatchEvent(new CustomEvent('codepage:loadCode', {
                  detail: { code, format },
                }));
              }}
            />
          )}
        </div>
        <ConsolePanel open={consoleOpen} onClose={() => setConsoleOpen(false)} />
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        showToast={showToast}
      />
      {toast && <Toast msg={toast.msg} isError={toast.isError} onDone={() => setToast(null)} />}
    </div>
  );
}
