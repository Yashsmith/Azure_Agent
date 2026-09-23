import { useState } from 'react';
import { WorkspaceProvider } from './state/WorkspaceProvider';
import { WorkspaceShell } from './app/WorkspaceShell';
import { MockWorkspaceRepository } from './repositories/MockWorkspaceRepository';
import { HttpWorkspaceRepository } from './repositories/HttpWorkspaceRepository';
import type { WorkspaceRepository } from './repositories/WorkspaceRepository';
import type { WorkspaceSnapshot } from './domain/types';
import { readConfig } from './app/config';
import { createDemoWorkspaceSnapshot } from './adapters/createDemoWorkspaceSnapshot';

const appConfig = readConfig();

export default function App() {
  const [repository] = useState<WorkspaceRepository>(() =>
    appConfig.transport === 'mock'
      ? new MockWorkspaceRepository(DEMO_WORKSPACE_SEED)
      : new HttpWorkspaceRepository(appConfig.apiBaseUrl),
  );

  return (
    <WorkspaceProvider workspaceId={appConfig.workspaceId} repository={repository}>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
}

const DEMO_WORKSPACE_SEED: WorkspaceSnapshot = {
  ...createDemoWorkspaceSnapshot(appConfig.workspaceId),
};
