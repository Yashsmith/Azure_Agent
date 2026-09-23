import type { PhaseId } from './types';

export type WorkspaceCommand =
  | { type: 'sprint.start'; workspaceId: string; brief: string }
  | { type: 'phase.advance'; workspaceId: string; phaseId: PhaseId }
  | { type: 'agent.task.reassign'; workspaceId: string; agentId: string; task: string }
  | { type: 'message.create'; workspaceId: string; message: Omit<import('./types').WorkspaceMessage, 'id'> };

export interface CommandResult {
  accepted: boolean;
  commandId: string;
}
