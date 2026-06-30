import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../stores/appStore';
import { api } from '../utils/api';
import {
  extractCodeBlock, escapeHtml, formatHTML, minifyCode, downloadCode,
  getAllTemplates, exportTemplatesJSON, importTemplatesJSON, downloadJSON, readFileAsText,
} from '../utils/helpers';
import { VisualEditor } from './VisualEditor';

interface Props {
  showToast: (msg: string, isError?: boolean) => void;
  onHistoryChange: () => void;
}

export function Workspace({ showToast, onHistoryChange }: Props) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>(store.preferences.defaultViewMode);
  const [tab, setTab] = useState<'code' | 'editor'>(store.preferences.defaultTab);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isHTML = store.currentFormat === 'html';

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      store.currentCode = detail.code;
      store.currentFormat = detail.format;
      updatePreview(detail.code);
      forceUpdate();
    };
    window.addEventListener('codepage:loadCode', handler);

    // Pick up any code already in store (e.g., from agent mode)
    if (store.currentCode && isHTML) {
      updatePreview(store.currentCode);
    }

    return () => window.removeEventListener('codepage:loadCode', handler);
  }, []);

  const [, forceRender] = useState(0);
  const forceUpdate = () => forceRender((n) => n + 1);

  const updatePreview = (code: string) => {
    if (iframeRef.current && isHTML) {
      iframeRef.current.srcdoc = code;
    }
  };

  const cancelGeneration = () => {
    if (store.abortController) {
      store.abortController.abort();
      store.abortController = null;
      store.isGenerating = false;
      setLastError(null);
      forceUpdate();
      showToast(t('workspace.generationCancelled'));
    }
  };

  const generate = async () => {
    if (!store.apiConfigured) { showToast(t('workspace.configureApiFirst'), true); return; }
    if (!prompt.trim()) { showToast(t('workspace.describePrompt'), true); return; }
    const tagHints = [...store.activeTags].join(', ');
    store.isGenerating = true;
    setLastError(null);
    setLastPrompt(prompt);
    store.abortController = new AbortController();
    forceUpdate();
    try {
      const data = await api.generate(prompt, store.currentFormat, tagHints, store.abortController.signal);
      const cleaned = extractCodeBlock(data.code);
      store.currentCode = cleaned;
      updatePreview(cleaned);
      await api.saveHistory({ prompt: prompt.slice(0, 200), code: cleaned, format: store.currentFormat, tagHints });
      onHistoryChange();
      showToast(t('workspace.codeGenerated'));
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      setLastError(e.message);
      showToast(`❌ ${e.message}`, true);
    } finally {
      store.isGenerating = false;
      store.abortController = null;
      forceUpdate();
    }
  };

  const retry = () => {
    if (lastPrompt) {
      setPrompt(lastPrompt);
      generate();
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #2a2a35', flexShrink: 0,
        background: '#1a1a22', display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{ flex: 1 }}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') generate(); }}
            placeholder={t('workspace.promptPlaceholder')}
            style={{
              width: '100%', minHeight: 60, maxHeight: 100, background: '#13131a',
              border: '1px solid #3a3a4a', borderRadius: 8, color: '#e1e1e6',
              padding: '10px 12px', fontSize: 13, resize: 'vertical', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {getAllTemplates().map((tmpl) => (
              <button key={tmpl.name} onClick={() => setPrompt(tmpl.prompt)} style={chipStyle}>
                {tmpl.name}
              </button>
            ))}
            <button onClick={async () => {
              try {
                const json = await readFileAsText();
                const result = importTemplatesJSON(json);
                const msgs: string[] = [];
                if (result.custom > 0) msgs.push(`${result.custom} custom templates imported`);
                if (result.builtin > 0) msgs.push(`${result.builtin} built-in templates matched`);
                if (result.errors.length) msgs.push(...result.errors);
                showToast(msgs.join(', ') || 'No new templates found');
                forceUpdate();
              } catch { showToast('Import cancelled', true); }
              }} style={chipStyle} title={t('workspace.import')}>{t('workspace.import')}</button>
            <button onClick={() => {
              const json = exportTemplatesJSON();
              downloadJSON(json, 'codepage-templates.json');
              showToast(t('workspace.templatesExported'));
            }} style={chipStyle} title={t('workspace.export')}>{t('workspace.export')}</button>
            <div style={{ flex: 1 }} />
            {['html', 'react', 'vue'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => { store.currentFormat = fmt as any; store.preferences.defaultFormat = fmt as any; store.savePreferences(); forceUpdate(); }}
                style={{
                  ...chipStyle,
                  background: store.currentFormat === fmt ? '#6366f1' : 'transparent',
                  color: store.currentFormat === fmt ? '#fff' : '#aaa',
                  borderColor: store.currentFormat === fmt ? '#6366f1' : '#3a3a4a',
                }}
              >{fmt.toUpperCase()}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            {[
              { key: 'Dark', label: t('workspace.tagDark') },
              { key: 'Responsive', label: t('workspace.tagResponsive') },
              { key: 'Tailwind', label: t('workspace.tagTailwind') },
              { key: 'Animated', label: t('workspace.tagAnimated') },
            ].map((tag) => (
              <button
                key={tag.key}
                onClick={() => {
                  if (store.activeTags.has(tag.key)) store.activeTags.delete(tag.key);
                  else store.activeTags.add(tag.key);
                  forceUpdate();
                }}
                style={{
                  ...chipStyle, fontSize: 10,
                  borderColor: store.activeTags.has(tag.key) ? '#6366f1' : '#3a3a4a',
                  background: store.activeTags.has(tag.key) ? 'rgba(99,102,241,.15)' : 'transparent',
                  color: store.activeTags.has(tag.key) ? '#6366f1' : '#aaa',
                }}
              >{tag.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
          {store.isGenerating ? (
            <button
              onClick={cancelGeneration}
              style={{
                padding: '8px 20px', borderRadius: 8,
                background: '#ef4444', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              }}
            >{t('workspace.cancel')}</button>
          ) : (
            <button
              onClick={generate}
              style={{
                padding: '8px 20px', borderRadius: 8,
                background: 'linear-gradient(135deg,#6366f1,#a78bfa)',
                color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >{t('workspace.generate')}</button>
          )}
          {lastError && !store.isGenerating && (
            <button onClick={retry} style={{
              padding: '8px 14px', borderRadius: 8,
              background: '#2a2a35', color: '#fbbf24', border: '1px solid #fbbf24',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            }}>{t('workspace.retry')}</button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a35' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 14px', borderBottom: '1px solid #2a2a35',
          }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['code', 'editor'].map((tb) => (
                <button
                  key={tb}
                  onClick={() => { setTab(tb as any); store.preferences.defaultTab = tb as any; store.savePreferences(); }}
                  style={{
                    padding: '3px 10px', borderRadius: 4, border: 'none',
                    background: tab === tb ? '#6366f1' : 'transparent',
                    color: tab === tb ? '#fff' : '#888', fontSize: 11, cursor: 'pointer',
                  }}
                >{tb === 'code' ? t('workspace.source') : t('workspace.editor')}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <ActionBtn label={t('workspace.format')} onClick={() => {
                if (!store.currentCode) return;
                store.currentCode = formatHTML(store.currentCode);
                updatePreview(store.currentCode);
                forceUpdate();
                showToast(t('workspace.formatted'));
              }} />
              <ActionBtn label={t('workspace.minify')} onClick={() => {
                if (!store.currentCode) return;
                store.currentCode = minifyCode(store.currentCode);
                forceUpdate();
                showToast(t('workspace.minified'));
              }} />
              <ActionBtn label={t('workspace.copy')} onClick={async () => {
                if (!store.currentCode) return;
                await navigator.clipboard.writeText(store.currentCode);
                showToast(t('workspace.copied'));
              }} />
              <ActionBtn label={t('workspace.download')} onClick={() => {
                if (!store.currentCode) return;
                downloadCode(store.currentCode, store.currentFormat);
                showToast(t('workspace.downloaded'));
              }} />
              <ActionBtn label={t('workspace.submitTemplate')} onClick={async () => {
                if (!store.currentCode) return;
                const json = exportTemplatesJSON();
                await navigator.clipboard.writeText(json);
                showToast(t('workspace.templateCopied'));
                window.open('https://github.com/your-org/codepage/issues/new?template=template_submission.md', '_blank');
              }} />
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', background: '#0d0d14' }}>
            {tab === 'code' ? (
              store.currentCode ? (
                <pre style={{
                  fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: 13,
                  lineHeight: 1.6, padding: 16, margin: 0, color: '#e1e1e6',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                }}>{escapeHtml(store.currentCode)}</pre>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', fontSize: 13 }}>
                  {t('workspace.noCodeYet')}
                </div>
              )
            ) : (
              <VisualEditor
                code={store.currentCode}
                format={store.currentFormat}
                onChange={(newCode) => {
                  store.currentCode = newCode;
                  updatePreview(newCode);
                  forceUpdate();
                }}
              />
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '6px 14px', borderBottom: '1px solid #2a2a35',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>{t('workspace.livePreview')}</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => { setViewMode('desktop'); store.preferences.defaultViewMode = 'desktop'; store.savePreferences(); }} style={{
                ...viewBtnStyle, background: viewMode === 'desktop' ? '#6366f1' : 'transparent',
                color: viewMode === 'desktop' ? '#fff' : '#888',
              }}>🖥</button>
              <button onClick={() => { setViewMode('mobile'); store.preferences.defaultViewMode = 'mobile'; store.savePreferences(); }} style={{
                ...viewBtnStyle, background: viewMode === 'mobile' ? '#6366f1' : 'transparent',
                color: viewMode === 'mobile' ? '#fff' : '#888',
              }}>📱</button>
              <ActionBtn label={t('workspace.fullscreen')} onClick={() => {
                const el = document.querySelector('#previewWrap') as HTMLElement;
                if (el?.requestFullscreen) el.requestFullscreen();
              }} />
            </div>
          </div>
          <div id="previewWrap" style={{
            flex: 1, background: '#fff', position: 'relative', overflow: 'auto',
          }}>
            <div style={viewMode === 'mobile' ? { width: 375, margin: '0 auto', minHeight: '100%' } : { width: '100%', minHeight: '100%' }}>
              {isHTML && store.currentCode ? (
                <iframe ref={iframeRef} style={{ width: '100%', height: '100%', border: 'none', background: '#fff', minHeight: 400 }} />
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', color: '#999', fontSize: 13, flexDirection: 'column', gap: 8,
                  background: '#f5f5f5', minHeight: 400,
                }}>
                  {store.currentCode
                    ? t('workspace.previewNotAvailable', { format: store.currentFormat.toUpperCase() })
                    : t('workspace.previewPlaceholder')}
                </div>
              )}
            </div>
            {store.isGenerating && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(15,15,19,.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10,
              }}>
                <div style={{
                  width: 32, height: 32, border: '3px solid #2a2a35',
                  borderTopColor: '#6366f1', borderRadius: '50%',
                  animation: 'spin .8s linear infinite',
                }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '3px 8px', borderRadius: 4, border: '1px solid #3a3a4a',
      background: 'transparent', color: '#aaa', fontSize: 10, cursor: 'pointer', whiteSpace: 'nowrap',
    }}>{label}</button>
  );
}

const chipStyle: React.CSSProperties = {
  padding: '2px 8px', borderRadius: 10, border: '1px solid #3a3a4a',
  background: 'transparent', color: '#aaa', fontSize: 10, cursor: 'pointer',
};

const viewBtnStyle: React.CSSProperties = {
  padding: '3px 8px', borderRadius: 4, border: '1px solid #3a3a4a',
  fontSize: 11, cursor: 'pointer',
};
