import { GenUIView } from './GenUIView/GenUIView';
import { WorkspaceControlPlaneView } from './control-plane/WorkspaceControlPlaneView';

export type WorkspaceMode = 'genui' | 'control-plane';

export const VIEW_REGISTRY: Record<WorkspaceMode, { id: WorkspaceMode; label: string; Component: React.ComponentType }> = {
  genui: { id: 'genui', label: 'GenUI', Component: GenUIView },
  'control-plane': { id: 'control-plane', label: 'Control Plane', Component: WorkspaceControlPlaneView },
};

export const VIEW_ORDER: WorkspaceMode[] = ['genui', 'control-plane'];
