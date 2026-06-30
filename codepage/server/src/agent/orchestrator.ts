import { randomUUID } from 'crypto';
import { PlannerAgent } from './planner';
import { SchemaAgent } from './schema';
import { BackendAgent } from './backend';
import { FrontendAgent } from './frontend';
import { IntegratorAgent } from './integrator';
import { extractCodeBlock } from './utils';
import { log } from '../utils/logger';
import type { LLMConfig } from '../utils/llm';
import type {
  AgentType, TaskDefinition, TaskPlan, TaskResult,
  ProjectArtifact, AgentResult, TaskUpdate,
} from './types';

const MAX_RETRIES = 1;

export class OrchestratorAgent {
  private planner = new PlannerAgent();
  private schema = new SchemaAgent();
  private backend = new BackendAgent();
  private frontend = new FrontendAgent();
  private integrator = new IntegratorAgent();

  private getAgent(type: AgentType) {
    const map: Record<AgentType, any> = {
      planner: this.planner,
      schema: this.schema,
      backend: this.backend,
      frontend: this.frontend,
      integrator: this.integrator,
    };
    return map[type];
  }

  async execute(
    requirement: string,
    config: LLMConfig,
    onTaskUpdate?: (task: TaskUpdate) => void,
  ): Promise<AgentResult> {
    log.info('agent', `Starting orchestration for: "${requirement.slice(0, 80)}..."`);
    const plan = await this.createPlan(requirement, config);
    log.info('agent', `Plan created with ${plan.tasks.length} tasks`);
    let { results, allArtifacts } = await this.runTasks(plan, requirement, config, onTaskUpdate);
    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    log.info('agent', `Execution complete: ${completed} succeeded, ${failed} failed, ${allArtifacts.length} files generated`);

    // Self-healing loop: lint and fix generated artifacts
    const healed = await this.selfHeal(requirement, results, allArtifacts, config, onTaskUpdate);
    if (healed) {
      log.info('agent', `Self-heal updated artifacts, re-running summary`);
      results = healed.results;
      allArtifacts = healed.artifacts;
    }

    // Generate docker-compose-dev.yml for full-stack projects
    const compose = this.generateDevCompose(allArtifacts, requirement);
    if (compose) {
      allArtifacts.push(compose);
      log.info('agent', `Generated docker-compose-dev.yml for project startup`);
    }

    const summary = await this.createSummary(requirement, results, config);
    return { plan, results, artifacts: allArtifacts, summary };
  }

  private remapTaskIds(plan: TaskPlan): TaskPlan {
    const idMap = new Map<string, string>();
    for (const task of plan.tasks) {
      idMap.set(task.id, `task-${randomUUID().slice(0, 8)}`);
    }
    return {
      tasks: plan.tasks.map((t) => ({
        ...t,
        id: idMap.get(t.id)!,
        dependsOn: t.dependsOn.map((d) => idMap.get(d) || d),
      })),
    };
  }

  private async createPlan(
    requirement: string, config: LLMConfig,
  ): Promise<TaskPlan> {
    const planRaw = await this.planner.run(config, requirement);
    const planJson = extractCodeBlock(planRaw) || planRaw;
    try {
      const plan: TaskPlan = JSON.parse(planJson);
      if (plan.tasks?.length) return this.remapTaskIds(plan);
    } catch (error) {
      log.error('agent', `Failed to parse plan JSON: ${error instanceof Error ? error.message : 'Unknown error'}, raw: ${planRaw.slice(0, 200)}...`);
    }
    const fallbackId = `task-${randomUUID().slice(0, 8)}`;
    return { tasks: [{ id: fallbackId, agentType: 'frontend', name: 'Generate Frontend', description: 'Build the UI', input: requirement, dependsOn: [] }] };
  }

  private buildContext(requirement: string, completed: TaskResult[], task: TaskDefinition): string {
    const parts: string[] = [`Original requirement: ${requirement}`];
    parts.push(`Your task: ${task.name} — ${task.description}`);

    const completedOutputs = completed.filter((r) => r.status === 'completed');
    if (completedOutputs.length > 0) {
      parts.push('\n=== Completed work for context ===');
      for (const r of completedOutputs) {
        parts.push(`\n--- ${r.name} (${r.agentType}) ---`);
        if (r.artifacts.length > 0) {
          parts.push(`Generated ${r.artifacts.length} file(s): ${r.artifacts.map((a) => a.path).join(', ')}`);
        }
        parts.push(r.output);
      }
    }

    return parts.join('\n');
  }

