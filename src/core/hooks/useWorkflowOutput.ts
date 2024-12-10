import { useContext } from "react";
import { WorkflowContext } from "../context/workflow-context";

export const workflowOutputs = new Map<
  string,
  {
    promise: Promise<any>;
    resolve: (value: any) => void;
    hasResolved: boolean;
  }
>();

let counter = 0;
function generateStableId() {
  return `output_${counter++}`;
}

export function useWorkflowOutput<T>(
  initialValue: T
): [() => Promise<T>, (value: T) => void] {
  const workflowContext = useContext(WorkflowContext);
  const outputId = generateStableId();

  if (!workflowOutputs.has(outputId)) {
    let resolvePromise: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
      resolvePromise = resolve;
    });

    workflowOutputs.set(outputId, {
      promise,
      resolve: resolvePromise!,
      hasResolved: false,
    });
  }

  const getValue = () => {
    const output = workflowOutputs.get(outputId)!;
    return output.promise;
  };

  const setValue = (value: T) => {
    const output = workflowOutputs.get(outputId)!;
    if (output.hasResolved) {
      throw new Error("Cannot set value multiple times");
    }
    output.resolve(value);
    output.hasResolved = true;
  };

  return [getValue, setValue];
}

// Non-hook version for use outside React components
export function createWorkflowOutput<T>(
  initialValue: T
): [() => Promise<T>, (value: T) => void] {
  const outputId = generateStableId();

  if (!workflowOutputs.has(outputId)) {
    let resolvePromise: (value: T) => void;
    const promise = new Promise<T>((resolve) => {
      resolvePromise = resolve;
    });

    workflowOutputs.set(outputId, {
      promise,
      resolve: resolvePromise!,
      hasResolved: false,
    });
  }

  const getValue = () => {
    const output = workflowOutputs.get(outputId)!;
    return output.promise;
  };

  const setValue = (value: T) => {
    const output = workflowOutputs.get(outputId)!;
    if (output.hasResolved) {
      throw new Error("Cannot set value multiple times");
    }
    output.resolve(value);
    output.hasResolved = true;
  };

  return [getValue, setValue];
}
