type WorkflowOutput<T> = Map<
  string,
  {
    promise: Promise<T>;
    resolve: (value: T) => void;
    hasResolved: boolean;
  }
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const workflowOutputs: WorkflowOutput<any> = new Map();

let counter = 0;
function generateStableId() {
  return `output_${counter++}`;
}

export function createWorkflowOutput<T>(
  _initialValue: T,
): [Promise<T>, (value: T) => void] {
  const outputId = generateStableId();

  if (!workflowOutputs.has(outputId)) {
    let resolvePromise: (value: T) => void;
    let rejectPromise: (error: unknown) => void;
    const promise = new Promise<T>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    // Only add timeout if WORKFLOW_TIMEOUT is set
    let timeoutId: NodeJS.Timeout | undefined;
    if (process.env.WORKFLOW_TIMEOUT === "true") {
      timeoutId = setTimeout(() => {
        if (!workflowOutputs.get(outputId)?.hasResolved) {
          console.error(`Output ${outputId} timed out without being resolved`);
          rejectPromise(
            new Error(`Output ${outputId} timed out waiting for resolution`),
          );
        }
      }, 5000);
    }

    workflowOutputs.set(outputId, {
      promise,
      resolve: (value: T) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (workflowOutputs.get(outputId)?.hasResolved) {
          throw new Error("Cannot set value multiple times");
        }
        resolvePromise(value);
        workflowOutputs.get(outputId)!.hasResolved = true;
      },
      hasResolved: false,
    });
  }

  const output = workflowOutputs.get(outputId)!;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return [output.promise, output.resolve] as const;
}
