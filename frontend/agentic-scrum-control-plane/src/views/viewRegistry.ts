import { GenUIView } from './GenUIView/GenUIView';
import { ControlPlaneView } from './ControlPlaneView/ControlPlaneView';

export type WorkspaceMode = 'genui' | 'control-plane';

export const VIEW_REGISTRY: Record<WorkspaceMode, { id: WorkspaceMode; label: string; Component: React.ComponentType }> = {
  genui: { id: 'genui', label: 'GenUI', Component: GenUIView },
  'control-plane': { id: 'control-plane', label: 'Control Plane', Component: ControlPlaneView },
};

export const VIEW_ORDER: WorkspaceMode[] = ['genui', 'control-plane'];
