import { useRef } from "react";

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
  _initialValue: T // Kept for API compatibility but unused
): [Promise<T>, (value: T) => void] {
  const outputId = useRef(generateStableId()).current;

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

  const output = workflowOutputs.get(outputId)!;

  const setValue = (value: T) => {
    if (output.hasResolved) {
      throw new Error("Cannot set value multiple times");
    }
    output.resolve(value);
    output.hasResolved = true;
  };

  return [output.promise, setValue];
}

// Non-hook version for use outside React components
export function createWorkflowOutput<T>(
  _initialValue: T
): [Promise<T>, (value: T) => void] {
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

  const output = workflowOutputs.get(outputId)!;

  const setValue = (value: T) => {
    if (output.hasResolved) {
      throw new Error("Cannot set value multiple times");
    }
    output.resolve(value);
    output.hasResolved = true;
  };

  return [output.promise, setValue];
}