  private async runTaskWithRetry(
    task: TaskDefinition, agent: any, config: LLMConfig, context: string, retries: number,
  ): Promise<{ output: string; error?: string }> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const input = attempt > 0
          ? `${task.input}\n\nNote: Previous attempt failed. Please ensure your output follows the required format and addresses the requirement completely.`
          : task.input;
        const output = await agent.run(config, input, context);
        if (output?.trim()) return { output };
      } catch (e: any) {
        if (attempt < retries) continue;
        return { output: '', error: e.message || 'Unknown error' };
      }
    }
    return { output: '', error: 'Max retries exceeded' };
  }

  private async runTasks(
    plan: TaskPlan, requirement: string, config: LLMConfig,
    onTaskUpdate?: (task: TaskUpdate) => void,
  ): Promise<{ results: TaskResult[]; allArtifacts: ProjectArtifact[] }> {
    const executed = new Set<string>();
    const results: TaskResult[] = [];
    const allArtifacts: ProjectArtifact[] = [];

    let maxIter = 50;
    while (executed.size < plan.tasks.length && maxIter-- > 0) {
      const executable = plan.tasks.filter((t) => {
        if (executed.has(t.id)) return false;
        return t.dependsOn.every((d) => executed.has(d));
      });
      if (executable.length === 0) break;

      for (const task of executable) {
        const agent = this.getAgent(task.agentType);
        if (!agent) { executed.add(task.id); continue; }

        const context = this.buildContext(requirement, results, task);
        log.info('agent', `  → Running: ${task.name} (${task.agentType})`);
        onTaskUpdate?.({
          id: task.id, agentType: task.agentType, name: task.name,
          description: task.description, input: task.input,
          dependsOn: task.dependsOn, status: 'running',
        });

        const { output, error } = await this.runTaskWithRetry(task, agent, config, context, MAX_RETRIES);
        const artifacts = this.parseArtifacts(output, task.agentType);

        if (error) log.error('agent', `  ✗ Failed: ${task.name} — ${error}`);
        else log.info('agent', `  ✓ Completed: ${task.name} (${artifacts.length} files)`);

        const result: TaskResult = {
          taskId: task.id, agentType: task.agentType, name: task.name,
          output, artifacts,
          status: error ? 'failed' : 'completed',
          error,
        };
        results.push(result);
        allArtifacts.push(...artifacts);
        executed.add(task.id);

        onTaskUpdate?.({ id: task.id, agentType: task.agentType, name: task.name, status: result.status, output, error });
      }
    }
    return { results, allArtifacts };
  }

  private async createSummary(requirement: string, results: TaskResult[], config: LLMConfig): Promise<string> {
    const context = [
      `Requirement: ${requirement}`,
      ...results.map((r) => `=== ${r.name} (${r.agentType}) [${r.status}] ===\n${r.output || '(no output)'}`),
    ].join('\n\n');
    try {
      return await this.integrator.run(config, context);
    } catch {
      return 'Integration completed. Review the generated artifacts above.';
    }
  }

  private lintArtifact(artifact: ProjectArtifact): string[] {
    const issues: string[] = [];
    const content = artifact.content;

    if (!content || !content.trim()) {
      issues.push(`${artifact.path}: File is empty`);
      return issues;
    }

    if (artifact.path.endsWith('.html') || artifact.language === 'html') {
      const selfClosing = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
      const stack: string[] = [];
      const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*\/?>/g;
      let match: RegExpExecArray | null;
      while ((match = tagRegex.exec(content)) !== null) {
        const full = match[0];
        const tagName = match[1].toLowerCase();
        if (full.startsWith('</')) {
          if (stack.length && stack[stack.length - 1] === tagName) stack.pop();
        } else if (!full.endsWith('/>') && !selfClosing.has(tagName)) {
          stack.push(tagName);
        }
      }
      if (stack.length) {
        issues.push(`${artifact.path}: Unclosed HTML tags — ${stack.join(', ')}`);
      }
    }

    if (artifact.path.endsWith('.css') || artifact.language === 'css') {
      const openC = (content.match(/\{/g) || []).length;
      const closeC = (content.match(/\}/g) || []).length;
      if (openC !== closeC) {
        issues.push(`${artifact.path}: Mismatched CSS braces (${openC} open vs ${closeC} close)`);
      }
    }

    if (artifact.path.endsWith('.js') || artifact.language === 'javascript' || artifact.language === 'typescript') {
      const openB = (content.match(/\{/g) || []).length;
      const closeB = (content.match(/\}/g) || []).length;
      const openP = (content.match(/\(/g) || []).length;
      const closeP = (content.match(/\)/g) || []).length;
      if (openB !== closeB) {
        issues.push(`${artifact.path}: Mismatched braces (${openB} { vs ${closeB} })`);
      }
      if (openP !== closeP) {
        issues.push(`${artifact.path}: Mismatched parentheses (${openP} ( vs ${closeP} ))`);
      }
    }

    return issues;
  }

  private async selfHeal(
    requirement: string,
    results: TaskResult[],
    artifacts: ProjectArtifact[],
    config: LLMConfig,
    onTaskUpdate?: (task: TaskUpdate) => void,
  ): Promise<{ results: TaskResult[]; artifacts: ProjectArtifact[] } | null> {
    const allIssues: string[] = [];
    for (const artifact of artifacts) {
      allIssues.push(...this.lintArtifact(artifact));
    }

    if (allIssues.length === 0) {
      log.info('agent', 'Self-heal: no issues found');
      return null;
    }

    log.warn('agent', `Self-heal: ${allIssues.length} issue(s) found, attempting fix...`);

    onTaskUpdate?.({
      id: `heal-${randomUUID().slice(0, 8)}`,
      agentType: 'integrator',
      name: 'Self-Healing',
      description: `Fixing ${allIssues.length} lint issue(s)`,
      status: 'running',
    });

    const fileList = artifacts.map((a) =>
      `## filename: ${a.path}\n\`\`\`${a.language}\n${a.content}\n\`\`\``
    ).join('\n\n');

    const fixPrompt = `The following generated code files have lint issues. Fix all issues and output the complete corrected code.

Issues to fix:
${allIssues.map((i) => `- ${i}`).join('\n')}

Generate FIXED code using the exact same ## filename: format:
${fileList}

Fix ALL issues listed above. Output ONLY the corrected files.`;

    try {
      const fixedOutput = await this.integrator.run(config, fixPrompt);
      if (!fixedOutput?.trim()) return null;

      const fixedArtifacts = this.parseArtifacts(fixedOutput, 'frontend');
      if (fixedArtifacts.length === 0) return null;

      const pathMap = new Map<string, ProjectArtifact>();
      for (const fa of fixedArtifacts) pathMap.set(fa.path, fa);

      for (const result of results) {
        if (result.status !== 'completed') continue;
        const fixedLines: string[] = [];
        for (const artifact of result.artifacts) {
          const fixed = pathMap.get(artifact.path);
          if (fixed) {
            artifact.content = fixed.content;
            artifact.language = fixed.language;
            fixedLines.push(`## filename: ${fixed.path}\n\`\`\`${fixed.language}\n${fixed.content}\n\`\`\``);
          }
        }
        if (fixedLines.length > 0) {
          result.output += '\n\n[Self-healed issues]\n' + fixedLines.join('\n\n');
        }
      }

      artifacts = fixedArtifacts;

      onTaskUpdate?.({
        id: `heal-${randomUUID().slice(0, 8)}`,
        agentType: 'integrator',
        name: 'Self-Healing',
        description: `Fixed ${allIssues.length} lint issue(s)`,
        status: 'completed',
      });

      log.info('agent', `Self-heal: fixed ${allIssues.length} issue(s)`);
      return { results, artifacts };
    } catch (e: any) {
      log.error('agent', `Self-heal failed: ${e.message}`);
      return null;
    }
  }

  private generateDevCompose(artifacts: ProjectArtifact[], requirement: string): ProjectArtifact | null {
    const hasBackend = artifacts.some((a) => a.type === 'backend' || a.type === 'schema');
    const hasFrontend = artifacts.some((a) => a.type === 'frontend');
    if (!hasBackend && !hasFrontend) return null;

    const projectName = requirement
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30)
      .toLowerCase()
      .replace(/[^a-zA-Z0-9-]/g, '') || 'codepage-project';

    const services: string[] = [];

    if (hasBackend) {
      services.push(`  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./data/dev.db
    volumes:
      - ./backend:/app
      - /app/node_modules
      - backend-data:/app/prisma/data
    command: npx tsx watch src/index.ts`);
    }

    if (hasFrontend) {
      services.push(`  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
    depends_on:
      - backend
    command: npm run dev`);
    }

    services.push(`  # database:
    #   image: postgres:16-alpine
    #   environment:
    #     POSTGRES_DB: ${projectName}
    #     POSTGRES_PASSWORD: devpassword
    #   ports:
    #     - "5432:5432"
    #   volumes:
    #     - pgdata:/var/lib/postgresql/data`);

    const content = `# docker-compose-dev.yml — Generated by CodePage Agent
# Start the full project with:
#   docker compose -f docker-compose-dev.yml up -d
#
# Project: ${requirement.slice(0, 80)}
# This is a starting template — adjust paths and configs as needed.

version: "3.8"

${services.join('\n')}

volumes:
  backend-data:
  # pgdata:
`;

    return {
      type: 'config',
      path: 'docker-compose-dev.yml',
      content: content.trim(),
      language: 'yaml',
    };
  }

  private parseArtifacts(output: string, agentType: AgentType): ProjectArtifact[] {
    const artifacts: ProjectArtifact[] = [];
    const fileRegex = /##\s*filename:\s*(.+?)\n```(\w*)\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;

    while ((match = fileRegex.exec(output)) !== null) {
      const [, path, language, content] = match;
      const type = agentType === 'schema' ? 'schema'
        : agentType === 'backend' ? 'backend'
        : agentType === 'frontend' ? 'frontend'
        : 'config';
      artifacts.push({ type: type as any, path: path.trim(), content: content.trim(), language: language || 'text' });
    }
    return artifacts;
  }
}
