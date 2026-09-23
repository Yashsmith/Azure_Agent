import type { WorkspaceEvent, WorkspaceSnapshot } from './types';

export function applyWorkspaceEvent(snapshot: WorkspaceSnapshot, event: WorkspaceEvent): WorkspaceSnapshot {
  if (event.workspaceId !== snapshot.workspaceId) return snapshot;
  if (snapshot.processedEventIds.includes(event.eventId)) return snapshot;
  if (event.version < snapshot.version) return snapshot;

  const next: WorkspaceSnapshot = {
    ...snapshot,
    version: event.version,
    processedEventIds: [...snapshot.processedEventIds, event.eventId],
  };

  switch (event.type) {
    case 'agent.updated':
      return {
        ...next,
        agents: snapshot.agents.map((agent) => agent.id === event.payload.id ? { ...agent, ...event.payload } : agent),
      };
    case 'message.created':
      return { ...next, messages: [...snapshot.messages, event.payload] };
    case 'phase.changed':
      return { ...next, phaseId: event.payload.phaseId };
  }
}
