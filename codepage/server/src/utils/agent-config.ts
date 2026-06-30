import fs from 'fs';
import path from 'path';
import { normalizeUrl } from './llm';
import type { LLMConfig } from './llm';

const CONFIG_PATH = path.join(__dirname, '..', '..', 'prisma', 'data', 'llm-config.json');

export { CONFIG_PATH };

let cachedConfig: LLMConfig | null = null;

export interface EnvDefaults {
  url: string;
  key: string;
  model: string;
  authType: string;
}

export function getEnvDefaults(): EnvDefaults {
  return {
    url: process.env.LLM_BASE_URL || '',
    key: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || '',
    authType: 'Bearer',
  };
}

function hasValidKey(config: LLMConfig): boolean {
  return !!(config.key && config.key !== 'sk-your-api-key-here');
}

function isPlaceholderKey(key: string): boolean {
  return !key || key === 'sk-your-api-key-here';
}

export function loadAgentConfig(): LLMConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      if (hasValidKey(saved)) {
        cachedConfig = saved;
        return cachedConfig;
      }
    }
  } catch (e) {
    console.error('Error loading agent config:', e);
  }
  const env = getEnvDefaults();
  if (env.url && env.key && env.model && !isPlaceholderKey(env.key)) {
    const fromEnv: LLMConfig = {
      url: normalizeUrl(env.url),
      key: env.key,
      model: env.model,
      authType: env.authType,
    };
    if (fs.existsSync(path.dirname(CONFIG_PATH))) {
      saveAgentConfig(fromEnv);
    }
    cachedConfig = fromEnv;
    return cachedConfig;
  }
  cachedConfig = null;
  return null;
}

export function saveAgentConfig(config: LLMConfig): void {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  cachedConfig = config;
}

export function getCachedConfig(): LLMConfig | null {
  return cachedConfig;
}
