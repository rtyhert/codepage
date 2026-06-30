// Edge-compatible AI Agent Framework
// No Node.js deps — uses only fetch + basic JS

import { callLLM } from './llm.js';

const AGENTS = {
  planner: {
    name: 'planner',
    systemPrompt: `You are a senior software architect. Decompose the user's project requirement into concrete tasks.

Analyze the requirement and decide which task categories are needed:
- "schema" — Database schema (needed if the project stores persistent data)
- "backend" — Server API (needed for auth, CRUD, real-time features)
- "frontend" — UI components (always needed)
- "integrator" — Final integration (always last, depends on all others)

Rules:
1. Integrator task must be last, depending on ALL other tasks
2. Schema runs first (no dependencies)
3. Backend depends on schema
4. Frontend depends on backend/schema
5. Give each task a clear name and detailed input instructions

Return ONLY valid JSON, no extra text:
{"tasks":[
  {"id":"task-1","agentType":"schema","name":"Design Database","description":"Create data models","input":"Design the database schema...","dependsOn":[]},
  {"id":"task-2","agentType":"backend","name":"Build REST API","description":"Create API routes","input":"Build Express routes for...","dependsOn":["task-1"]},
  {"id":"task-3","agentType":"frontend","name":"Build UI","description":"Create React components","input":"Build the frontend with...","dependsOn":["task-2"]},
  {"id":"task-4","agentType":"integrator","name":"Integrate","description":"Combine all parts","input":"Integrate generated code...","dependsOn":["task-1","task-2","task-3"]}
]}`
  },

  schema: {
    name: 'schema',
    systemPrompt: `You are a database architect. Design a complete Prisma schema.

Given the project requirement, design models covering:
1. All entities with proper types (String, Int, Float, Boolean, DateTime, Json)
2. Primary keys with @id @default(cuid())
3. Relations with @relation and explicit foreign keys
4. Optional fields with "?", defaults with @default
5. Unique constraints with @unique
6. Enums for fixed value sets

Output the full schema wrapped in \`\`\`prisma code block. Include generator and datasource blocks.`
  },

  backend: {
    name: 'backend',
    systemPrompt: `You are a backend developer. Generate Express.js API routes with Prisma queries.

Create one route file per resource with full CRUD. Use:
- import { prisma } from '../index';
- Proper HTTP methods and status codes
- try/catch error handling
- Input validation
- TypeScript types

Format each file as:
## filename: src/routes/resource.ts
\`\`\`typescript
// code
\`\`\`

Include ONLY route files, not server bootstrap.`
  },

  frontend: {
    name: 'frontend',
    systemPrompt: `You are a frontend developer. Generate React + TypeScript components.

For each component:
1. Use React 18+ functional components with hooks
2. Use TypeScript interfaces for props/state
3. Use inline style objects for styling
4. Fetch from /api/* using fetch with loading/error states
5. Handle loading, empty, and error states

Format each file as:
## filename: src/components/Name.tsx
\`\`\`typescript
// code
\`\`\``
  },

  integrator: {
    name: 'integrator',
    systemPrompt: `You are a full-stack integration specialist. Review all generated code and produce a summary.

Check for:
1. API route paths matching frontend fetch calls
2. Prisma model names matching backend queries
3. Import path consistency
4. Missing pieces

Output:
## filename: README.md
\`\`\`markdown
# Project Summary
...
\`\`\`

## Integration Summary
\`\`\`
Summary text
\`\`\``
  }
};

function extractCodeBlock(text) {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

function parseArtifacts(output, agentType) {
  const artifacts = [];
  const fileRegex = /##\s*filename:\s*(.+?)\n```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = fileRegex.exec(output)) !== null) {
    const [, path, language, content] = match;
    const type = agentType === 'schema' ? 'schema'
      : agentType === 'backend' ? 'backend'
      : agentType === 'frontend' ? 'frontend'
      : 'config';
    artifacts.push({ type, path: path.trim(), content: content.trim(), language: language || 'text' });
  }
  return artifacts;
}

