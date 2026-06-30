import type { LLMConfig, ConfigResponse, Project, Page, HistoryItem } from '../types';

async function request<T>(url: string, options?: RequestInit & { signal?: AbortSignal }): Promise<T> {
  const resp = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data.error || `HTTP ${resp.status}`);
  return data;
}

export const api = {
  // Config
  getConfig: () => request<ConfigResponse>('/api/config'),
  saveConfig: (config: LLMConfig) => request<{ success: boolean }>('/api/config', { method: 'POST', body: JSON.stringify(config) }),
  testConnection: (config: Partial<LLMConfig> & { auth?: string }) => request<{ success: boolean }>('/api/test', { method: 'POST', body: JSON.stringify(config) }),

  // Generation
  generate: (prompt: string, format: string, tagHints?: string, signal?: AbortSignal) =>
    request<{ code: string }>('/api/generate', { method: 'POST', body: JSON.stringify({ prompt, format, tagHints }), signal }),

  // Models
  listModels: () => request<{ models: string[] }>('/api/models'),

  // Projects
  listProjects: () => request<{ projects: Project[] }>('/api/projects'),
  getProject: (id: string) => request<{ project: Project }>(`/api/projects/${id}`),
  createProject: (name: string, prompt?: string) =>
    request<{ project: Project }>('/api/projects', { method: 'POST', body: JSON.stringify({ name, prompt }) }),
  updateProject: (id: string, name: string) =>
    request<{ project: Project }>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteProject: (id: string) => request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),

  // Pages
  createPage: (projectId: string, data: Partial<Page>) =>
    request<{ page: Page }>(`/api/projects/${projectId}/pages`, { method: 'POST', body: JSON.stringify(data) }),
  updatePage: (id: string, data: Partial<Page>) =>
    request<{ page: Page }>(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePage: (id: string) => request<{ success: boolean }>(`/api/pages/${id}`, { method: 'DELETE' }),
  reorderPages: (orders: { id: string; sortOrder: number }[]) =>
    request<{ success: boolean }>('/api/pages/reorder', { method: 'PATCH', body: JSON.stringify({ orders }) }),

  // History
  listHistory: () => request<{ items: HistoryItem[]; max: number }>('/api/history'),
  saveHistory: (data: Partial<HistoryItem>) =>
    request<{ success: boolean }>('/api/history', { method: 'POST', body: JSON.stringify(data) }),
  clearHistory: () => request<{ success: boolean }>('/api/history', { method: 'DELETE' }),

  // Agent
  listAgentRuns: () => request<{ runs: any[] }>('/api/agent/runs'),
  getAgentRun: (id: string) => request<{ run: any }>(`/api/agent/runs/${id}`),
  createAgentRun: (name: string, requirement: string) =>
    request<{ run: any }>('/api/agent/runs', { method: 'POST', body: JSON.stringify({ name, requirement }) }),
  executeAgentRun: (id: string) =>
    request<{ run: any }>(`/api/agent/runs/${id}/execute`, { method: 'POST' }),
  deleteAgentRun: (id: string) =>
    request<{ success: boolean }>(`/api/agent/runs/${id}`, { method: 'DELETE' }),
};
