export interface LogEntry {
  id: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: 'system' | 'agent' | 'api' | 'llm' | 'server';
  message: string;
  data?: string;
  timestamp: string;
}

class RingBuffer {
  private buffer: LogEntry[] = [];
  private maxSize: number;
  private idCounter = 0;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  private push(level: LogEntry['level'], source: LogEntry['source'] | 'server', message: string, data?: any) {
    const entry: LogEntry = {
      id: ++this.idCounter,
      level,
      source,
      message,
      data: data !== undefined ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined,
      timestamp: new Date().toISOString(),
    };
    this.buffer.push(entry);
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift();
    }
  }

  info(source: LogEntry['source'], message: string, data?: any) { this.push('info', source, message, data); }
  warn(source: LogEntry['source'], message: string, data?: any) { this.push('warn', source, message, data); }
  error(source: LogEntry['source'], message: string, data?: any) { this.push('error', source, message, data); }
  debug(source: LogEntry['source'], message: string, data?: any) { this.push('debug', source, message, data); }

  getLogs(afterId?: number): LogEntry[] {
    if (!afterId) return [...this.buffer];
    return this.buffer.filter((e) => e.id > afterId);
  }

  clear() {
    this.buffer = [];
  }

  getAll(): LogEntry[] {
    return [...this.buffer];
  }
}

export const log = new RingBuffer();
