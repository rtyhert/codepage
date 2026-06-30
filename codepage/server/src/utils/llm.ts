import { log } from './logger';

export interface LLMConfig {
  url: string;
  key: string;
  model: string;
  authType: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export const FORMAT_PROMPTS: Record<string, string> = {
  html: 'You are a frontend expert. Generate a clean, runnable single HTML file with complete HTML+CSS+JS. Output only the code with no extra explanation.',
  react: 'You are a frontend expert. Generate a React component using JSX syntax with complete styles and logic. Use function components and Hooks. Output only the code with no extra explanation.',
  vue: 'You are a frontend expert. Generate a Vue 3 single-file component (.vue format) with template/script/style. Use Composition API. Output only the code with no extra explanation.',
};

export function normalizeUrl(base: string): string {
  const clean = base.replace(/\/+$/, '');
  if (clean.includes('/chat/completions')) return clean;
  if (/\/v\d+$/.test(clean)) return `${clean}/chat/completions`;
  return `${clean}/v1/chat/completions`;
}

export function extractError(data: any, status: number): string {
  const parts: string[] = [`HTTP ${status}`];
  const msg = data?.error?.message || data?.error?.msg || data?.message || data?.err_msg || '';
  if (msg) parts.push(msg);
  const raw = JSON.stringify(data).slice(0, 300);
  if (raw !== '{}') parts.push(`Response: ${raw}`);
  return parts.join(' — ');
}

export function buildAuthHeaders(config: LLMConfig, skipContentType?: boolean): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!skipContentType) headers['Content-Type'] = 'application/json';
  const auth = config.authType || 'Bearer';
  if (auth === 'Bearer') headers['Authorization'] = `Bearer ${config.key}`;
  else if (auth === 'x-api-key') headers['x-api-key'] = config.key;
  else if (auth === 'api-key') headers['api-key'] = config.key;
  else if (auth === 'custom-header') {
    const colon = config.key.indexOf(':');
    if (colon > 0) {
      headers[config.key.slice(0, colon).trim()] = config.key.slice(colon + 1).trim();
    }
  }
  return headers;
}

export async function callLLM(
  config: LLMConfig,
  messages: { role: string; content: string }[],
  jsonSchema?: Record<string, unknown> | null,
) {
  const lastMsg = messages[messages.length - 1]?.content.slice(0, 60) || '';
  log.debug('llm', `Request to ${config.model}: "${lastMsg}..."`);
  const start = Date.now();

  const isOpenAIResponses = config.url.includes('responses') || !!jsonSchema;
  let body: string;

  if (isOpenAIResponses && jsonSchema) {
    body = JSON.stringify({
      model: config.model,
      input: messages,
      text: {
        format: { type: 'json_schema', json_schema: jsonSchema },
      },
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
    });
  } else {
    body = JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 4096,
    });
  }

  const resp = await fetch(config.url, {
    method: 'POST',
    headers: buildAuthHeaders(config),
    body,
  });
  const data: any = await resp.json();
  const elapsed = Date.now() - start;
  if (!resp.ok) {
    const msg = extractError(data, resp.status);
    log.error('llm', `Error after ${elapsed}ms: ${msg}`);
    throw new Error(msg);
  }
  const content = (isOpenAIResponses && jsonSchema)
    ? data.output?.[0]?.content || ''
    : data.choices?.[0]?.message?.content || '';
  const contentLen = content.length || 0;
  log.info('llm', `Response from ${config.model} in ${elapsed}ms (${contentLen} chars)`);
  return content;
}

export async function listModels(config: LLMConfig): Promise<string[]> {
  const clean = config.url.replace(/\/+$/, '');
  const paths = [
    clean.replace(/\/chat\/completions$/, '/models').replace(/\/v1\/chat\/completions$/, '/v1/models'),
    clean.replace(/\/chat\/completions$/, '/v1/models'),
    clean + '/models',
  ];
  for (const url of [...new Set(paths)]) {
    try {
      const resp = await fetch(url, { headers: buildAuthHeaders(config, true) });
      if (!resp.ok) continue;
      const data: any = await resp.json();
      const models = (data.data || []).map((m: any) => m.id).filter(Boolean);
      if (models.length) return models;
    } catch { continue; }
  }
  throw new Error('No models endpoint found');
}
