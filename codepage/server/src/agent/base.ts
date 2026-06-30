import { callLLM } from '../utils/llm';
import type { LLMConfig } from '../utils/llm';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract systemPrompt: string;

  async run(config: LLMConfig, input: string, context?: string): Promise<string> {
    const messages: AgentMessage[] = [
      { role: 'system', content: this.systemPrompt },
    ];
    if (context) {
      messages.push({ role: 'user', content: `Context from previous work:\n${context}` });
    }
    messages.push({ role: 'user', content: input });
    const result = await callLLM(config, messages);
    return result || '';
  }
}
