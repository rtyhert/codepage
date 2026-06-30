import { Router } from 'express';
import { callLLM, listModels, FORMAT_PROMPTS, type LLMConfig } from '../utils/llm';
import { loadAgentConfig, saveAgentConfig, getCachedConfig, getEnvDefaults, CONFIG_PATH } from '../utils/agent-config';

export { CONFIG_PATH };
export const llmRouter = Router();

// Load config on module init to warm the cache
loadAgentConfig();

function getConfig(): LLMConfig | null {
  return getCachedConfig() || loadAgentConfig();
}

function safeConfig(cfg: LLMConfig | null) {
  if (!cfg) return null;
  return { ...cfg, key: cfg.key ? '***' : '' };
}

llmRouter.get('/config', (_req, res) => {
  const cfg = getConfig();
  const env = getEnvDefaults();
  res.json({
    ...safeConfig(cfg),
    envDefaults: {
      url: env.url || '',
      key: env.key && env.key !== 'sk-your-api-key-here' ? '***' : '',
      model: env.model || '',
      authType: env.authType,
    },
  });
});

llmRouter.post('/config', (req, res) => {
  const { url, key, model, authType, systemPrompt, temperature, maxTokens } = req.body;
  if (!url || !model) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if ((authType || 'Bearer') !== 'None' && !key) {
    return res.status(400).json({ error: 'API Key is required for this auth type' });
  }
  const config: LLMConfig = { url, key, model, authType: authType || 'Bearer', systemPrompt, temperature, maxTokens };
  saveAgentConfig(config);
  res.json({ success: true });
});

llmRouter.post('/test', async (req, res) => {
  const { url, key, model, systemPrompt, auth } = req.body;
  if (!url || !model) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if ((auth || 'Bearer') !== 'None' && !key) {
    return res.status(400).json({ error: 'API Key is required for this auth type' });
  }
  const config: LLMConfig = { url, key, model, authType: auth || 'Bearer', systemPrompt };
  try {
    const content = await callLLM(config, [
      { role: 'system', content: systemPrompt || 'You are a frontend expert.' },
      { role: 'user', content: 'Generate a red button with text "Test Connection"' },
    ]);
    if (!content) throw new Error('Empty response');
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

llmRouter.post('/generate', async (req, res) => {
  const config = getConfig();
  if (!config) {
    return res.status(400).json({ error: 'API not configured. Please configure in settings.' });
  }
  const { prompt, format, tagHints } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  const systemPrompt = FORMAT_PROMPTS[format] || FORMAT_PROMPTS.html;
  const enhanced = tagHints ? `${prompt}\n\nAdditional requirements: apply ${tagHints} style.` : prompt;
  try {
    const content = await callLLM(config, [
      { role: 'system', content: config.systemPrompt || systemPrompt },
      { role: 'user', content: enhanced },
    ]);
    if (!content) throw new Error('AI returned empty response');
    res.json({ code: content });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

llmRouter.get('/models', async (_req, res) => {
  const config = getConfig();
  if (!config) {
    return res.status(400).json({ error: 'API not configured' });
  }
  try {
    const models = await listModels(config);
    res.json({ models });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
