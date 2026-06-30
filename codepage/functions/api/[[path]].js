// EdgeOne Pages catch-all API handler
// All /api/* requests are routed here

import {
  getConfig, saveConfig, getProjects, setProjects,
  getProject, setProject, deleteProject,
  getHistory, setHistory,
  getAgentRuns, setAgentRuns, getAgentRun, setAgentRun, deleteAgentRun,
  generateId,
} from './_lib/store.js';
import { callLLM, listModels } from './_lib/llm.js';
import { executeAgentRun } from './_lib/agent.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(msg, status = 400) {
  return json({ error: msg }, status);
}

// --- Route dispatching ---

function matchPath(pattern, pathname) {
  // Convert pattern like /api/projects/:id/pages to regex
  const paramNames = [];
  const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const regex = new RegExp(`^${regexStr}$`);
  const m = pathname.match(regex);
  if (!m) return null;
  const params = {};
  paramNames.forEach((name, i) => { params[name] = m[i + 1]; });
  return params;
}

const ROUTES = [
  // Health
  { method: 'GET', pattern: '/api/health', handler: async () => json({ status: 'ok', version: '1.0.0-edge' }) },

  // Config
  { method: 'GET', pattern: '/api/config', handler: async (ctx) => {
    const cfg = await getConfig(ctx);
    const safe = cfg ? { ...cfg, key: cfg.key ? '***' : '' } : {};
    return json(safe || {});
  }},
  { method: 'POST', pattern: '/api/config', handler: async (ctx, _, body) => {
    const { url, key, model, authType, systemPrompt, temperature, maxTokens } = body;
    if (!url || !key || !model) return error('Missing required fields');
    await saveConfig(ctx, { url, key, model, authType: authType || 'Bearer', systemPrompt, temperature, maxTokens });
    return json({ success: true });
  }},

  // Test LLM connection
  { method: 'POST', pattern: '/api/test', handler: async (ctx, _, body) => {
    const { url, key, model, systemPrompt, auth } = body;
    if (!url || !key || !model) return error('Missing required fields');
    try {
      const content = await callLLM({ url, key, model, authType: auth || 'Bearer', systemPrompt }, [
        { role: 'system', content: systemPrompt || 'You are a frontend expert.' },
        { role: 'user', content: 'Generate a red button with text "Test Connection"' },
      ]);
      if (!content) throw new Error('Empty response');
      return json({ success: true });
    } catch (e) {
      return error(e.message, 500);
    }
  }},

  // Generate code
  { method: 'POST', pattern: '/api/generate', handler: async (ctx, _, body) => {
    const config = await getConfig(ctx);
    if (!config) return error('API not configured. Please configure in settings.', 400);
    const { prompt, format, tagHints } = body;
    if (!prompt) return error('Prompt is required');
    const FORMAT_PROMPTS = {
      html: 'You are a frontend expert. Generate a clean, runnable single HTML file with complete HTML+CSS+JS. Output only the code with no extra explanation.',
      react: 'You are a frontend expert. Generate a React component using JSX syntax with complete styles and logic. Use function components and Hooks. Output only the code with no extra explanation.',
      vue: 'You are a frontend expert. Generate a Vue 3 single-file component (.vue format) with template/script/style. Use Composition API. Output only the code with no extra explanation.',
    };
    const systemPrompt = FORMAT_PROMPTS[format] || FORMAT_PROMPTS.html;
    const enhanced = tagHints ? `${prompt}\n\nAdditional requirements: apply ${tagHints} style.` : prompt;
    try {
      const content = await callLLM(config, [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhanced },
      ]);
      if (!content) throw new Error('AI returned empty response');
      return json({ code: content });
    } catch (e) {
      return error(e.message, 500);
    }
  }},

  // List models
  { method: 'GET', pattern: '/api/models', handler: async (ctx) => {
    const config = await getConfig(ctx);
    if (!config) return error('API not configured');
    try {
      const models = await listModels(config);
      return json({ models });
    } catch (e) {
      return error(e.message, 500);
    }
  }},

  // Projects CRUD
  { method: 'GET', pattern: '/api/projects', handler: async (ctx) => {
    const projects = await getProjects(ctx);
    return json({ projects });
  }},
  { method: 'POST', pattern: '/api/projects', handler: async (ctx, _, body) => {
    if (!body.name) return error('Project name required');
    const projects = await getProjects(ctx);
    const project = { id: generateId(), name: body.name, prompt: body.prompt || '', pages: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    projects.unshift(project);
    await setProjects(ctx, projects);
    await setProject(ctx, project.id, project);
    return json({ project });
  }},
  { method: 'GET', pattern: '/api/projects/:id', handler: async (ctx, params) => {
    const project = await getProject(ctx, params.id);
    if (!project) return error('Project not found', 404);
    return json({ project });
  }},
  { method: 'PUT', pattern: '/api/projects/:id', handler: async (ctx, params, body) => {
    const project = await getProject(ctx, params.id);
    if (!project) return error('Project not found', 404);
    if (body.name) project.name = body.name;
    project.updatedAt = new Date().toISOString();
    await setProject(ctx, params.id, project);
    // Also update in projects list
    const projects = await getProjects(ctx);
    const idx = projects.findIndex(p => p.id === params.id);
    if (idx >= 0) { projects[idx] = project; await setProjects(ctx, projects); }
    return json({ project });
  }},
  { method: 'DELETE', pattern: '/api/projects/:id', handler: async (ctx, params) => {
    await deleteProject(ctx, params.id);
    const projects = await getProjects(ctx);
    await setProjects(ctx, projects.filter(p => p.id !== params.id));
    return json({ success: true });
  }},

  // Pages within a project
  { method: 'POST', pattern: '/api/projects/:id/pages', handler: async (ctx, params, body) => {
    const project = await getProject(ctx, params.id);
    if (!project) return error('Project not found', 404);
    const pages = project.pages || [];
    const page = {
      id: generateId(), projectId: params.id,
      name: body.name || `Page ${pages.length + 1}`,
      format: body.format || 'html', code: body.code || '',
      prompt: body.prompt || '', sortOrder: pages.length,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    pages.push(page);
    project.pages = pages;
    project.updatedAt = new Date().toISOString();
    await setProject(ctx, params.id, project);
    return json({ page });
  }},

  // Update page
  { method: 'PUT', pattern: '/api/pages/:id', handler: async (ctx, params, body) => {
    // Find the project containing this page
    const projects = await getProjects(ctx);
    for (const p of projects) {
      const full = await getProject(ctx, p.id);
      if (!full) continue;
      const pgIdx = (full.pages || []).findIndex(pg => pg.id === params.id);
      if (pgIdx >= 0) {
        if (body.name) full.pages[pgIdx].name = body.name;
        if (body.code !== undefined) full.pages[pgIdx].code = body.code;
        if (body.format) full.pages[pgIdx].format = body.format;
        if (body.prompt !== undefined) full.pages[pgIdx].prompt = body.prompt;
        full.pages[pgIdx].updatedAt = new Date().toISOString();
        full.updatedAt = new Date().toISOString();
        await setProject(ctx, p.id, full);
        return json({ page: full.pages[pgIdx] });
      }
    }
    return error('Page not found', 404);
  }},

  // Delete page
  { method: 'DELETE', pattern: '/api/pages/:id', handler: async (ctx, params) => {
    const projects = await getProjects(ctx);
    for (const p of projects) {
      const full = await getProject(ctx, p.id);
      if (!full) continue;
      const before = (full.pages || []).length;
      full.pages = (full.pages || []).filter(pg => pg.id !== params.id);
      if (full.pages.length !== before) {
        full.updatedAt = new Date().toISOString();
        await setProject(ctx, p.id, full);
        return json({ success: true });
      }
    }
    return error('Page not found', 404);
  }},

  // Reorder pages
  { method: 'PATCH', pattern: '/api/pages/reorder', handler: async (ctx, _, body) => {
    const { orders } = body;
    if (!orders) return error('orders required');
    const projects = await getProjects(ctx);
    for (const p of projects) {
      const full = await getProject(ctx, p.id);
      if (!full) continue;
      let changed = false;
      for (const order of orders) {
        const pg = (full.pages || []).find(pg => pg.id === order.id);
        if (pg) { pg.sortOrder = order.sortOrder; changed = true; }
      }
      if (changed) { full.updatedAt = new Date().toISOString(); await setProject(ctx, p.id, full); }
    }
    return json({ success: true });
  }},

  // History
  { method: 'GET', pattern: '/api/history', handler: async (ctx, params, _, url) => {
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200'), 200);
    const items = await getHistory(ctx);
    return json({ items: items.slice(0, limit), max: 200 });
  }},
  { method: 'POST', pattern: '/api/history', handler: async (ctx, _, body) => {
    const items = await getHistory(ctx);
    items.unshift({
      id: generateId(), prompt: body.prompt || '', code: body.code || '',
      format: body.format || 'html', tagHints: body.tagHints || '',
      createdAt: new Date().toISOString(),
    });
    const MAX = 200;
    const trimmed = items.slice(0, MAX);
    await setHistory(ctx, trimmed);
    return json({ success: true });
  }},
  { method: 'DELETE', pattern: '/api/history', handler: async (ctx) => {
    await setHistory(ctx, []);
    return json({ success: true });
  }},

  // Agent runs
  { method: 'GET', pattern: '/api/agent/runs', handler: async (ctx) => {
    const runs = await getAgentRuns(ctx);
    return json({ runs });
  }},
  { method: 'POST', pattern: '/api/agent/runs', handler: async (ctx, _, body) => {
    if (!body.requirement) return error('Requirement is required');
    const runs = await getAgentRuns(ctx);
    const run = {
      id: generateId(), name: body.name || body.requirement.slice(0, 60),
      requirement: body.requirement, status: 'pending',
      projectId: '', tasks: [], result: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    runs.unshift(run);
    await setAgentRuns(ctx, runs);
    await setAgentRun(ctx, run.id, run);
    return json({ run: { ...run, tasks: [] } });
  }},

  // Get single agent run
  { method: 'GET', pattern: '/api/agent/runs/:id', handler: async (ctx, params) => {
    const run = await getAgentRun(ctx, params.id);
    if (!run) return error('Run not found', 404);
    return json({ run });
  }},

  // Delete agent run
  { method: 'DELETE', pattern: '/api/agent/runs/:id', handler: async (ctx, params) => {
    await deleteAgentRun(ctx, params.id);
    const runs = await getAgentRuns(ctx);
    await setAgentRuns(ctx, runs.filter(r => r.id !== params.id));
    return json({ success: true });
  }},

  // Execute agent run (non-blocking — starts background and returns)
  { method: 'POST', pattern: '/api/agent/runs/:id/execute', handler: async (ctx, params) => {
    const config = await getConfig(ctx);
    if (!config) return error('API not configured');

    let run = await getAgentRun(ctx, params.id);
    if (!run) return error('Run not found', 404);
    if (run.status === 'executing') return error('Run is already executing');

    run.status = 'executing';
    run.updatedAt = new Date().toISOString();
    await setAgentRun(ctx, params.id, run);

    // Start background execution (fire and forget)
    executeRunInBackground(ctx, params.id, run.requirement, config).catch(e => console.error('Background exec error:', e));

    return json({ run });
  }},
];

async function executeRunInBackground(ctx, runId, requirement, config) {
  const updateRun = async (updates) => {
    const existing = await getAgentRun(ctx, runId);
    if (!existing) return;
    Object.assign(existing, updates);
    existing.updatedAt = new Date().toISOString();
    await setAgentRun(ctx, runId, existing);
  };

  try {
    const result = await executeAgentRun(requirement, config, async (taskUpdate) => {
      const run = await getAgentRun(ctx, runId);
      if (!run) return;
      const tasks = run.tasks || [];
      const idx = tasks.findIndex(t => t.id === taskUpdate.id);

      if (taskUpdate.description) {
        // This is a new task definition from the plan
        if (idx < 0) {
          tasks.push({
            id: taskUpdate.id, agentType: taskUpdate.agentType, name: taskUpdate.name,
            description: taskUpdate.description, input: taskUpdate.input || '',
            status: taskUpdate.status, output: '', error: '', sortOrder: taskUpdate.sortOrder || 0,
          });
        }
      } else if (idx >= 0) {
        tasks[idx].status = taskUpdate.status;
        if (taskUpdate.output !== undefined) tasks[idx].output = taskUpdate.output;
        if (taskUpdate.error !== undefined) tasks[idx].error = taskUpdate.error;
      }
      run.tasks = tasks;
      await setAgentRun(ctx, runId, run);
    });

    await updateRun({
      status: 'completed',
      result: JSON.stringify({ summary: result.summary, artifacts: result.artifacts }),
    });
  } catch (e) {
    await updateRun({
      status: 'failed',
      result: JSON.stringify({ error: e.message }),
    });
  }
}

// --- Main entry point ---

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Parse request body for POST/PUT/PATCH
  let body = null;
  const ct = request.headers.get('Content-Type') || '';
  if (ct.includes('application/json')) {
    try { body = await request.json(); } catch {}
  }

  // Find matching route
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const params = matchPath(route.pattern, path);
    if (params !== null) {
      try {
        return await route.handler(context, params, body, url);
      } catch (e) {
        return error(e.message || 'Internal error', 500);
      }
    }
  }

  return error('Not found', 404);
}
