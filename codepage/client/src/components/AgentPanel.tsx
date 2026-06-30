import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { store } from '../stores/appStore';
import { api } from '../utils/api';
import type { AgentRun, AgentTask } from '../types';

interface Props {
  showToast: (msg: string, isError?: boolean) => void;
  onCodeGenerated: (code: string, format: string) => void;
}

const AGENT_ICONS: Record<string, string> = {
  planner: '🧠',
  schema: '🗄',
  backend: '⚙',
  frontend: '🎨',
  integrator: '🔗',
};

const AGENT_COLORS: Record<string, string> = {
  planner: '#8b5cf6',
  schema: '#06b6d4',
  backend: '#f59e0b',
  frontend: '#6366f1',
  integrator: '#10b981',
};

export function AgentPanel({ showToast, onCodeGenerated }: Props) {
  const { t } = useTranslation();
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [requirement, setRequirement] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const taskListRef = useRef<HTMLDivElement>(null);

  const loadRuns = async () => {
    try {
      const data = await api.listAgentRuns();
      setRuns(data.runs);
    } catch {}
  };

  useEffect(() => {
    loadRuns();
  }, []);

  // Poll for updates while executing
  useEffect(() => {
    if (activeRun && isExecuting && activeRun.status === 'executing') {
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.getAgentRun(activeRun.id);
          setActiveRun(data.run);
          // Auto-scroll to latest task
          if (data.run.tasks?.length && taskListRef.current) {
            taskListRef.current.scrollTop = taskListRef.current.scrollHeight;
          }
          if (data.run.status !== 'executing') {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = null;
            setIsExecuting(false);
            if (data.run.status === 'completed') {
              showToast(t('agent.projectGenerated'));
              loadRuns();
              const ft = data.run.tasks?.find((tk: AgentTask) => tk.agentType === 'frontend');
              if (ft?.output) onCodeGenerated(ft.output, 'html');
            } else {
              showToast(t('agent.runFailed'), true);
              loadRuns();
            }
          }
        } catch {}
      }, 1200);
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [activeRun?.id, isExecuting]);

  const startRun = async () => {
    if (!store.apiConfigured) { showToast(t('agent.configureApiFirst'), true); return; }
    if (!requirement.trim()) { showToast(t('agent.describeProject'), true); return; }

    setIsExecuting(true);
    setExpandedTask(null);
    let runId = '';
    try {
      const created = await api.createAgentRun(requirement.slice(0, 60), requirement);
      runId = created.run.id;
      setActiveRun(created.run);
      showToast(t('agent.orchestratorPlanningMsg'));

      await api.executeAgentRun(runId);
      // Polling will pick up from here
    } catch (e: any) {
      showToast(`Error: ${e.message}`, true);
      setIsExecuting(false);
      if (runId) {
        try { const d = await api.getAgentRun(runId); setActiveRun(d.run); } catch {}
      }
    }
  };

  const selectRun = async (run: AgentRun) => {
    if (isExecuting) return;
    try {
      const data = await api.getAgentRun(run.id);
      setActiveRun(data.run);
      setExpandedTask(null);
    } catch {}
  };

  const deleteRun = async (id: string) => {
    if (isExecuting) return;
    try {
      await api.deleteAgentRun(id);
      if (activeRun?.id === id) setActiveRun(null);
      loadRuns();
    } catch {}
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': case 'executing': case 'planning': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⏳';
    }
  };

  const loadCodeFromTask = (task: AgentTask) => {
    if (!task.output) return;
    const code = extractCodeFromOutput(task.output);
    if (code) {
      onCodeGenerated(code, 'html');
      showToast(t('agent.loadCode'));
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Input header */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #2a2a35',
        background: '#1a1a22', flexShrink: 0,
      }}>
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 14, fontWeight: 600,
            background: 'linear-gradient(135deg,#10b981,#34d399)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>{t('agent.title')}</span>
          <span style={{ fontSize: 10, color: '#888', background: '#1f1f2a', padding: '2px 6px', borderRadius: 4 }}>
            {t('agent.subtitle')}
          </span>
          {isExecuting && (
            <span style={{ fontSize: 10, color: '#fbbf24', marginLeft: 4 }}>
              {t('agent.running')}
            </span>
          )}
        </div>
        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          placeholder={t('agent.promptPlaceholder')}
          style={{
            width: '100%', minHeight: 56, maxHeight: 100,
            background: '#13131a', border: '1px solid #3a3a4a',
            borderRadius: 8, color: '#e1e1e6', padding: '8px 12px',
            fontSize: 13, resize: 'vertical', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <button
            onClick={startRun} disabled={isExecuting}
            style={{
              padding: '8px 24px', borderRadius: 8,
              background: isExecuting ? '#374151' : 'linear-gradient(135deg,#059669,#10b981)',
              color: '#fff', border: 'none', cursor: isExecuting ? 'not-allowed' : 'pointer',
              fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {isExecuting ? (
              <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #666', borderTopColor: '#10b981', borderRadius: '50%', animation: 'aspin .7s linear infinite' }} /> {t('agent.running')}</>
            ) : t('agent.startBuild')}
          </button>
          <span style={{ fontSize: 10, color: '#555', alignSelf: 'center' }}>
            {t('agent.pipeline')}
          </span>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sidebar */}
        <div style={{
          width: 220, minWidth: 220, borderRight: '1px solid #2a2a35',
          overflow: 'auto', background: '#16161e',
        }}>
          <div style={{ padding: '6px 10px', borderBottom: '1px solid #2a2a35', fontSize: 10, fontWeight: 600, color: '#666' }}>
            {t('agent.runHistory')}
          </div>
          {runs.map((run) => (
            <div
              key={run.id} onClick={() => selectRun(run)}
              style={{
                padding: '7px 10px', cursor: isExecuting ? 'not-allowed' : 'pointer', fontSize: 11,
                background: activeRun?.id === run.id ? '#1a1a22' : 'transparent',
                borderBottom: '1px solid #1f1f2a', opacity: isExecuting && activeRun?.id !== run.id ? 0.4 : 1,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ddd', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{run.name}</span>
                <span>{getStatusIcon(run.status)}</span>
              </div>
              <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{t('agent.tasks', { count: run.tasks?.length || 0 })}</div>
            </div>
          ))}
          {runs.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#555', fontSize: 11 }}>{t('agent.noRuns')}</div>
          )}
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, overflow: 'auto', padding: 12, background: '#0d0d14' }} ref={taskListRef}>
          {!activeRun ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#555', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 36 }}>🤖</div>
              <div style={{ fontSize: 13 }}>{t('agent.emptyTitle')}</div>
              <div style={{ fontSize: 11, color: '#444' }}>{t('agent.emptySubtitle')}</div>
            </div>
          ) : (
            <>
              {/* Run header */}
              <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 15, marginBottom: 2 }}>{activeRun.name}</h3>
                  <p style={{ fontSize: 11, color: '#888' }}>{activeRun.requirement}</p>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {activeRun.status === 'executing' && (
                    <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 600 }}>
                      {t('agent.executing')}
                    </span>
                  )}
                  <span style={{
                    padding: '1px 8px', borderRadius: 8, fontSize: 9, fontWeight: 600,
                    background: activeRun.status === 'completed' ? '#065f46' : activeRun.status === 'failed' ? '#7f1d1d' : activeRun.status === 'executing' ? '#1e3a5f' : '#2a2a35',
                    color: activeRun.status === 'completed' ? '#6ee7b7' : activeRun.status === 'failed' ? '#fca5a5' : activeRun.status === 'executing' ? '#93c5fd' : '#aaa',
                  }}>
                    {activeRun.status.toUpperCase()}
                  </span>
                  <button onClick={() => deleteRun(activeRun.id)} disabled={isExecuting} style={{
                    padding: '2px 6px', borderRadius: 4, border: '1px solid #3a3a4a',
                    background: 'transparent', color: '#ef4444', fontSize: 9, cursor: isExecuting ? 'not-allowed' : 'pointer', opacity: isExecuting ? 0.4 : 1,
                  }}>{t('agent.del')}</button>
                </div>
              </div>

              {/* Task list */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#666', marginBottom: 6 }}>
                  {t('agent.tasks')}{activeRun.tasks?.length > 0 ? ` (${activeRun.tasks.length})` : ''}
                </div>
                {activeRun.tasks?.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[...activeRun.tasks].sort((a, b) => a.sortOrder - b.sortOrder).map((task, idx) => (
                      <div
                        key={task.id}
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                        style={{
                          padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                          background: '#1a1a22', border: '1px solid #2a2a35',
                          opacity: task.status === 'pending' ? 0.5 : 1,
                          transition: 'opacity .2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, color: '#555', minWidth: 18 }}>#{idx + 1}</span>
                            <span style={{ fontSize: 14 }}>{AGENT_ICONS[task.agentType] || '🤖'}</span>
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 500, color: '#ddd' }}>{task.name}</div>
                              <div style={{ fontSize: 9, color: '#666' }}>{task.description}</div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              padding: '1px 5px', borderRadius: 3, fontSize: 8, fontWeight: 600,
                              color: AGENT_COLORS[task.agentType] || '#888',
                              background: `${AGENT_COLORS[task.agentType] || '#888'}15`,
                            }}>{task.agentType}</span>
                            {task.status === 'running' ? (
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #3a3a4a', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'aspin .6s linear infinite' }} />
                            ) : (
                              <span style={{ fontSize: 12 }}>{getStatusIcon(task.status)}</span>
                            )}
                          </div>
                        </div>

                        {expandedTask === task.id && task.output && (
                          <div style={{ marginTop: 6 }}>
                            <pre style={{
                              background: '#0d0d14', padding: 6, borderRadius: 4,
                              fontSize: 10, maxHeight: 200, overflow: 'auto',
                              color: '#ccc', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                              border: '1px solid #2a2a35',
                            }}>{task.output.slice(0, 3000)}{task.output.length > 3000 ? '\n...' : ''}</pre>
                            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                              <button onClick={() => loadCodeFromTask(task)} style={{
                                padding: '2px 8px', borderRadius: 3,
                                background: '#6366f1', color: '#fff', border: 'none',
                                fontSize: 9, cursor: 'pointer',
                              }}>{t('agent.loadCode')}</button>
                            </div>
                          </div>
                        )}

                        {expandedTask === task.id && task.status === 'failed' && task.error && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#ef4444', background: '#2a0a0a', padding: '4px 8px', borderRadius: 4 }}>
                            {task.error}
                          </div>
                        )}

                        {expandedTask === task.id && task.status === 'pending' && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#666' }}>
                            {t('agent.waitingDeps')}
                          </div>
                        )}

                        {expandedTask === task.id && task.status === 'running' && (
                          <div style={{ marginTop: 4, fontSize: 10, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-block', width: 8, height: 8, border: '2px solid #3a3a4a', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'aspin .6s linear infinite' }} />
                            {t('agent.agentWorking')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{
                    padding: 20, textAlign: 'center', fontSize: 11, color: '#555',
                    background: '#1a1a22', borderRadius: 6, border: '1px solid #2a2a35',
                  }}>
                    {activeRun.status === 'executing' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #3a3a4a', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'aspin .7s linear infinite' }} />
                        {t('agent.orchestratorPlanning')}
                      </div>
                    ) : activeRun.status === 'pending' ? t('agent.runPending') : t('agent.noTasks')}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              {activeRun.tasks?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#666', marginBottom: 4 }}>
                    {t('agent.progress', { done: activeRun.tasks.filter((tk) => tk.status === 'completed').length, total: activeRun.tasks.length })}
                  </div>
                  <div style={{ height: 4, background: '#2a2a35', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${(activeRun.tasks.filter((t) => t.status === 'completed').length / activeRun.tasks.length) * 100}%`,
                      background: 'linear-gradient(90deg,#6366f1,#10b981)',
                      transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Result summary */}
              {activeRun.result && activeRun.status === 'completed' && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#666', marginBottom: 6 }}>{t('agent.summary')}</div>
                  <div style={{
                    padding: 10, borderRadius: 6, fontSize: 11, color: '#ccc', lineHeight: 1.5,
                    background: '#1a1a22', border: '1px solid #2a2a35',
                  }}>
                    {(() => {
                      try { const p = JSON.parse(activeRun.result); return p.summary || t('agent.noSummary'); } catch { return activeRun.result; }
                    })()}
                  </div>
                </div>
              )}

              {/* Artifact files */}
              {activeRun.status === 'completed' && activeRun.tasks.length > 0 && (
                <FileViewer tasks={activeRun.tasks} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Spinner keyframes */}
      <style>{`@keyframes aspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function FileViewer({ tasks }: { tasks: AgentTask[] }) {
  const { t } = useTranslation();
  const files: { taskName: string; agentType: string; path: string; content: string; lang: string }[] = [];

  for (const task of tasks) {
    if (!task.output) continue;
    const fileRegex = /##\s*filename:\s*(.+?)\n```(\w*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = fileRegex.exec(task.output)) !== null) {
      files.push({ taskName: task.name, agentType: task.agentType, path: match[1].trim(), content: match[3].trim(), lang: match[2] || 'text' });
    }
    if (files.length === 0) {
      const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
      while ((match = codeRegex.exec(task.output)) !== null) {
        files.push({ taskName: task.name, agentType: task.agentType, path: `${task.agentType}/output.${match[1] || 'txt'}`, content: match[2].trim(), lang: match[1] || 'text' });
      }
    }
  }

  if (files.length === 0) return null;

  const [selected, setSelected] = useState(0);
  const file = files[selected];

  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#666', marginBottom: 6 }}>
        {t('agent.files', { count: files.length })}
      </div>
      <div style={{ borderRadius: 6, border: '1px solid #2a2a35', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 1, padding: '3px 3px 0 3px', background: '#16161e', overflowX: 'auto' }}>
          {files.map((f, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: '3px 8px', borderRadius: '3px 3px 0 0', border: 'none', cursor: 'pointer',
              fontSize: 9, whiteSpace: 'nowrap',
              background: selected === i ? '#0d0d14' : 'transparent',
              color: selected === i ? '#e1e1e6' : '#888',
              borderBottom: selected === i ? '2px solid #6366f1' : '2px solid transparent',
            }}>
              <span style={{ opacity: 0.6 }}>{f.agentType[0].toUpperCase()}</span> {f.path.split('/').pop()}
            </button>
          ))}
        </div>
        <div style={{ padding: '1px 8px', fontSize: 9, color: '#555', background: '#13131a', borderBottom: '1px solid #2a2a35' }}>
          {file.path}
        </div>
        <pre style={{
          margin: 0, padding: 10, fontSize: 10, lineHeight: 1.4,
          background: '#0d0d14', color: '#ccc', maxHeight: 300, overflow: 'auto',
          whiteSpace: 'pre-wrap', wordBreak: 'break-all',
        }}>{file.content}</pre>
      </div>
    </div>
  );
}

function extractCodeFromOutput(output: string | undefined): string {
  if (!output) return '';
  const m = output.match(/```(?:html|typescript|tsx|jsx|javascript|css)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : output;
}
