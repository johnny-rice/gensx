// src/createComponent.ts
import React, { useContext } from "react";
import { Step } from "./Step";
import { ExecutionContext } from "../context/ExecutionContext";
import { StepContext } from "../context/StepContext";
import { RefType, isRef } from "../types/ref";
import { OutputRefs } from "../types/outputs";

type InputResolver<TInputs> = {
  [K in keyof TInputs]: TInputs[K] | RefType<TInputs[K]>;
};

type OutputMapping<TOutputs, TRefs> = {
  [K in keyof TOutputs]: keyof TRefs;
};

type ComponentExecutor<TInputs, TOutputs> = (
  inputs: TInputs
) => Promise<TOutputs>;

export function createComponent<
  TInputs extends Record<string, any>,
  TOutputs extends Record<string, any>,
  TRefs extends Record<string, any>
>(
  executor: ComponentExecutor<TInputs, TOutputs>,
  // Optional custom mapping - if not provided, uses the output keys directly
  outputMappings?: Partial<OutputMapping<TOutputs, TRefs>>
) {
  return function (
    props: InputResolver<TInputs> & { outputs: OutputRefs<TOutputs> }
  ): React.ReactElement | null {
    const stepContext = useContext(StepContext);
    if (!stepContext) {
      throw new Error("Component must be used within a Workflow.");
    }

    const step: Step<TRefs> = {
      async execute(context: ExecutionContext<TRefs>): Promise<void> {
        // Execute component logic
        const resolvedInputs = Object.entries(props).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: isRef(value)
              ? context.getRef(value.__ref as keyof TRefs)
              : value,
          }),
          {}
        ) as TInputs;

        const outputs = await executor(resolvedInputs);

        // Use provided outputs mapping or fall back to direct key mapping
        Object.entries(outputs).forEach(([key, value]) => {
          const refKey = props.outputs[key];
          context.setRef(refKey as keyof TRefs, value);
        });
      },
    };

    stepContext.steps.push(step);
    return null;
  };
}
