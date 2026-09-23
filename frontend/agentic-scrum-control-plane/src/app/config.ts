export interface AppConfig {
  apiBaseUrl: string;
  workspaceId: string;
  transport: 'mock' | 'http-sse';
  enableSimulation: boolean;
}

export function readConfig(env: Record<string, string | undefined> = import.meta.env): AppConfig {
  const transport = env.VITE_TRANSPORT === 'http-sse' ? 'http-sse' : 'mock';
  return {
    apiBaseUrl: env.VITE_API_BASE_URL ?? '',
    workspaceId: env.VITE_WORKSPACE_ID ?? 'workspace-demo',
    transport,
    enableSimulation: env.VITE_ENABLE_SIMULATION !== 'false',
  };
}
