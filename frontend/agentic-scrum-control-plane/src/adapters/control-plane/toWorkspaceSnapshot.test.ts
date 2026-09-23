import { describe, expect, it } from 'vitest';
import { createInitialWorkspaceSnapshot } from './toWorkspaceSnapshot';

describe('createInitialWorkspaceSnapshot', () => {
  it('normalizes the Control Plane fixture into shared workspace state', () => {
    const snapshot = createInitialWorkspaceSnapshot('workspace-1');
    expect(snapshot.workspaceId).toBe('workspace-1');
    expect(snapshot.agents.length).toBeGreaterThan(0);
    expect(snapshot.messages.length).toBeGreaterThan(0);
    expect(snapshot.agents[0]).toHaveProperty('id');
  });
});
