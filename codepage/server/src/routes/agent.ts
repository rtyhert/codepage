import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { OrchestratorAgent } from '../agent';
import { loadAgentConfig } from '../utils/agent-config';
import type { TaskUpdate } from '../agent/types';

export const agentRouter = Router();
const orchestrator = new OrchestratorAgent();

function idParam(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

// Background execution queue
const runningTasks = new Map<string, Promise<void>>();

agentRouter.get('/agent/runs', async (_req: Request, res: Response) => {
  try {
    const runs = await prisma.agentRun.findMany({
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ runs });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

agentRouter.get('/agent/runs/:id', async (req: Request, res: Response) => {
  try {
    const run = await prisma.agentRun.findUnique({
      where: { id: idParam(req) },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!run) return res.status(404).json({ error: 'Run not found' });
    res.json({ run });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

agentRouter.post('/agent/runs', async (req: Request, res: Response) => {
  const { name, requirement } = req.body;
  if (!requirement) {
    return res.status(400).json({ error: 'Requirement is required' });
  }
  try {
    const run = await prisma.agentRun.create({
      data: {
        name: name || requirement.slice(0, 60),
        requirement,
        status: 'pending',
      },
    });
    res.json({ run: { ...run, tasks: [] } });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Execute asynchronously — returns immediately, processes in background
agentRouter.post('/agent/runs/:id/execute', async (req: Request, res: Response) => {
  const config = loadAgentConfig();
  if (!config) {
    return res.status(400).json({ error: 'API not configured' });
  }

  const runId = idParam(req);
  try {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run) return res.status(404).json({ error: 'Run not found' });
    if (run.status === 'executing') {
      return res.status(400).json({ error: 'Run is already executing' });
    }

    // Mark as executing and return immediately
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status: 'executing' },
    });

    // Start background execution
    const promise = executeRunInBackground(runId, config);
    runningTasks.set(runId, promise);
    promise.finally(() => runningTasks.delete(runId));

    const updated = await prisma.agentRun.findUnique({
      where: { id: runId },
      include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });
    res.json({ run: updated });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

async function executeRunInBackground(runId: string, config: any): Promise<void> {
  const updateStatus = async (status: string, result?: string) => {
    await prisma.agentRun.update({
      where: { id: runId },
      data: { status, result },
    });
  };

  try {
    const run = await prisma.agentRun.findUnique({ where: { id: runId } });
    if (!run) return;

    // Tracks sort order across createPlan and onTaskUpdate
    let sortCounter = 0;

    const result = await orchestrator.execute(
      run.requirement, config,
      async (taskUpdate: TaskUpdate & { description?: string; input?: string; dependsOn?: string[] }) => {
        if (taskUpdate.description !== undefined && taskUpdate.description !== null) {
          // New task definition from the plan
          await prisma.agentTask.upsert({
            where: { id: taskUpdate.id },
            create: {
              id: taskUpdate.id, agentRunId: runId,
              agentType: taskUpdate.agentType!, name: taskUpdate.name!,
              description: taskUpdate.description, input: taskUpdate.input || '',
              status: taskUpdate.status, output: '', error: '',
              sortOrder: sortCounter++,
            },
            update: { description: taskUpdate.description, input: taskUpdate.input },
          });
        } else {
          // Status update for existing task
          const data: any = { status: taskUpdate.status };
          if (taskUpdate.output !== undefined) data.output = taskUpdate.output;
          if (taskUpdate.error !== undefined) data.error = taskUpdate.error;
          try {
            await prisma.agentTask.update({ where: { id: taskUpdate.id }, data });
          } catch {
            // Task not yet created — create it with minimal fields
            await prisma.agentTask.create({
              data: {
                id: taskUpdate.id, agentRunId: runId,
                agentType: taskUpdate.agentType!, name: taskUpdate.name || '',
                description: '', input: '', status: taskUpdate.status,
                output: taskUpdate.output || '', error: taskUpdate.error || '',
                sortOrder: sortCounter++,
              },
            });
          }
        }
      },
    );

    await updateStatus('completed', JSON.stringify({
      summary: result.summary,
      artifacts: result.artifacts,
    }));
  } catch (e: any) {
    await updateStatus('failed', JSON.stringify({ error: e.message }));
  }
}

agentRouter.delete('/agent/runs/:id', async (req: Request, res: Response) => {
  try {
    const runId = idParam(req);
    // Cancel background execution if running
    if (runningTasks.has(runId)) {
      runningTasks.delete(runId);
    }
    await prisma.agentRun.delete({ where: { id: runId } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
