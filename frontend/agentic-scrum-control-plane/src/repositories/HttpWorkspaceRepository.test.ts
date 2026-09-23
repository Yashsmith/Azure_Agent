import { describe, expect, it, vi } from 'vitest';
import { HttpWorkspaceRepository } from './HttpWorkspaceRepository';

const snapshot = { workspaceId: 'workspace-1', version: 1, phaseId: 'kickoff', agents: [], messages: [], processedEventIds: [] };

describe('HttpWorkspaceRepository', () => {
  it('loads a snapshot and sends commands through the transport boundary', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(snapshot), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ accepted: true, commandId: 'command-1' }), { status: 200 }));
    const repository = new HttpWorkspaceRepository('https://api.example.test', fetcher);

    await expect(repository.getSnapshot('workspace-1')).resolves.toEqual(snapshot);
    await expect(repository.execute({ type: 'phase.advance', workspaceId: 'workspace-1', phaseId: 'build' })).resolves.toEqual({ accepted: true, commandId: 'command-1' });
    expect(fetcher).toHaveBeenLastCalledWith('https://api.example.test/workspace/workspace-1/commands', expect.objectContaining({ method: 'POST' }));
  });

  it('surfaces failed HTTP responses', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    const repository = new HttpWorkspaceRepository('https://api.example.test', fetcher);

    await expect(repository.getSnapshot('workspace-1')).rejects.toThrow('503');
  });
});
