import { Router } from 'express';
import { prisma } from '../index';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

apiRouter.get('/projects', async (_req, res) => {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { pages: true } } },
    orderBy: { updatedAt: 'desc' },
  });
  res.json({ projects });
});

apiRouter.post('/projects', async (req, res) => {
  const { name, prompt } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name required' });
  const project = await prisma.project.create({
    data: { name, prompt: prompt || '' },
  });
  res.json({ project });
});

apiRouter.get('/projects/:id', async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.id },
    include: { pages: { orderBy: { sortOrder: 'asc' } } },
  });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json({ project });
});

apiRouter.put('/projects/:id', async (req, res) => {
  const { name } = req.body;
  const project = await prisma.project.update({
    where: { id: req.params.id },
    data: { name },
  });
  res.json({ project });
});

apiRouter.delete('/projects/:id', async (req, res) => {
  await prisma.project.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

apiRouter.post('/projects/:id/pages', async (req, res) => {
  const { name, format, code, prompt } = req.body;
  const count = await prisma.page.count({ where: { projectId: req.params.id } });
  const page = await prisma.page.create({
    data: {
      projectId: req.params.id,
      name: name || `Page ${count + 1}`,
      format: format || 'html',
      code: code || '',
      prompt: prompt || '',
      sortOrder: count,
    },
  });
  res.json({ page });
});

apiRouter.patch('/pages/reorder', async (req, res) => {
  const { orders } = req.body;
  if (!Array.isArray(orders)) return res.status(400).json({ error: 'orders array required' });
  for (const { id, sortOrder } of orders) {
    await prisma.page.update({ where: { id }, data: { sortOrder } });
  }
  res.json({ success: true });
});

apiRouter.put('/pages/:id', async (req, res) => {
  const { name, code, format, prompt } = req.body;
  if (req.params.id === 'reorder') return res.status(400).json({ error: 'Use PATCH /api/pages/reorder' });
  const page = await prisma.page.update({
    where: { id: req.params.id },
    data: { name, code, format, prompt },
  });
  res.json({ page });
});

apiRouter.delete('/pages/:id', async (req, res) => {
  await prisma.page.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

const HISTORY_MAX = parseInt(process.env.HISTORY_MAX || '200');

apiRouter.get('/history', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || HISTORY_MAX, HISTORY_MAX);
  const items = await prisma.history.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  res.json({ items, max: HISTORY_MAX });
});

apiRouter.delete('/history', async (_req, res) => {
  await prisma.history.deleteMany();
  res.json({ success: true });
});

apiRouter.post('/history', async (req, res) => {
  const { prompt, code, format, tagHints } = req.body;
  await prisma.history.create({
    data: { prompt, code, format: format || 'html', tagHints },
  });
  const count = await prisma.history.count();
  if (count > HISTORY_MAX) {
    const old = await prisma.history.findMany({ orderBy: { createdAt: 'asc' }, take: count - HISTORY_MAX });
    await prisma.history.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  }
  res.json({ success: true });
});
