import React from "react";
import { Step } from "./Step";

type ComponentType<P> =
  | React.ComponentType<P>
  | ((props: P) => React.ReactElement | null);

type PromiseType<T> = T extends Promise<infer U> ? U : T;

type WorkflowProps<P> = {
  [K in keyof P]: P[K] | Promise<P[K]>;
};

export function createComponent<TProps extends Record<string, any>>(
  implementation: (props: {
    [K in keyof TProps]: TProps[K];
  }) => void | Promise<void>
): ComponentType<WorkflowProps<TProps>> {
  const Component = (props: WorkflowProps<TProps>): React.ReactElement => {
    const step: Step = {
      async execute() {
        try {
          const resolvedProps = {} as TProps;

          // Resolve all props in sequence to maintain dependency order
          for (const [key, value] of Object.entries(props)) {
            try {
              resolvedProps[key as keyof TProps] = await resolveValue(value);
            } catch (error) {
              throw error;
            }
          }

          await implementation(resolvedProps);
        } catch (error) {
          throw error;
        }
      },
    };

    return React.createElement("div", {
      "data-workflow-step": true,
      step,
      style: { display: "none" },
    });
  };

  Component.displayName = implementation.name + "Component";
  return Component;
}

async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  return await value;
}
