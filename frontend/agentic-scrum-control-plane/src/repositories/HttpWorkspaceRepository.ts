import type { WorkspaceCommand, CommandResult } from '../domain/commands';
import type { WorkspaceEvent, WorkspaceSnapshot } from '../domain/types';
import type { WorkspaceRepository } from './WorkspaceRepository';

export class HttpWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly baseUrl: string, private readonly fetcher: typeof fetch = fetch) {}

  async getSnapshot(workspaceId: string): Promise<WorkspaceSnapshot> {
    const response = await this.fetcher(`${this.baseUrl}/workspace/${encodeURIComponent(workspaceId)}/snapshot`);
    if (!response.ok) throw new Error(`Workspace snapshot failed: ${response.status}`);
    return response.json() as Promise<WorkspaceSnapshot>;
  }

  async execute(command: WorkspaceCommand): Promise<CommandResult> {
    const response = await this.fetcher(`${this.baseUrl}/workspace/${encodeURIComponent(command.workspaceId)}/commands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
    });
    if (!response.ok) throw new Error(`Workspace command failed: ${response.status}`);
    return response.json() as Promise<CommandResult>;
  }

  subscribe(workspaceId: string, onEvent: (event: WorkspaceEvent) => void, onError?: (error: Error) => void) {
    const source = new EventSource(`${this.baseUrl}/workspace/${encodeURIComponent(workspaceId)}/events`);
    const handleMessage = (message: MessageEvent<string>) => {
      try {
        onEvent(JSON.parse(message.data) as WorkspaceEvent);
      } catch {
        onError?.(new Error('Workspace event was not valid JSON'));
      }
    };
    const handleError = () => onError?.(new Error('Workspace event stream disconnected'));
    source.addEventListener('message', handleMessage);
    source.addEventListener('error', handleError);
    return () => {
      source.removeEventListener('message', handleMessage);
      source.removeEventListener('error', handleError);
      source.close();
    };
  }
}
