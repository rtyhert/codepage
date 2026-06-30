export interface LLMConfig {
  url: string;
  key: string;
  model: string;
  authType: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface EnvDefaults {
  url: string;
  key: string;
  model: string;
  authType: string;
}

export interface ConfigResponse extends LLMConfig {
  envDefaults: EnvDefaults;
}

export interface Project {
  id: string;
  name: string;
  prompt: string;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
  _count?: { pages: number };
}

export interface Page {
  id: string;
  projectId: string;
  name: string;
  format: string;
  code: string;
  prompt: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryItem {
  id: string;
  prompt: string;
  code: string;
  format: string;
  tagHints?: string;
  createdAt: string;
}

export type OutputFormat = 'html' | 'react' | 'vue';

export interface UserPreferences {
  theme: 'dark' | 'light';
  defaultFormat: OutputFormat;
  defaultViewMode: 'desktop' | 'mobile';
  defaultTab: 'code' | 'editor';
}

export interface TemplateItem {
  name: string;
  prompt: string;
}

// Agent types
export type AgentType = 'planner' | 'frontend' | 'backend' | 'schema' | 'integrator';

export interface AgentTask {
  id: string;
  agentRunId: string;
  agentType: string;
  name: string;
  description: string;
  input?: string;
  output?: string;
  status: string;
  error?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentRun {
  id: string;
  name: string;
  requirement: string;
  status: string;
  projectId?: string;
  tasks: AgentTask[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}
