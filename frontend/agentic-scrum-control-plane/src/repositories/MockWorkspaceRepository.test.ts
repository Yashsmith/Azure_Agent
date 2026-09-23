import { describe, expect, it, vi } from 'vitest';
import { MockWorkspaceRepository } from './MockWorkspaceRepository';
import type { WorkspaceSnapshot } from '../domain/types';

const snapshot: WorkspaceSnapshot = {
  workspaceId: 'workspace-1', version: 1, phaseId: 'kickoff', agents: [], messages: [], processedEventIds: [],
};

describe('MockWorkspaceRepository', () => {
  it('returns an isolated snapshot and supports subscription cleanup', async () => {
    const repository = new MockWorkspaceRepository(snapshot);
    const first = await repository.getSnapshot('workspace-1');
    first.phaseId = 'ship';
    expect((await repository.getSnapshot('workspace-1')).phaseId).toBe('kickoff');

    const listener = vi.fn();
    const unsubscribe = repository.subscribe('workspace-1', listener);
    repository.emit({ eventId: 'event-1', workspaceId: 'workspace-1', occurredAt: '', version: 2, type: 'phase.changed', payload: { phaseId: 'build' } });
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    repository.emit({ eventId: 'event-2', workspaceId: 'workspace-1', occurredAt: '', version: 3, type: 'phase.changed', payload: { phaseId: 'ship' } });
    expect(listener).toHaveBeenCalledOnce();
  });
});
