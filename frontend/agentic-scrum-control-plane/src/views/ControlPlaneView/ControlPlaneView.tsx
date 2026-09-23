import { useWorkspace } from '../../state/WorkspaceProvider';
import ControlPlaneApp from '../../../../the-deck-—-agentic-scrum-control-plane/src/App';

/**
 * Single boundary for the sibling Control Plane implementation.
 * The shell and all other views consume this module, never the
 * sibling filesystem path directly.
 */
export function ControlPlaneView() {
  const { snapshot, executeCommand } = useWorkspace();
  return (
    <div className="deck-shell">
      <ControlPlaneApp workspaceSnapshot={snapshot} executeCommand={executeCommand} />
    </div>
  );
}
