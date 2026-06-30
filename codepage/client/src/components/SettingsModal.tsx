import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../stores/appStore';
import { api } from '../utils/api';
import { PRESETS } from '../utils/helpers';
import type { OutputFormat } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  showToast: (msg: string, isError?: boolean) => void;
}

export function SettingsModal({ open, onClose, showToast }: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [model, setModel] = useState('');
  const [authType, setAuthType] = useState('Bearer');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [models, setModels] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const cfg = store.config;
    const env = store.envDefaults;
    if (cfg?.url && cfg?.key && cfg?.model) {
      setUrl(cfg.url);
      setKey(cfg.key);
      setModel(cfg.model);
      setAuthType(cfg.authType || 'Bearer');
      setSystemPrompt(cfg.systemPrompt || '');
      setTemperature(cfg.temperature ?? 0.7);
      setMaxTokens(cfg.maxTokens ?? 4096);
    } else if (env?.url && env?.key && env?.model) {
      setUrl(env.url);
      setKey(env.key);
      setModel(env.model);
      setAuthType(env.authType);
      setSystemPrompt('');
      setTemperature(0.7);
      setMaxTokens(4096);
    } else {
      setUrl(''); setKey(''); setModel(''); setAuthType('Bearer');
      setSystemPrompt(''); setTemperature(0.7); setMaxTokens(4096);
    }
  }, [open]);

  const fetchModels = async () => {
    if (!url) { showToast(t('settings.enterUrl'), true); return; }
    if (authType !== 'None' && !key) { showToast(t('settings.keyRequired'), true); return; }
    try {
      await api.saveConfig({ url, key: key || '', model: model || 'temp', authType, systemPrompt, temperature, maxTokens });
      const data = await api.listModels();
      setModels(data.models);
      if (data.models.length === 0) { showToast(t('settings.fetchModelsEmpty'), true); return; }
      showToast(`✅ ${data.models.length} models found`);
      if (data.models.length === 1) setModel(data.models[0]);
    } catch (e: any) {
      showToast(t('settings.fetchModelsError', { error: e.message }), true);
    }
  };

  const save = async () => {
    if (!url || !model) { showToast(t('settings.fillRequired'), true); return; }
    if (authType !== 'None' && !key) { showToast(t('settings.keyRequired'), true); return; }
    setTesting(true);
    try {
      if (authType !== 'None') {
        await api.testConnection({ url, key, model, systemPrompt, auth: authType });
      }
      await api.saveConfig({ url, key: key || '', model, authType, systemPrompt, temperature, maxTokens });
      store.config = { url, key: key || '', model, authType, systemPrompt, temperature, maxTokens };
      showToast(t('settings.configured'));
      onClose();
    } catch (e: any) {
      showToast(t('settings.connectionFailed', { error: e.message }), true);
    } finally {
      setTesting(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#1a1a22', border: '1px solid #2a2a35', borderRadius: 16,
        width: 540, maxWidth: '90vw', maxHeight: '90vh', overflow: 'auto',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #2a2a35',
        }}>
          <h3 style={{ fontSize: 16 }}>{t('settings.title')}</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#888', fontSize: 24, cursor: 'pointer',
          }}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t('settings.quickSelect')}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESETS.map((p) => (
                <button key={p.name} onClick={() => { setUrl(p.url); setAuthType(p.auth); setModel(p.model); }} style={presetBtnStyle}>
                  {p.name}
                </button>
              ))}
            </div>
            {store.envDefaults?.url && store.envDefaults?.key && (
              <button onClick={() => {
                const e = store.envDefaults!;
                setUrl(e.url);
                setKey(e.key);
                setModel(e.model);
                setAuthType(e.authType);
                setSystemPrompt('');
                setTemperature(0.7);
                setMaxTokens(4096);
                showToast(t('settings.loadFromEnv'));
              }} style={{ ...presetBtnStyle, marginTop: 6, borderColor: '#10b981', color: '#6ee7b7' }}>
                {t('settings.loadFromEnv')}
                </button>
            )}
          </div>
          <FormField label={t('settings.apiUrl')}>
            <input value={url} onChange={(e) => setUrl(e.target.value)} style={inputStyle} placeholder="https://api.deepseek.com/v1/chat/completions" />
          </FormField>
          <FormField label={t('settings.authType')}>
            <select value={authType} onChange={(e) => setAuthType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="Bearer">{t('settings.authBearer')}</option>
              <option value="x-api-key">{t('settings.authXApiKey')}</option>
              <option value="api-key">{t('settings.authApiKey')}</option>
              <option value="None">{t('settings.authNone')}</option>
            </select>
          </FormField>
          <FormField label={t('settings.apiKey')}>
            <input type="password" value={key} onChange={(e) => setKey(e.target.value)} style={inputStyle} placeholder="sk-..." />
          </FormField>
          <FormField label={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <span>{t('settings.model')}</span>
              <button onClick={fetchModels} style={{ ...btnStyle, fontSize: 10 }}>{t('settings.fetchModels')}</button>
            </div>
          }>
            <input value={model} onChange={(e) => setModel(e.target.value)} style={inputStyle} list="modelList" placeholder={t('settings.modelPlaceholder')} />
            <datalist id="modelList">
              {models.map((m) => <option key={m} value={m} />)}
            </datalist>
          </FormField>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>{t('settings.temperature', { val: temperature })}</label>
              <input type="range" min="0" max="2" step="0.1" value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
            <div>
              <label style={labelStyle}>{t('settings.maxTokens', { val: maxTokens })}</label>
              <input type="range" min="512" max="16384" step="512" value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#6366f1' }} />
            </div>
          </div>
          <FormField label={t('settings.systemPrompt')}>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
              style={{ ...inputStyle, minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder={t('settings.systemPromptPlaceholder')}/>
          </FormField>
          <div style={{ borderTop: '1px solid #2a2a35', paddingTop: 16, marginBottom: 16 }}>
            <h4 style={{ fontSize: 13, color: '#ccc', marginBottom: 12 }}>{t('settings.preferences')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{t('settings.defaultFormat')}</label>
                <select value={store.preferences.defaultFormat}
                  onChange={(e) => { store.preferences.defaultFormat = e.target.value as OutputFormat; store.savePreferences(); }}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="html">HTML</option>
                  <option value="react">React (JSX)</option>
                  <option value="vue">Vue 3 (SFC)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{t('settings.defaultPreview')}</label>
                <select value={store.preferences.defaultViewMode}
                  onChange={(e) => { store.preferences.defaultViewMode = e.target.value as 'desktop' | 'mobile'; store.savePreferences(); }}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="desktop">{t('settings.desktop')}</option>
                  <option value="mobile">{t('settings.mobile')}</option>
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>{t('settings.defaultEditorTab')}</label>
              <select value={store.preferences.defaultTab}
                onChange={(e) => { store.preferences.defaultTab = e.target.value as 'code' | 'editor'; store.savePreferences(); }}
                style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="code">{t('settings.sourceCode')}</option>
                <option value="editor">{t('settings.visualEditor')}</option>
              </select>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #2a2a35', paddingTop: 12, fontSize: 11, color: '#555' }}>
            {t('settings.historyLimit', { max: store.historyMax })}
          </div>
        </div>
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          padding: '16px 20px', borderTop: '1px solid #2a2a35',
        }}>
          <button onClick={onClose} style={{ ...btnStyle }}>{t('settings.cancel')}</button>
          <button onClick={save} disabled={testing} style={{
            ...btnStyle, background: testing ? '#5558e6' : '#6366f1', color: '#fff', border: 'none',
            opacity: testing ? 0.7 : 1,
          }}>
            {testing ? t('settings.testing') : t('settings.saveAndTest')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, color: '#888', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', background: '#13131a', border: '1px solid #3a3a4a',
  borderRadius: 8, color: '#e1e1e6', fontSize: 13, outline: 'none',
};
const btnStyle: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: '1px solid #3a3a4a',
  background: 'transparent', color: '#ccc', fontSize: 12, cursor: 'pointer',
};
const presetBtnStyle: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 5, border: '1px solid #3a3a4a',
  background: 'transparent', color: '#aaa', fontSize: 11, cursor: 'pointer',
};
