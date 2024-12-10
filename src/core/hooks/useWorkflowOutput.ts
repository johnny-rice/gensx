import { useContext } from "react";
import { WorkflowContext } from "../context/workflow-context";

export const workflowOutputs = new Map<string, any>();
export const outputDependencies = new Map<string, Set<string>>();
export const dependencyGraph = new Map<string, Set<string>>();

let counter = 0;
function generateStableId() {
  return `output_${counter++}`;
}

export function useWorkflowOutput<T>(
  initialValue: T
): [() => T, (value: T) => void] {
  const workflowContext = useContext(WorkflowContext);
  const outputId = generateStableId();
  const componentId = workflowContext.current?.getCurrentComponentId() || "";

  if (!workflowOutputs.has(outputId)) {
    workflowOutputs.set(outputId, initialValue);
  }

  const getValue = () => {
    // Record dependency
    if (componentId) {
      if (!dependencyGraph.has(componentId)) {
        dependencyGraph.set(componentId, new Set());
      }
      dependencyGraph.get(componentId)?.add(outputId);
    }
    return workflowOutputs.get(outputId);
  };

  const setValue = (newValue: T) => {
    workflowOutputs.set(outputId, newValue);
    // Notify dependent components
    for (const [compId, dependencies] of dependencyGraph.entries()) {
      if (dependencies.has(outputId)) {
        workflowContext.current?.notifyUpdate(compId);
      }
    }
  };

  return [getValue, setValue];
}

// Non-hook version for use outside React components
export function createWorkflowOutput<T>(
  initialValue: T
): [() => T, (value: T) => void] {
  const outputId = generateStableId();

  if (!workflowOutputs.has(outputId)) {
    workflowOutputs.set(outputId, initialValue);
  }

  const getValue = () => workflowOutputs.get(outputId);

  const setValue = (newValue: T) => {
    workflowOutputs.set(outputId, newValue);
  };

  return [getValue, setValue];
}
