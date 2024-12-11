import { useEffect } from "react";

type WorkflowComponent<TProps> = {
  (props: TProps): React.ReactElement;
};

export function defineWorkflow<TProps extends object>(
  Component: (props: TProps) => React.ReactElement
): WorkflowComponent<TProps> {
  const WorkflowComponent = ((props: TProps) => {
    return Component(props);
  }) as WorkflowComponent<TProps>;

  return WorkflowComponent;
}

// Helper function to deeply resolve promises
async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  let resolved = value;
  while (resolved instanceof Promise) {
    resolved = await resolved;
  }
  return resolved;
}

export function createComponent<TProps extends object>(
  // Implementation receives resolved props - no promises
  implementation: (props: {
    [K in keyof TProps]: Awaited<TProps[K]>;
  }) => void | Promise<void>
) {
  // Component can receive props that may contain promises
  return (props: TProps) => {
    useEffect(() => {
      const executeComponent = async () => {
        try {
          // Create an object to hold the resolved values
          const resolvedProps = {} as {
            [K in keyof TProps]: Awaited<TProps[K]>;
          };

          // Wait for all promises to resolve before proceeding
          await Promise.all(
            Object.entries(props).map(async ([key, value]) => {
              resolvedProps[key as keyof TProps] = await resolveValue(value);
            })
          );

          // Now call implementation with fully resolved props
          await implementation(resolvedProps);
        } catch (error) {
          console.error("Error in component:", error);
        }
      };

      executeComponent();
    }, [props]);

    return null;
  };
}
