// KV-based storage adapter for EdgeOne Pages
// Falls back to in-memory store when KV is unavailable (dev mode)

let memoryStore = {};

function getKv(context) {
  return context?.env?.CODEPAGE_KV || null;
}

async function kvGet(context, key) {
  const kv = getKv(context);
  if (kv) {
    const val = await kv.get(key, 'json');
    return val;
  }
  return memoryStore[key] ?? null;
}

async function kvPut(context, key, value) {
  const kv = getKv(context);
  if (kv) {
    await kv.put(key, JSON.stringify(value));
  }
  memoryStore[key] = value;
}

async function kvDelete(context, key) {
  const kv = getKv(context);
  if (kv) {
    await kv.delete(key);
  }
  delete memoryStore[key];
}

async function kvList(context, prefix) {
  const kv = getKv(context);
  if (kv) {
    const list = await kv.list({ prefix });
    return list.keys;
  }
  return Object.keys(memoryStore)
    .filter(k => k.startsWith(prefix))
    .map(k => ({ name: k }));
}

// --- Collections ---

export async function getConfig(context) {
  return (await kvGet(context, 'config:llm')) || null;
}

export async function saveConfig(context, config) {
  await kvPut(context, 'config:llm', config);
}

export async function getProjects(context) {
  return (await kvGet(context, 'projects')) || [];
}

export async function setProjects(context, projects) {
  await kvPut(context, 'projects', projects);
}

export async function getProject(context, id) {
  return (await kvGet(context, `project:${id}`)) || null;
}

export async function setProject(context, id, project) {
  await kvPut(context, `project:${id}`, project);
}

export async function deleteProject(context, id) {
  await kvDelete(context, `project:${id}`);
}

export async function getHistory(context) {
  return (await kvGet(context, 'history')) || [];
}

export async function setHistory(context, items) {
  await kvPut(context, 'history', items);
}

export async function getAgentRuns(context) {
  return (await kvGet(context, 'agent:runs')) || [];
}

export async function setAgentRuns(context, runs) {
  await kvPut(context, 'agent:runs', runs);
}

export async function getAgentRun(context, id) {
  return (await kvGet(context, `agent:run:${id}`)) || null;
}

export async function setAgentRun(context, id, run) {
  await kvPut(context, `agent:run:${id}`, run);
}

export async function deleteAgentRun(context, id) {
  await kvDelete(context, `agent:run:${id}`);
}

// Helper to generate IDs
export function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}
