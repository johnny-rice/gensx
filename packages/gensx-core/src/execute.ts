import { ExecutionContext, getCurrentContext, withContext } from "./context.js";
import { resolveDeep } from "./resolve.js";
import {
  ExecutableValue,
  GsxComponent,
  GsxStreamComponent,
  Streamable,
} from "./types.js";

/**
 * Executes a JSX element or any other value, ensuring all promises and nested values are resolved.
 * This is the main entry point for executing workflow components.
 */

export async function execute<T>(element: ExecutableValue): Promise<T> {
  const context = getCurrentContext().getWorkflowContext();
  const result = (await resolveDeep(element)) as T;
  context.checkpointManager.write();
  return result;
}

type RunResult<P> = P extends { stream: true }
  ? Promise<Streamable>
  : Promise<string>;

// Overload for GsxComponent
export function Workflow<P, O>(
  name: string,
  component: GsxComponent<P, O>,
  opts?: {
    printUrl?: boolean;
    metadata?: Record<string, unknown>;
  },
): {
  run: (
    props: P,
    runOpts?: {
      printUrl?: boolean;
      metadata?: Record<string, unknown>;
      workflowName?: string;
    },
  ) => Promise<O>;
  name: string;
};

// Overload for GsxStreamComponent
export function Workflow<P extends { stream?: boolean }>(
  name: string,
  component: GsxStreamComponent<P>,
  opts?: {
    printUrl?: boolean;
    metadata?: Record<string, unknown>;
  },
): {
  run: <T extends P>(
    props: T,
    runOpts?: {
      printUrl?: boolean;
      metadata?: Record<string, unknown>;
      workflowName?: string;
    },
  ) => RunResult<T>;
  name: string;
};

// Overload for GsxComponent or GsxStreamComponent
export function Workflow<
  P extends object & { stream?: boolean; length?: never },
  O,
>(
  name: string,
  component: GsxComponent<P, O> | GsxStreamComponent<P>,
  opts?: {
    printUrl?: boolean;
    metadata?: Record<string, unknown>;
  },
): {
  run: (
    props: P,
    runOpts?: {
      printUrl?: boolean;
      metadata?: Record<string, unknown>;
      workflowName?: string;
    },
  ) => Promise<O | Streamable | string>;
  name: string;
} {
  return {
    name,
    run: async (props, runOpts = {}) => {
      const context = new ExecutionContext({});

      const mergedOpts = {
        ...opts,
        ...runOpts,
        ...(opts?.metadata
          ? { metadata: { ...opts.metadata, ...runOpts.metadata } }
          : { metadata: runOpts.metadata }),
      };

      const workflowContext = context.getWorkflowContext();
      workflowContext.checkpointManager.setPrintUrl(
        mergedOpts.printUrl ?? false,
      );
      // Use the overridden name from componentOpts if provided
      const workflowName = runOpts.workflowName ?? name;
      workflowContext.checkpointManager.setWorkflowName(workflowName);

      let result: O | Streamable | string | undefined;
      let error: unknown;
      try {
        result = await withContext(context, async () => {
          const componentResult = await component(props);
          const resolved = await resolveDeep<O | Streamable | string>(
            componentResult,
          );
          return resolved;
        });
      } catch (e) {
        error = e;
      }

      const rootId = workflowContext.checkpointManager.root?.id;
      if (rootId) {
        if (mergedOpts.metadata) {
          workflowContext.checkpointManager.addMetadata(
            rootId,
            mergedOpts.metadata,
          );
        }
      } else {
        console.warn(
          "No root checkpoint found for workflow after execution",
          workflowName,
        );
      }
      await workflowContext.checkpointManager.waitForPendingUpdates();

      if (error) {
        throw error as Error;
      }
      return result as O | Streamable | string;
    },
  };
}
