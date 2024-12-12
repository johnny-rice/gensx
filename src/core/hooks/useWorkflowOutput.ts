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

export function createWorkflowOutput<T>(
  _initialValue: T
): [Promise<T>, (value: T) => void] {
  const outputId = generateStableId();
  console.log(`Creating workflow output ${outputId}`);

  if (!workflowOutputs.has(outputId)) {
    let resolvePromise: (value: T) => void;
    let rejectPromise: (error: any) => void;
    const promise = new Promise<T>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Add a timeout to detect unresolved promises
    const timeoutId = setTimeout(() => {
      if (!workflowOutputs.get(outputId)?.hasResolved) {
        console.error(`Output ${outputId} was not resolved within 5 seconds`);
        rejectPromise(
          new Error(`Output ${outputId} timed out waiting for resolution`)
        );
      }
    }, 5000);

    workflowOutputs.set(outputId, {
      promise,
      resolve: (value: T) => {
        console.log(`Setting value for output ${outputId}:`, value);
        clearTimeout(timeoutId);
        if (workflowOutputs.get(outputId)?.hasResolved) {
          console.error(`Output ${outputId} has already been resolved!`);
          throw new Error("Cannot set value multiple times");
        }
        resolvePromise(value);
        workflowOutputs.get(outputId)!.hasResolved = true;
        console.log(`Successfully resolved output ${outputId}`);
      },
      hasResolved: false,
    });
  }

  const output = workflowOutputs.get(outputId)!;
  return [output.promise, output.resolve];
}
