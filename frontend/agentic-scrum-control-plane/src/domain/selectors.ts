import type { WorkspaceSnapshot } from './types';

export function selectAgent(snapshot: WorkspaceSnapshot, agentId: string) {
  return snapshot.agents.find((agent) => agent.id === agentId) ?? null;
}

export function selectMeetMessages(snapshot: WorkspaceSnapshot, meetId: string) {
  return snapshot.messages.filter((message) => message.meetId === meetId);
}

export function selectActiveAgents(snapshot: WorkspaceSnapshot) {
  return snapshot.agents.filter((agent) => agent.status !== 'idle');
}
