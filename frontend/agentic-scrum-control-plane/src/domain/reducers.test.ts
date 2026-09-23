import { describe, expect, it } from 'vitest';
import { applyWorkspaceEvent } from './reducers';
import type { WorkspaceSnapshot } from './types';

const snapshot: WorkspaceSnapshot = {
  workspaceId: 'workspace-1',
  version: 1,
  phaseId: 'kickoff',
  agents: [{ id: 'agent-1', name: 'Agent-01', role: 'Backend', status: 'idle' }],
  messages: [],
  processedEventIds: [],
};

describe('applyWorkspaceEvent', () => {
  it('applies a new event without mutating the previous snapshot', () => {
    const event = {
      eventId: 'event-1',
      workspaceId: 'workspace-1',
      occurredAt: '2026-09-24T00:00:00Z',
      version: 2,
      type: 'agent.updated' as const,
      payload: { id: 'agent-1', name: 'Agent-01', role: 'Backend', status: 'active' as const },
    };

    const next = applyWorkspaceEvent(snapshot, event);

    expect(next).not.toBe(snapshot);
    expect(next.agents[0].status).toBe('active');
    expect(snapshot.agents[0].status).toBe('idle');
  });

  it('ignores duplicate event IDs', () => {
    const event = {
      eventId: 'event-duplicate',
      workspaceId: 'workspace-1',
      occurredAt: '2026-09-24T00:00:00Z',
      version: 2,
      type: 'phase.changed' as const,
      payload: { phaseId: 'brainstorm' as const },
    };
    const once = applyWorkspaceEvent(snapshot, event);
    const twice = applyWorkspaceEvent(once, event);

    expect(twice).toBe(once);
  });

  it('ignores events from another workspace and stale versions', () => {
    const otherWorkspace = applyWorkspaceEvent(snapshot, {
      eventId: 'other', workspaceId: 'workspace-2', occurredAt: '', version: 2,
      type: 'phase.changed', payload: { phaseId: 'ship' },
    });
    const stale = applyWorkspaceEvent(snapshot, {
      eventId: 'stale', workspaceId: 'workspace-1', occurredAt: '', version: 0,
      type: 'phase.changed', payload: { phaseId: 'ship' },
    });

    expect(otherWorkspace).toBe(snapshot);
    expect(stale).toBe(snapshot);
  });
});
