import type { LLMConfig } from '../utils/llm';

export type AgentType = 'planner' | 'frontend' | 'backend' | 'schema' | 'integrator';

export interface AgentContext {
  runId: string;
  requirement: string;
  config: LLMConfig;
  tasks: TaskResult[];
  artifacts: ProjectArtifact[];
}

export interface TaskDefinition {
  id: string;
  agentType: AgentType;
  name: string;
  description: string;
  input: string;
  dependsOn: string[];
}

export interface TaskPlan {
  tasks: TaskDefinition[];
}

export interface TaskResult {
  taskId: string;
  agentType: AgentType;
  name: string;
  output: string;
  artifacts: ProjectArtifact[];
  status: 'completed' | 'failed';
  error?: string;
}

export interface ProjectArtifact {
  type: 'frontend' | 'backend' | 'schema' | 'config';
  path: string;
  content: string;
  language: string;
}

export interface AgentResult {
  plan: TaskPlan;
  results: TaskResult[];
  artifacts: ProjectArtifact[];
  summary: string;
}

export interface TaskUpdate {
  id: string;
  agentType: AgentType;
  name: string;
  status: string;
  description?: string;
  input?: string;
  dependsOn?: string[];
  output?: string;
  error?: string;
}

export interface AgentRunResponse {
  id: string;
  name: string;
  requirement: string;
  status: string;
  tasks: {
    id: string;
    agentType: string;
    name: string;
    description: string;
    status: string;
    input?: string;
    output?: string;
    error?: string;
    sortOrder: number;
  }[];
  result?: string;
  createdAt: string;
  updatedAt: string;
}
