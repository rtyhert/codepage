import type { LLMConfig, EnvDefaults, Project, HistoryItem, OutputFormat, UserPreferences, TemplateItem } from '../types';

const PREFS_KEY = 'codepage:prefs';
const TEMPLATES_KEY = 'codepage:templates';

function loadPrefs(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { theme: 'dark', defaultFormat: 'html', defaultViewMode: 'desktop', defaultTab: 'code' };
}

function loadCustomTemplates(): TemplateItem[] {
  try {
    const raw = localStorage.getItem(TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

class AppStore {
  config: LLMConfig | null = null;
  envDefaults: EnvDefaults | null = null;
  currentCode = '';
  currentFormat: OutputFormat = 'html';
  projects: Project[] = [];
  currentProject: Project | null = null;
  history: HistoryItem[] = [];
  historyMax = 200;
  activeTags: Set<string> = new Set();
  isGenerating = false;
  abortController: AbortController | null = null;
  mode: 'builder' | 'agent' = 'builder';

  preferences: UserPreferences = loadPrefs();
  customTemplates: TemplateItem[] = loadCustomTemplates();

  get apiConfigured(): boolean {
    return !!(this.config?.url && this.config?.key && this.config?.model);
  }

  savePreferences(): void {
    localStorage.setItem(PREFS_KEY, JSON.stringify(this.preferences));
  }

  saveCustomTemplates(): void {
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(this.customTemplates));
  }
}

export const store = new AppStore();
