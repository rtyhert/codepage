import { store } from '../stores/appStore';

export function extractCodeBlock(text: string): string {
  const m = text.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  return m ? m[1].trim() : text.trim();
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatHTML(code: string): string {
  let indent = '', out = '';
  const lines = code.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { out += '\n'; continue; }
    if (/^<\/(?!area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i.test(trimmed)) {
      indent = indent.slice(2);
    }
    out += indent + trimmed + '\n';
    if (/^<(?!area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr|[/!?])/i.test(trimmed) && !trimmed.endsWith('/>')) {
      indent += '  ';
    }
  }
  return out.trim();
}

export function minifyCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\n/g, ' ')
    .trim();
}

export function downloadCode(code: string, format: string): void {
  const ext = format === 'react' ? 'jsx' : format === 'vue' ? 'vue' : 'html';
  const blob = new Blob([code], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `page.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export const FORMAT_NAMES: Record<string, string> = {
  html: 'HTML',
  react: 'React (JSX)',
  vue: 'Vue 3 (SFC)',
};

export const BUILTIN_TEMPLATES = [
  { name: '暗黑登录', prompt: 'A dark mode login form with username/password inputs and gradient submit button with validation' },
  { name: '响应式导航', prompt: 'A responsive navbar with logo on left, menu items on right, hamburger menu on mobile with drawer sidebar' },
  { name: '产品卡片', prompt: 'A product card grid, each card has image placeholder, title, description and buy button, 3-column responsive with hover effects' },
  { name: '侧边栏', prompt: 'A sidebar navigation menu with icons, collapsible, containing dashboard, users, settings menu items' },
  { name: '统计面板', prompt: 'A data statistics panel with 4 metric cards in a row, each with number, label and trend arrow with count animation' },
  { name: '模态弹窗', prompt: 'A modal dialog component with overlay, title, content, footer buttons, click overlay to close, with animation' },
];

export function getAllTemplates() {
  return [...BUILTIN_TEMPLATES, ...store.customTemplates];
}

export function exportTemplatesJSON(): string {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: getAllTemplates(),
    customTemplates: store.customTemplates,
  };
  return JSON.stringify(data, null, 2);
}

export function importTemplatesJSON(json: string): { builtin: number; custom: number; errors: string[] } {
  const result = { builtin: 0, custom: 0, errors: [] as string[] };
  try {
    const data = JSON.parse(json);
    if (!data.templates || !Array.isArray(data.templates)) {
      result.errors.push('Invalid format: missing templates array');
      return result;
    }
    const valid = data.templates.filter((t: any) => t.name && t.prompt);
    const loaded = valid.filter((t: any) => !BUILTIN_TEMPLATES.some((b) => b.name === t.name));
    for (const t of loaded) {
      if (!store.customTemplates.some((c) => c.name === t.name)) {
        store.customTemplates.push({ name: t.name, prompt: t.prompt });
        result.custom++;
      }
    }
    const builtin = valid.filter((t: any) => BUILTIN_TEMPLATES.some((b) => b.name === t.name));
    result.builtin = builtin.length;
    store.saveCustomTemplates();
  } catch (e: any) {
    result.errors.push(e.message || 'Invalid JSON');
  }
  return result;
}

export function downloadJSON(data: string, filename: string): void {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}

export interface PresetItem {
  name: string;
  url: string;
  auth: string;
  model: string;
}

export const PRESETS: PresetItem[] = [
  { name: 'DeepSeek', url: 'https://api.deepseek.com/v1/chat/completions', auth: 'Bearer', model: 'deepseek-chat' },
  { name: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions', auth: 'Bearer', model: 'gpt-4o' },
  { name: 'SenseNova/NEO', url: 'https://token.sensenova.cn/v1/chat/completions', auth: 'Bearer', model: 'sensenova-u1-fast' },
  { name: '月之暗面', url: 'https://api.moonshot.cn/v1/chat/completions', auth: 'Bearer', model: 'moonshot-v1-8k' },
  { name: '通义千问', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', auth: 'Bearer', model: 'qwen-turbo' },
  { name: '智谱 GLM', url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', auth: 'Bearer', model: 'glm-4-flash' },
  { name: 'MiniMax', url: 'https://api.minimaxi.com/v1/chat/completions', auth: 'Bearer', model: 'abab6.5s' },
  { name: '零一万物', url: 'https://api.lingyiwanwu.com/v1/chat/completions', auth: 'Bearer', model: 'yi-large' },
  { name: '阶跃星辰', url: 'https://api.stepfun.com/v1/chat/completions', auth: 'Bearer', model: 'step-1v-32k' },
  { name: 'SiliconFlow', url: 'https://api.siliconflow.cn/v1/chat/completions', auth: 'Bearer', model: 'deepseek-ai/DeepSeek-V3' },
  { name: '幻城网安公益', url: 'https://api.iamhc.cn/v1/chat/completions', auth: 'None', model: 'deepseek-chat' },
  { name: 'Ollama（本地）', url: 'http://localhost:11434/v1/chat/completions', auth: 'None', model: 'llama3.2' },
  { name: '7亿AI', url: 'https://api.7y.ai/v1/chat/completions', auth: 'Bearer', model: 'gpt-4o-mini' },
  { name: 'API2D', url: 'https://api.api2d.com/v1/chat/completions', auth: 'Bearer', model: 'gpt-4o' },
];
