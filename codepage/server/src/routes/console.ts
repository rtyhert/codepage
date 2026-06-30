import { Router, Request, Response } from 'express';
import { log } from '../utils/logger';

export const consoleRouter = Router();

consoleRouter.get('/console/logs', (req: Request, res: Response) => {
  const afterId = parseInt(req.query.after as string) || 0;
  const source = req.query.source as string;
  let entries = log.getLogs(afterId);
  if (source) {
    entries = entries.filter((e) => e.source === source);
  }
  res.json({ entries, serverTime: Date.now() });
});

consoleRouter.post('/console/logs', (req: Request, res: Response) => {
  const { level, source, message, data } = req.body;
  if (!level || !source || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const validLevels = ['info', 'warn', 'error', 'debug'];
  const validSources = ['system', 'agent', 'api', 'llm'];
  if (!validLevels.includes(level) || !validSources.includes(source)) {
    return res.status(400).json({ error: 'Invalid level or source' });
  }
  (log as any)[level](source, message, data);
  res.json({ success: true });
});

consoleRouter.delete('/console/logs', (_req: Request, res: Response) => {
  log.clear();
  res.json({ success: true });
});
