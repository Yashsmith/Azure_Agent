import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import type { WorkspaceRepository } from '../repositories/WorkspaceRepository';
import { WorkspaceStore } from './workspaceStore';
import type { WorkspaceEvent, WorkspaceSnapshot } from '../domain/types';

interface WorkspaceContextValue {
  snapshot: WorkspaceSnapshot;
  repository: WorkspaceRepository;
  publishEvent: (event: WorkspaceEvent) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  workspaceId,
  repository,
  children,
}: {
  workspaceId: string;
  repository: WorkspaceRepository;
  children: React.ReactNode;
}) {
  const [store] = React.useState(() => new WorkspaceStore({
    workspaceId,
    version: 0,
    phaseId: 'kickoff',
    agents: [],
    messages: [],
    processedEventIds: [],
  }));
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);

  useEffect(() => {
    let active = true;
    void repository.getSnapshot(workspaceId).then((next) => {
      if (!active) return;
      store.replaceSnapshot(next);
    });
    return () => {
      active = false;
    };
  }, [repository, store, workspaceId]);

  useEffect(() => repository.subscribe(workspaceId, store.apply), [repository, store, workspaceId]);

  return <WorkspaceContext.Provider value={{ snapshot, repository, publishEvent: store.apply }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}
