import type { WorkspaceCommand, CommandResult } from '../domain/commands';
import type { WorkspaceEvent, WorkspaceSnapshot } from '../domain/types';
import type { WorkspaceRepository } from './WorkspaceRepository';

export class MockWorkspaceRepository implements WorkspaceRepository {
  private readonly listeners = new Set<(event: WorkspaceEvent) => void>();
  private snapshot: WorkspaceSnapshot;

  constructor(snapshot: WorkspaceSnapshot) {
    this.snapshot = structuredClone(snapshot);
  }

  async getSnapshot(workspaceId: string) {
    if (workspaceId !== this.snapshot.workspaceId) {
      throw new Error(`Unknown workspace: ${workspaceId}`);
    }
    return structuredClone(this.snapshot);
  }

  async execute(command: WorkspaceCommand): Promise<CommandResult> {
    return { accepted: true, commandId: `${command.type}-${Date.now()}` };
  }

  subscribe(workspaceId: string, onEvent: (event: WorkspaceEvent) => void, onError?: (error: Error) => void) {
    if (workspaceId !== this.snapshot.workspaceId) {
      onError?.(new Error(`Unknown workspace: ${workspaceId}`));
      return () => undefined;
    }
    this.listeners.add(onEvent);
    return () => this.listeners.delete(onEvent);
  }

  emit(event: WorkspaceEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}
