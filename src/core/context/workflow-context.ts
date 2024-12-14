import { createContext } from "react";

export interface WorkflowContext {
  current: {
    notifyUpdate: (componentId: string) => void;
    getCurrentComponentId: () => string | null;
  } | null;
}

class WorkflowContextImpl implements WorkflowContext {
  current: WorkflowContext["current"] = {
    notifyUpdate(_componentId: string) {
      // Implementation to handle component updates
      // This might involve triggering re-renders or updating dependent components
    },
    getCurrentComponentId() {
      return null;
    },
  };
}

export const WorkflowContext = createContext<WorkflowContext>(
  new WorkflowContextImpl(),
);
