import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { apiRouter } from './routes/api';
import { llmRouter } from './routes/llm';
import { agentRouter } from './routes/agent';
import { consoleRouter } from './routes/console';
import { log } from './utils/logger';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;
const SHUTDOWN_TIMEOUT = parseInt(process.env.SHUTDOWN_TIMEOUT || '10000');

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', '..', 'client', 'dist')));

const TIMEOUT_MS = parseInt(process.env.REQUEST_TIMEOUT || '60000');
app.use((_req, res, next) => {
  res.setTimeout(TIMEOUT_MS, () => {
    res.status(503).json({ error: 'Request timeout' });
  });
  next();
});

app.use('/api', apiRouter);
app.use('/api', llmRouter);
app.use('/api', agentRouter);
app.use('/api', consoleRouter);

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'client', 'dist', 'index.html'));
});

let server: ReturnType<typeof app.listen>;

async function main() {
  await prisma.$connect();
  console.log('✓ Database connected');
  server = app.listen(PORT, () => {
    console.log(`✓ CodePage server: http://localhost:${PORT}`);
  });
}

main().catch((e) => {
  console.error('Failed to start:', e);
  process.exit(1);
});

async function shutdown(signal: string) {
  log.info('server', `${signal} received — shutting down gracefully`);
  server?.close(() => {
    log.info('server', 'HTTP server closed');
  });
  const timeout = setTimeout(() => {
    log.error('server', 'Forced shutdown after timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT);
  await prisma.$disconnect();
  clearTimeout(timeout);
  log.info('server', 'Prisma disconnected — goodbye');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