function buildContext(requirement, results, task) {
  const parts = [`Original requirement: ${requirement}`];
  parts.push(`Your task: ${task.name} — ${task.description}`);

  const completed = results.filter(r => r.status === 'completed');
  if (completed.length > 0) {
    parts.push('\n=== Completed work for context ===');
    for (const r of completed) {
      parts.push(`\n--- ${r.name} (${r.agentType}) ---`);
      if (r.artifacts?.length) {
        parts.push(`Generated ${r.artifacts.length} file(s): ${r.artifacts.map(a => a.path).join(', ')}`);
      }
      parts.push(r.output);
    }
  }
  return parts.join('\n');
}

async function runTaskWithRetry(task, config, context, retries = 1) {
  const agent = AGENTS[task.agentType];
  if (!agent) return { output: '', error: 'Unknown agent type' };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const input = attempt > 0
        ? `${task.input}\n\nNote: Previous attempt failed. Please output the required format correctly.`
        : task.input;
      const messages = [
        { role: 'system', content: agent.systemPrompt },
      ];
      if (context) {
        messages.push({ role: 'user', content: `Context from previous work:\n${context}` });
      }
      messages.push({ role: 'user', content: input });

      const output = await callLLM(config, messages);
      if (output?.trim()) return { output };
    } catch (e) {
      if (attempt < retries) continue;
      return { output: '', error: e.message || 'Unknown error' };
    }
  }
  return { output: '', error: 'Max retries exceeded' };
}

export async function createPlan(requirement, config) {
  const agent = AGENTS.planner;
  const messages = [
    { role: 'system', content: agent.systemPrompt },
    { role: 'user', content: requirement },
  ];
  const planRaw = await callLLM(config, messages);
  const planJson = extractCodeBlock(planRaw) || planRaw;
  try {
    const plan = JSON.parse(planJson);
    if (plan.tasks?.length) return plan;
  } catch {}
  return { tasks: [{ id: 'task-1', agentType: 'frontend', name: 'Generate Frontend', description: 'Build the UI', input: requirement, dependsOn: [] }] };
}

export async function executeAgentRun(requirement, config, onTaskUpdate) {
  // Phase 1: Plan
  const plan = await createPlan(requirement, config);

  // Save all plan tasks as "pending"
  for (const task of plan.tasks) {
    onTaskUpdate({ id: task.id, agentType: task.agentType, name: task.name, description: task.description, input: task.input, sortOrder: plan.tasks.indexOf(task), status: 'pending' });
  }

  // Phase 2: Execute tasks in dependency order
  const executed = new Set();
  const results = [];
  const allArtifacts = [];
  const taskMap = new Map(plan.tasks.map(t => [t.id, t]));

  let maxIter = 50;
  while (executed.size < plan.tasks.length && maxIter-- > 0) {
    const executable = plan.tasks.filter(t => {
      if (executed.has(t.id)) return false;
      return (t.dependsOn || []).every(d => executed.has(d));
    });
    if (executable.length === 0) break;

    for (const task of executable) {
      const context = buildContext(requirement, results, task);
      onTaskUpdate({ id: task.id, status: 'running' });

      const { output, error } = await runTaskWithRetry(task, config, context, 1);
      const artifacts = parseArtifacts(output, task.agentType);

      const result = {
        taskId: task.id, agentType: task.agentType, name: task.name,
        output, artifacts, status: error ? 'failed' : 'completed', error,
      };
      results.push(result);
      allArtifacts.push(...artifacts);
      executed.add(task.id);

      onTaskUpdate({ id: task.id, status: result.status, output, error, artifacts });
    }
  }

  // Phase 3: Integration
  const integrator = AGENTS.integrator;
  const summaryParts = [
    `Requirement: ${requirement}`,
    ...results.map(r => `=== ${r.name} (${r.agentType}) [${r.status}] ===\n${r.output || '(no output)'}`),
  ];
  let summary = '';
  try {
    const msgs = [
      { role: 'system', content: integrator.systemPrompt },
      { role: 'user', content: summaryParts.join('\n\n') },
    ];
    summary = await callLLM(config, msgs);
  } catch {
    summary = 'Integration completed. Review the generated artifacts.';
  }

  return { plan, results, artifacts: allArtifacts, summary };
}
