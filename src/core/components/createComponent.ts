import React, { useContext, useRef } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "../context/ExecutionContext";
import { StepContext } from "../context/StepContext";

// Helper function to deeply resolve promises
async function resolveValue<T>(value: T | Promise<T>): Promise<T> {
  let resolved = value;
  while (resolved instanceof Promise) {
    resolved = await resolved;
  }
  return resolved;
}

// Type that allows either T or Promise<T> for each input
type PromiseWrapped<T> = {
  [K in keyof T]: T[K] | Promise<T[K]>;
};

type ComponentExecutor<TInputs> = (inputs: TInputs) => Promise<void>;

export function createComponent<TInputs extends Record<string, any>>(
  executor: ComponentExecutor<TInputs>
) {
  // Component accepts either T or Promise<T> for each prop
  return function (props: PromiseWrapped<TInputs>): React.ReactElement | null {
    const stepContext = useContext(StepContext);
    if (!stepContext) {
      throw new Error("Component must be used within a Workflow.");
    }

    // Use ref to ensure we only add the step once
    const stepAdded = useRef(false);

    if (!stepAdded.current) {
      console.log("Adding step to context");
      const step: Step<Record<string, any>> = {
        async execute(
          context: ExecutionContext<Record<string, any>>
        ): Promise<void> {
          console.log("Executing step");

          // Create an object to hold the resolved values
          const resolvedProps = {} as TInputs;

          // Wait for all promises to resolve before proceeding
          await Promise.all(
            Object.entries(props).map(async ([key, value]) => {
              resolvedProps[key as keyof TInputs] = await resolveValue(value);
            })
          );

          // Now call executor with fully resolved props
          await executor(resolvedProps);
        },
      };

      stepContext.steps.push(step);
      stepAdded.current = true;
    }

    return null;
  };
}
