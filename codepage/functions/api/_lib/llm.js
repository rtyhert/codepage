// Edge-compatible LLM client (uses fetch, no Node.js deps)
// Supports OpenAI Responses API structured outputs (2024년 8월 출시)

export function buildAuthHeaders(config, skipContentType) {
  const headers = {};
  if (!skipContentType) headers['Content-Type'] = 'application/json';
  const auth = config.authType || 'Bearer';
  if (auth === 'Bearer') headers['Authorization'] = `Bearer ${config.key}`;
  else if (auth === 'x-api-key') headers['x-api-key'] = config.key;
  else if (auth === 'api-key') headers['api-key'] = config.key;
  return headers;
}

export async function callLLM(config, messages, useStructuredOutput = false, jsonSchema = null) {
  // Determine if this is OpenAI Responses API (structured outputs hỗ trợ)
  const isOpenAIResponses = config.url.includes('responses/api') || useStructuredOutput;
  
  if (isOpenAIResponses && jsonSchema) {
    // OpenAI Responses API with structured outputs (2024년 8월 출시된 기능)
    const resp = await fetch(config.url, {
      method: 'POST',
      headers: buildAuthHeaders(config),
      body: JSON.stringify({
        model: config.model,
        input: messages,
        text: {
          format: {
            type: 'json_schema',
            json_schema: jsonSchema
          }
        },
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4096,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);
    // Responses API는 structured output을 JSON으로 제공
    return data.output?.[0]?.content || '';
  } else {
    // 기존 Chat Completions API 호환
    const resp = await fetch(config.url, {
      method: 'POST',
      headers: buildAuthHeaders(config),
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 4096,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || `HTTP ${resp.status}`);
    return data.choices?.[0]?.message?.content || '';
  }
}

export async function listModels(config) {
  const clean = config.url.replace(/\/+\$/, '');
  const modelsUrl = clean
    .replace(/\/chat\/completions$/, '/models')
    .replace(/\/v1\/chat\/completions$/, '/v1/models');
  const resp = await fetch(modelsUrl, { headers: buildAuthHeaders(config, true) });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return (data.data || []).map(m => m.id).filter(Boolean);
}
