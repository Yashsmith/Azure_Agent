export type PhaseId = 'kickoff' | 'brainstorm' | 'prd' | 'build' | 'review' | 'ship';

export type AgentStatus = 'idle' | 'active' | 'speaking' | 'blocked' | 'complete';

export interface WorkspaceAgent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  activeTask?: string;
  confidenceScore?: number;
}

export interface WorkspaceMessage {
  id: string;
  meetId: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface WorkspaceSnapshot {
  workspaceId: string;
  version: number;
  phaseId: PhaseId;
  agents: WorkspaceAgent[];
  messages: WorkspaceMessage[];
  processedEventIds: string[];
}

export interface WorkspaceEventBase {
  eventId: string;
  workspaceId: string;
  occurredAt: string;
  version: number;
}

export type WorkspaceEvent =
  | (WorkspaceEventBase & { type: 'agent.updated'; payload: WorkspaceAgent })
  | (WorkspaceEventBase & { type: 'message.created'; payload: WorkspaceMessage })
  | (WorkspaceEventBase & { type: 'phase.changed'; payload: { phaseId: PhaseId } });
